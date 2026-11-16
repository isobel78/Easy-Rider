import { createFileRoute, ClientOnly } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { lazy, Suspense, useState } from "react";
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
  const [res, setRes] = useState<Result | null>(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function go(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr("");
    try { setRes(await plan({ data: { from, to, maxMph } })); }
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
          <Field label="Start" value={from} onChange={setFrom} placeholder="e.g. Piedmont Park, Atlanta" />
          <Field label="Destination" value={to} onChange={setTo} placeholder="e.g. Decatur Square, GA" />
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
            <RouteMap path={res?.path ?? null} />
          </Suspense>
        </ClientOnly>
      </main>
    </div>
  );
}

function Field(p: { label: string; value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <label className="block text-xs uppercase tracking-wider text-muted-foreground">
      {p.label}
      <input required value={p.value} onChange={(e) => p.onChange(e.target.value)} placeholder={p.placeholder}
        className="mt-1 w-full rounded-md border border-input bg-card px-3 py-2.5 text-base normal-case tracking-normal text-foreground" />
    </label>
  );
}
function Stat({ n, u }: { n: string; u: string }) {
  return <div><div className="font-display text-3xl">{n}</div><div className="text-xs text-muted-foreground uppercase">{u}</div></div>;
}
