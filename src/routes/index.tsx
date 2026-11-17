import { createFileRoute, ClientOnly } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { lazy, Suspense, useEffect, useState } from "react";
import { PlaceInput, type Place } from "@/components/PlaceInput";
import { planRoute } from "@/lib/route.functions";
import { Button } from "@/components/ui/button";
import { ArrowRight, LocateFixed, MapPin, Sparkles, Navigation, ExternalLink } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { navigationLinks } from "@/lib/navigation-links";
import scooter from "@/assets/metropolitan-side.jpeg.asset.json";

const RouteMap = lazy(() => import("@/components/RouteMap"));

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Easy Rider — Moped-friendly route planner" },
      { name: "description", content: "Plan routes that stick to slower roads, built for 49cc mopeds and scooters." },
      { property: "og:title", content: "Easy Rider — Moped-friendly route planner" },
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
  const [navigationOpen, setNavigationOpen] = useState(false);
  const links = res ? navigationLinks(res.path) : null;

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
    <div className="easy-rider flex min-h-screen md:h-screen flex-col bg-background text-foreground">
      <header className="scooter-header relative flex shrink-0 items-center justify-between overflow-hidden border-b-2 border-foreground px-6 md:px-10">
        <div className="relative z-10">
          <div className="mb-1 flex items-center gap-2 text-xs font-bold uppercase"><span className="italian-stripe" /> The slow-road club</div>
          <h1 className="rider-logo font-display">Easy Rider</h1>
          <p className="mt-2 text-sm font-semibold">Little scooter. Big adventure.</p>
        </div>
        <div className="scooter-art relative self-stretch" aria-hidden="true">
          <span className="mod-flower"><Sparkles /></span>
          <img src={scooter.url} alt="" className="h-full w-full object-contain mix-blend-multiply" />
          <span className="scooter-stamp">Ciao,<br />let’s go!</span>
        </div>
      </header>
      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
      <aside className="order-2 md:order-1 w-full md:w-[380px] shrink-0 md:overflow-y-auto border-r-2 border-border p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <h2 className="text-xl font-bold">Where to, rider?</h2>
          <MapPin className="size-5 text-stripe" aria-hidden="true" />
        </div>
        <form onSubmit={go} className="space-y-3">
          <PlaceInput label="Start" text={from} onText={setFrom} onPick={setFromPl} picked={!!fromPl} near={me}
            placeholder="Business, place or address"
            action={<Button variant="ghost" size="sm" type="button" onClick={() => locate(true)} disabled={locating}
              className="h-7 px-1 normal-case text-primary font-semibold">
              <LocateFixed />{locating ? "Locating…" : "Use my location"}</Button>} />
          <PlaceInput label="Destination" text={to} onText={setTo} onPick={setToPl} picked={!!toPl} near={me}
            placeholder="e.g. Starbucks, Piedmont Park" />
          <label className="block text-xs uppercase tracking-wider text-muted-foreground">
            Max road speed: <span className="text-foreground font-semibold">{maxMph} mph</span>
            <input type="range" min={25} max={45} step={5} value={maxMph}
              onChange={(e) => setMaxMph(+e.target.value)} className="w-full accent-[var(--primary)] mt-2" />
          </label>
          <Button variant="destructive" disabled={busy} className="ride-button h-12 w-full rounded-full text-base font-bold">
            {busy ? "Finding slow roads…" : "Plan moped route"}<ArrowRight />
          </Button>
        </form>
        {err && <p className="rounded-md bg-destructive/10 text-destructive p-3 text-sm">{err}</p>}
        {res && (
          <div className="space-y-3">
            <div className="flex gap-6">
              <Stat n={res.miles.toFixed(1)} u="miles" /><Stat n={String(res.minutes)} u="min" />
            </div>
            {links && <Button variant="outline" className="w-full" onClick={() => setNavigationOpen(true)}>
              <Navigation /> Driving directions <ExternalLink />
            </Button>}
            <ol className="space-y-2 text-sm">
              {res.steps.map((s, i) => (
                <li key={i} className="flex gap-3 border-b border-border pb-2">
                  <span className="text-stripe font-bold w-5">{i + 1}</span>
                  <Button variant="link" className="h-auto flex-1 justify-start whitespace-normal p-0 text-left text-foreground" onClick={() => setNavigationOpen(true)}>{s.text}</Button>
                  {s.miles > 0 && <span className="text-muted-foreground font-mono">{s.miles.toFixed(1)}</span>}
                </li>
              ))}
            </ol>
          </div>
        )}
         <p className="border-t border-border pt-4 text-xs leading-relaxed text-muted-foreground">Prototype: avoids highways and major roads using OpenStreetMap data. Speed limits aren't mapped everywhere — always follow posted signs.</p>
      </aside>
      <main aria-label="Route map" className="relative order-1 md:order-2 h-[38vh] min-h-[260px] md:h-auto md:flex-1 z-0">
        <ClientOnly fallback={<div className="h-full bg-muted" />}>
          <Suspense fallback={<div className="h-full bg-muted" />}>
            <RouteMap path={res?.path ?? null} me={me} />
          </Suspense>
        </ClientOnly>
        <div className="map-label pointer-events-none absolute bottom-5 left-5 z-[500] flex items-center gap-2 rounded-full border border-foreground bg-card px-4 py-2 text-xs font-bold"><span className="size-2 rounded-full bg-primary" /> Life in the slow lane</div>
      </main>
      </div>
      <Dialog open={navigationOpen} onOpenChange={setNavigationOpen}>
        <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-md">
          <DialogTitle>Open driving directions</DialogTitle>
          <DialogDescription>Google Maps and Apple Maps calculate their own route, not the Easy Rider route. They may use roads over 40 mph. Check the route and posted speed limits before riding.</DialogDescription>
          {links && <div className="flex flex-col gap-3">
            <Button asChild><a href={links.google} target="_blank" rel="noopener noreferrer"><ExternalLink /> Google Maps</a></Button>
            <Button asChild variant="outline"><a href={links.apple} target="_blank" rel="noopener noreferrer"><ExternalLink /> Apple Maps</a></Button>
          </div>}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Stat({ n, u }: { n: string; u: string }) {
  return <div><div className="font-display text-3xl">{n}</div><div className="text-xs text-muted-foreground uppercase">{u}</div></div>;
}
