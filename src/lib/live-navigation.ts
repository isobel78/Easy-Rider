import { lineString, point } from "@turf/helpers";
import nearestPointOnLine from "@turf/nearest-point-on-line";
import distance from "@turf/distance";

export type Coordinate = [number, number];
export type NavigationStep = { text: string; beginIndex: number; miles: number };
export function routeDistances(path: Coordinate[]) {
  let total = 0;
  return path.map((p, i) => {
    const previous = path[i - 1];
    if (previous) total += distance(point([previous[1], previous[0]]), point([p[1], p[0]]), { units: "meters" });
    return total;
  });
}

export function navigationProgress(path: Coordinate[], distances: number[], steps: NavigationStep[], position: Coordinate, previous = 0) {
  if (path.length < 2) throw new Error("This route has no navigable path");
  const snapped = nearestPointOnLine(lineString(path.map(([lat, lon]) => [lon, lat])), point([position[1], position[0]]), { units: "meters" });
  const offRoute = snapped.properties.dist > 60;
  const progress = offRoute ? previous : Math.max(previous, snapped.properties.location);
  const total = distances.at(-1) ?? 0;
  const remaining = Math.max(0, total - progress);
  const end = path.at(-1);
  const arrived = !offRoute && remaining < 25 && !!end && distance(point([position[1], position[0]]), point([end[1], end[0]]), { units: "meters" }) < 25;
  let nextIndex = steps.findIndex((step, index) => index > 0 && (distances[step.beginIndex] ?? total) > progress + 10);
  if (nextIndex < 0) nextIndex = Math.max(0, steps.length - 1);
  return { progress, remaining, offRoute, arrived, nextIndex, turnDistance: Math.max(0, (distances[steps[nextIndex]?.beginIndex ?? 0] ?? total) - progress) };
}

export function formatDistance(meters: number) {
  return meters < 160.934 ? `${Math.max(0, Math.round(meters * 3.28084 / 25) * 25)} ft` : `${(meters / 1609.344).toFixed(1)} mi`;
}