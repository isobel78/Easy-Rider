type Coordinate = [number, number];

export function navigationLinks(path: Coordinate[]) {
  const start = path[0];
  const end = path.at(-1);
  if (!start || !end) return null;
  const origin = start.join(",");
  const destination = end.join(",");
  return {
    google: `https://www.google.com/maps/dir/?${new URLSearchParams({ api: "1", origin, destination, travelmode: "driving", dir_action: "navigate", avoid: "highways" })}`,
    apple: `https://maps.apple.com/?${new URLSearchParams({ saddr: origin, daddr: destination, dirflg: "d" })}`,
  };
}