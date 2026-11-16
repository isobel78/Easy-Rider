import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { searchPlaces } from "@/lib/route.functions";

export type Place = { lat: number; lon: number; label: string };
type Hit = Place & { name: string; detail: string };

export function PlaceInput(p: {
  label: string; placeholder: string; text: string; onText: (v: string) => void;
  onPick: (pl: Place | null) => void; picked: boolean; near: [number, number] | null; action?: React.ReactNode;
}) {
  const search = useServerFn(searchPlaces);
  const [hits, setHits] = useState<Hit[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const skip = useRef(false);
  useEffect(() => {
    if (skip.current || p.picked) { skip.current = false; setOpen(false); return; }
    const q = p.text.trim();
    if (q.length < 2) { setHits([]); return; }
    let stale = false;
    const t = setTimeout(async () => {
      try {
        const r = await search({ data: { q, lat: p.near?.[0], lon: p.near?.[1] } });
        if (!stale) { setHits(r); setActive(-1); setOpen(true); }
      } catch { if (!stale) setHits([]); }
    }, 300);
    return () => { stale = true; clearTimeout(t); };
  }, [p.text]); // eslint-disable-line react-hooks/exhaustive-deps

  const pick = (h: Hit) => {
    skip.current = true;
    p.onText(h.label); p.onPick({ lat: h.lat, lon: h.lon, label: h.label });
    setOpen(false); setHits([]);
  };

  return (
    <div className="relative">
      <div className="flex items-center justify-between text-xs uppercase tracking-wider text-muted-foreground">
        <span>{p.label}</span>{p.action}
      </div>
      <input
        required value={p.text} placeholder={p.placeholder} autoComplete="off" role="combobox"
        aria-label={p.label} aria-expanded={open && hits.length > 0}
        onChange={(e) => { p.onText(e.target.value); p.onPick(null); }}
        onFocus={() => hits.length && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={(e) => {
          if (!open || !hits.length) return;
          if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => (a + 1) % hits.length); }
          else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => (a <= 0 ? hits.length - 1 : a - 1)); }
          else if (e.key === "Enter" && active >= 0) { e.preventDefault(); pick(hits[active]!); }
          else if (e.key === "Escape") setOpen(false);
        }}
        className="mt-1 w-full rounded-md border border-input bg-card px-3 py-2.5 text-base text-foreground"
      />
      {open && hits.length > 0 && (
        <ul role="listbox" className="absolute z-[1000] mt-1 w-full overflow-hidden rounded-md border border-border bg-card shadow-lg">
          {hits.map((h, i) => (
            <li key={`${h.lat},${h.lon},${i}`} role="option" aria-selected={i === active}
              onMouseDown={(e) => { e.preventDefault(); pick(h); }}
              className={`cursor-pointer px-3 py-2 ${i === active ? "bg-accent" : "hover:bg-accent"}`}>
              <div className="text-sm font-semibold text-foreground">{h.name}</div>
              {h.detail && <div className="text-xs text-muted-foreground truncate">{h.detail}</div>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
