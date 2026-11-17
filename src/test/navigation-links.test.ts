import { describe, expect, it } from "vitest";
import { navigationLinks } from "@/lib/navigation-links";

describe("Navigation handoff", () => {
  const path: [number, number][] = [[33.749, -84.388], [33.775, -84.296]];
  it("opens Google driving navigation for the planned endpoints", () => {
    const links = navigationLinks(path);
    const url = new URL(links?.google ?? "https://invalid.test");
    expect(url.hostname).toBe("www.google.com");
    expect(url.searchParams.get("origin")).toBe("33.749,-84.388");
    expect(url.searchParams.get("destination")).toBe("33.775,-84.296");
    expect(url.searchParams.get("dir_action")).toBe("navigate");
    expect(url.searchParams.get("avoid")).toBe("highways");
  });
  it("opens Apple driving directions for the planned endpoints", () => {
    const url = new URL(navigationLinks(path)?.apple ?? "https://invalid.test");
    expect(url.hostname).toBe("maps.apple.com");
    expect(url.searchParams.get("saddr")).toBe("33.749,-84.388");
    expect(url.searchParams.get("daddr")).toBe("33.775,-84.296");
    expect(url.searchParams.get("dirflg")).toBe("d");
  });
  it("does not create navigation links without a route", () => {
    expect(navigationLinks([])).toBeNull();
  });
});