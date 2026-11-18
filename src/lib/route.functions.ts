import { createServerFn } from "@tanstack/react-start";

const UA = "moped-route-prototype/1.0";

async function geocode(q: string) {
  const r = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`,
    { headers: { "User-Agent": UA } },
  );
  if (!r.ok) throw new Error(`Address lookup failed (${r.status})`);
  const j = (await r.json()) as { lat: string; lon: string; display_name: string }[];
  const h = j[0];
  if (!h) throw new Error(`Couldn't find "${q}"`);
  return { lat: +h.lat, lon: +h.lon, name: h.display_name };
}

function decode(str: string, precision = 6): [number, number][] {
  let i = 0, lat = 0, lng = 0;
  const out: [number, number][] = [];
  const f = Math.pow(10, precision);
  while (i < str.length) {
    for (const k of [0, 1]) {
      let shift = 0, result = 0, b;
      do { b = str.charCodeAt(i++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
      const d = result & 1 ? ~(result >> 1) : result >> 1;
      if (k === 0) lat += d; else lng += d;
    }
    out.push([lat / f, lng / f]);
  }
  return out;
}

type Place = { lat: number; lon: number; label: string };
type Spot = string | Place;
const isPlace = (v: unknown): v is Place =>
  typeof v === "object" && v !== null && Number.isFinite((v as Place).lat) && Number.isFinite((v as Place).lon);
const resolve = async (s: Spot) =>
  typeof s === "string" ? geocode(s) : { lat: s.lat, lon: s.lon, name: s.label };

export const searchPlaces = createServerFn({ method: "GET" })
  .inputValidator((d: { q: string; lat?: number; lon?: number }) => {
    const q = String(d.q ?? "").trim().slice(0, 120);
    return { q, lat: Number.isFinite(d.lat) ? d.lat : undefined, lon: Number.isFinite(d.lon) ? d.lon : undefined };
  })
  .handler(async ({ data }) => {
    if (data.q.length < 2) return [];
    const bias = data.lat != null && data.lon != null ? `&lat=${data.lat}&lon=${data.lon}` : "";
    const r = await fetch(
      `https://photon.komoot.io/api/?limit=6&lang=en&q=${encodeURIComponent(data.q)}${bias}`,
      { headers: { "User-Agent": UA } },
    );
    if (!r.ok) throw new Error(`Place search failed (${r.status})`);
    const j = (await r.json()) as {
      features: { geometry: { coordinates: [number, number] }; properties: { name?: string; housenumber?: string; street?: string; city?: string; county?: string; state?: string } }[];
    };
    return j.features.map((f) => {
      const p = f.properties;
      const street = [p.housenumber, p.street].filter(Boolean).join(" ");
      const detail = [street, p.city ?? p.county, p.state].filter(Boolean).join(", ");
      const name = p.name ?? street ?? p.city ?? "Unnamed place";
      return { lat: f.geometry.coordinates[1], lon: f.geometry.coordinates[0], name, detail, label: detail ? `${name}, ${detail}` : name };
    });
  });

export const planRoute = createServerFn({ method: "POST" })
  .inputValidator((d: { from: Spot; to: Spot; maxMph: number }) => {
    const clean = (v: Spot): Spot => {
      if (isPlace(v)) return { lat: v.lat, lon: v.lon, label: String(v.label ?? "").slice(0, 200) };
      const t = String(v ?? "").trim();
      if (!t) throw new Error("Enter a start and destination");
      if (t.length > 200) throw new Error("Address too long");
      return t;
    };
    const maxMph = Math.min(55, Math.max(15, Number(d.maxMph) || 40));
    return { from: clean(d.from), to: clean(d.to), maxMph };
  })
  .handler(async ({ data }) => {
    const [a, b] = await Promise.all([resolve(data.from), resolve(data.to)]);
    const kph = Math.round(data.maxMph * 1.609);
    const r = await fetch("https://valhalla1.openstreetmap.de/route", {
      method: "POST",
      headers: { "Content-Type": "application/json", "User-Agent": UA },
      body: JSON.stringify({
        locations: [{ lat: a.lat, lon: a.lon }, { lat: b.lat, lon: b.lon }],
        costing: "motor_scooter",
        costing_options: {
          motor_scooter: { top_speed: kph, use_primary: 0, use_highways: 0, use_tolls: 0 },
        },
        units: "miles",
      }),
    });
    if (!r.ok) throw new Error(`No moped-friendly route found (${r.status}): ${(await r.text()).slice(0, 200)}`);
    const j = await r.json();
    const leg = j.trip.legs[0];
    return {
      from: a, to: b,
      path: decode(leg.shape),
      miles: j.trip.summary.length as number,
      minutes: Math.round(j.trip.summary.time / 60),
      steps: (leg.maneuvers as { instruction: string; length: number; begin_shape_index: number }[]).map((m) => ({
        text: m.instruction, miles: m.length, beginIndex: m.begin_shape_index,
      })),
    };
  });
