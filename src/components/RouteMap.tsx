import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export default function RouteMap({ path, me, navigating = false, heading = null, follow = true, onPan }: { path: [number, number][] | null; me: [number, number] | null; navigating?: boolean; heading?: number | null; follow?: boolean; onPan?: () => void }) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const layer = useRef<L.LayerGroup | null>(null);
  const pan = useRef(onPan);
  pan.current = onPan;
  useEffect(() => {
    if (!el.current || map.current) return;
    map.current = L.map(el.current).setView([33.749, -84.388], 11);
    map.current.on("dragstart", () => pan.current?.());
    map.current.zoomControl.setPosition("bottomright");
    const observer = new ResizeObserver(() => map.current?.invalidateSize());
    observer.observe(el.current);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors", maxZoom: 19,
    }).addTo(map.current);
    layer.current = L.layerGroup().addTo(map.current);
    return () => { observer.disconnect(); map.current?.remove(); map.current = null; };
  }, []);
  const meLayer = useRef<L.Layer | null>(null);
  useEffect(() => {
    if (!map.current || !me) return;
    meLayer.current?.remove();
    const css = getComputedStyle(document.documentElement);
    meLayer.current = (navigating ? L.marker(me, { icon: L.divIcon({ className: "rider-marker", html: `<span class="rider-direction" style="transform: rotate(${Number.isFinite(heading) ? heading : 0}deg)">▲</span>`, iconSize: [34, 34], iconAnchor: [17, 17] }) }) : L.circleMarker(me, { radius: 7, color: css.getPropertyValue("--card").trim(), weight: 3, fillColor: css.getPropertyValue("--primary").trim(), fillOpacity: 1 }))
      .bindTooltip("You are here").addTo(map.current);
    if (navigating && follow) map.current.setView(me, 17, { animate: false });
    else if (!path?.length) map.current.setView(me, 14);
  }, [me, navigating, heading, follow, path]);
  useEffect(() => {
    if (!map.current || !layer.current) return;
    layer.current.clearLayers();
    if (!path?.length) return;
    const color = getComputedStyle(document.documentElement).getPropertyValue("--route").trim();
    const line = L.polyline(path, { color, weight: 6, opacity: 0.9 }).addTo(layer.current);
    const group = layer.current;
    const dot = (p: [number, number], fill: string) =>
      L.circleMarker(p, { radius: 8, color: getComputedStyle(document.documentElement).getPropertyValue("--foreground").trim(), weight: 2, fillColor: fill, fillOpacity: 1 }).addTo(group);
    const first = path[0]; const last = path.at(-1);
    if (first) dot(first, getComputedStyle(document.documentElement).getPropertyValue("--primary").trim());
    if (last) dot(last, color);
    map.current.fitBounds(line.getBounds(), { padding: [40, 40] });
  }, [path]);
  return <div ref={el} className="h-full w-full" />;
}
