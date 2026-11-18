import { describe, expect, it } from "vitest";
import { navigationProgress, routeDistances, type Coordinate } from "@/lib/live-navigation";

const path: Coordinate[] = [[33.75, -84.39], [33.751, -84.39], [33.752, -84.39]];
const steps = [{ text: "Start", beginIndex: 0, miles: 0.07 }, { text: "Turn", beginIndex: 1, miles: 0.07 }, { text: "Arrive", beginIndex: 2, miles: 0 }];
const distances = routeDistances(path);
describe("live route guidance", () => {
  it("advances the upcoming maneuver along the original route", () => {
    expect(navigationProgress(path, distances, steps, [33.7502, -84.39]).nextIndex).toBe(1);
    expect(navigationProgress(path, distances, steps, [33.7512, -84.39]).nextIndex).toBe(2);
  });
  it("does not advance while off route", () => {
    const result = navigationProgress(path, distances, steps, [33.7515, -84.4], 30);
    expect(result.offRoute).toBe(true);
    expect(result.progress).toBe(30);
    expect(result.arrived).toBe(false);
  });
  it("arrives at the original endpoint, not a point nearby on another road", () => {
    expect(navigationProgress(path, distances, steps, [33.752, -84.39]).arrived).toBe(true);
    expect(navigationProgress(path, distances, steps, [33.752, -84.391]).arrived).toBe(false);
  });
  it("does not rewind completed progress due to GPS jitter", () => {
    expect(navigationProgress(path, distances, steps, [33.7501, -84.39], 80).progress).toBe(80);
  });
});