import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { searchPlaces } from "@/lib/route.functions";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

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
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (skip.current || p.picked) { skip.current = false; setOpen(false); return; }
    const q = p.text.trim();
    if (q.length < 2) { setHits([]); return; }
    let stale = false;
    const t = setTimeout(async () => {
      try {
        const r = await search({ data: p.near ? { q, lat: p.near[0], lon: p.near[1] } : { q } });
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
      <div className="relative mt-1">
      <input ref={input}
        required value={p.text} placeholder={p.placeholder} autoComplete="off" role="combobox"
        aria-label={p.label} aria-expanded={open && hits.length > 0}
        onChange={(e) => { p.onText(e.target.value); p.onPick(null); }}
        onFocus={() => hits.length && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={(e) => {
          if (!open || !hits.length) return;
          if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => (a + 1) % hits.length); }
          else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => (a <= 0 ? hits.length - 1 : a - 1)); }
          else if (e.key === "Enter" && active >= 0) { const hit = hits[active]; if (hit) { e.preventDefault(); pick(hit); } }
          else if (e.key === "Escape") setOpen(false);
        }}
        className="w-full rounded-full border-2 border-input bg-card pl-4 pr-12 py-3 text-base text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
      />
      {p.text && <Button type="button" variant="ghost" size="icon"
        aria-label={`Clear ${p.label.toLowerCase()}`} title={`Clear ${p.label.toLowerCase()}`}
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full text-muted-foreground"
        onClick={() => {
          skip.current = false;
          p.onText(""); p.onPick(null);
          setHits([]); setOpen(false); setActive(-1);
          input.current?.focus();
        }}><X aria-hidden="true" /></Button>}
      </div>
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
