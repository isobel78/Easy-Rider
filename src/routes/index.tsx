import { createFileRoute, ClientOnly } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { lazy, Suspense, useEffect, useState } from "react";
import { PlaceInput, type Place } from "@/components/PlaceInput";
import { planRoute } from "@/lib/route.functions";

const RouteMap = lazy(() => import("@/components/RouteMap"));

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Putt — Moped-safe route planner" },
      { name: "description", content: "Plan routes that stick to slower roads, built for 49cc mopeds and scooters." },
      { property: "og:title", content: "Putt — Moped-safe route planner" },
      { property: "og:description", content: "Routes that avoid highways and fast roads for 49cc mopeds." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

type Result = Awaited<ReturnType<typeof planRoute>>;

function Index() {
  const plan = useServerFn(planRoute);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [maxMph, setMaxMph] = useState(40);
  const [fromPl, setFromPl] = useState<Place | null>(null);
  const [toPl, setToPl] = useState<Place | null>(null);
  const [me, setMe] = useState<[number, number] | null>(null);
  const [locating, setLocating] = useState(false);
  const [res, setRes] = useState<Result | null>(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  function locate(useAsStart: boolean) {
    if (!navigator.geolocation) { setErr("Your browser can't share your location"); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const c: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setMe(c); setLocating(false);
        if (useAsStart) { setFrom("My location"); setFromPl({ lat: c[0], lon: c[1], label: "My location" }); }
      },
      () => { setLocating(false); if (useAsStart) setErr("Couldn't get your location — check location permission"); },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }
  useEffect(() => { locate(false); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function go(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr("");
    try { setRes(await plan({ data: { from: fromPl ?? from, to: toPl ?? to, maxMph } })); }
    catch (x) { setErr(x instanceof Error ? x.message : "Something went wrong"); }
    finally { setBusy(false); }
  }

  return (
    <div className="flex min-h-screen md:h-screen flex-col md:flex-row bg-background text-foreground">
      <aside className="order-2 md:order-1 w-full md:w-[400px] shrink-0 md:overflow-y-auto border-r border-border p-6 space-y-5">
        <div>
          <h1 className="font-display text-4xl tracking-tight">Putt<span className="text-primary">.</span></h1>
          <p className="text-sm text-muted-foreground mt-1">Routes for 49cc mopeds — no highways, no fast roads.</p>
        </div>
        <form onSubmit={go} className="space-y-3">
          <PlaceInput label="Start" text={from} onText={setFrom} onPick={setFromPl} picked={!!fromPl} near={me}
            placeholder="Business, place or address"
            action={<button type="button" onClick={() => locate(true)} disabled={locating}
              className="normal-case tracking-normal text-primary font-semibold disabled:opacity-60">
              {locating ? "Locating…" : "◎ Use my location"}</button>} />
          <PlaceInput label="Destination" text={to} onText={setTo} onPick={setToPl} picked={!!toPl} near={me}
            placeholder="e.g. Starbucks, Piedmont Park" />
          <label className="block text-xs uppercase tracking-wider text-muted-foreground">
            Max road speed: <span className="text-foreground font-semibold">{maxMph} mph</span>
            <input type="range" min={25} max={45} step={5} value={maxMph}
              onChange={(e) => setMaxMph(+e.target.value)} className="w-full accent-[var(--primary)] mt-2" />
          </label>
          <button disabled={busy} className="w-full rounded-md bg-primary text-primary-foreground py-3 font-semibold disabled:opacity-60">
            {busy ? "Finding slow roads…" : "Plan moped route"}
          </button>
        </form>
        {err && <p className="rounded-md bg-destructive/10 text-destructive p-3 text-sm">{err}</p>}
        {res && (
          <div className="space-y-3">
            <div className="flex gap-6">
              <Stat n={res.miles.toFixed(1)} u="miles" /><Stat n={String(res.minutes)} u="min" />
            </div>
            <ol className="space-y-2 text-sm">
              {res.steps.map((s, i) => (
                <li key={i} className="flex gap-3 border-b border-border pb-2">
                  <span className="text-primary font-mono w-5">{i + 1}</span>
                  <span className="flex-1">{s.text}</span>
                  {s.miles > 0 && <span className="text-muted-foreground font-mono">{s.miles.toFixed(1)}</span>}
                </li>
              ))}
            </ol>
          </div>
        )}
        <p className="text-xs text-muted-foreground">Prototype: avoids highways and major roads using OpenStreetMap data. Speed limits aren't mapped everywhere — always follow posted signs.</p>
      </aside>
      <main className="order-1 md:order-2 h-[45vh] md:h-auto md:flex-1 sticky top-0 md:static z-0">
        <ClientOnly fallback={<div className="h-full bg-muted" />}>
          <Suspense fallback={<div className="h-full bg-muted" />}>
            <RouteMap path={res?.path ?? null} me={me} />
          </Suspense>
        </ClientOnly>
      </main>
    </div>
  );
}

function Stat({ n, u }: { n: string; u: string }) {
  return <div><div className="font-display text-3xl">{n}</div><div className="text-xs text-muted-foreground uppercase">{u}</div></div>;
}
