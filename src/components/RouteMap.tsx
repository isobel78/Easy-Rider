import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export default function RouteMap({ path }: { path: [number, number][] | null }) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const layer = useRef<L.LayerGroup | null>(null);
  useEffect(() => {
    if (!el.current || map.current) return;
    map.current = L.map(el.current).setView([33.749, -84.388], 11);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors", maxZoom: 19,
    }).addTo(map.current);
    layer.current = L.layerGroup().addTo(map.current);
    return () => { map.current?.remove(); map.current = null; };
  }, []);
  useEffect(() => {
    if (!map.current || !layer.current) return;
    layer.current.clearLayers();
    if (!path?.length) return;
    const color = getComputedStyle(document.documentElement).getPropertyValue("--route").trim() || "orange";
    const line = L.polyline(path, { color, weight: 6, opacity: 0.9 }).addTo(layer.current);
    const dot = (p: [number, number], fill: string) =>
      L.circleMarker(p, { radius: 8, color: "#222", weight: 2, fillColor: fill, fillOpacity: 1 }).addTo(layer.current!);
    dot(path[0], "#3fbf6f"); dot(path[path.length - 1], "#e5484d");
    map.current.fitBounds(line.getBounds(), { padding: [40, 40] });
  }, [path]);
  return <div ref={el} className="h-full w-full" />;
}
