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

export const planRoute = createServerFn({ method: "POST" })
  .inputValidator((d: { from: string; to: string; maxMph: number }) => {
    if (!d.from?.trim() || !d.to?.trim()) throw new Error("Enter a start and end");
    if (d.from.length > 200 || d.to.length > 200) throw new Error("Address too long");
    const maxMph = Math.min(55, Math.max(15, Number(d.maxMph) || 40));
    return { from: d.from.trim(), to: d.to.trim(), maxMph };
  })
  .handler(async ({ data }) => {
    const [a, b] = await Promise.all([geocode(data.from), geocode(data.to)]);
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
      steps: (leg.maneuvers as { instruction: string; length: number }[]).map((m) => ({
        text: m.instruction, miles: m.length,
      })),
    };
  });
