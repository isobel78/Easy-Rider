import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useLiveNavigation } from "@/hooks/use-live-navigation";
import type { Coordinate } from "@/lib/live-navigation";

const route = { path: [[33.75, -84.39], [33.751, -84.39], [33.752, -84.39]] as Coordinate[], steps: [{ text: "Start", beginIndex: 0, miles: 0.1 }, { text: "Arrive", beginIndex: 2, miles: 0 }] };
let success: PositionCallback;
let failure: PositionErrorCallback | null;
const clearWatch = vi.fn();
const release = vi.fn(async () => {});
const request = vi.fn(async () => Object.assign(new EventTarget(), { release }));
function fix(lat: number, accuracy = 5) {
  act(() => success({ coords: { latitude: lat, longitude: -84.39, accuracy, altitude: null, altitudeAccuracy: null, heading: null, speed: null, toJSON: () => ({}) }, timestamp: Date.now(), toJSON: () => ({}) }));
}
beforeEach(() => {
  vi.clearAllMocks();
  Object.defineProperty(navigator, "geolocation", { configurable: true, value: { watchPosition: (s: PositionCallback, e: PositionErrorCallback) => { success = s; failure = e; return 17; }, clearWatch } });
  Object.defineProperty(navigator, "wakeLock", { configurable: true, value: { request } });
  Object.defineProperty(document, "visibilityState", { configurable: true, value: "visible" });
});
afterEach(() => vi.restoreAllMocks());
describe("navigation resource lifecycle", () => {
  it("starts tracking and releases GPS and screen lock on stop", async () => {
    const { result, unmount } = renderHook(() => useLiveNavigation(route));
    act(() => result.current.start());
    await waitFor(() => expect(result.current.awake).toBe("Screen staying awake"));
    fix(33.7501);
    expect(result.current.progress?.nextIndex).toBe(1);
    act(() => result.current.stop());
    expect(clearWatch).toHaveBeenCalledWith(17);
    expect(release).toHaveBeenCalledTimes(1);
    unmount();
  });
  it("automatically ends tracking and releases the screen at arrival", async () => {
    const { result, unmount } = renderHook(() => useLiveNavigation(route));
    act(() => result.current.start());
    await waitFor(() => expect(result.current.awake).toBe("Screen staying awake"));
    fix(33.752);
    expect(result.current.arrived).toBe(true);
    expect(result.current.active).toBe(false);
    expect(clearWatch).toHaveBeenCalledWith(17);
    expect(release).toHaveBeenCalledTimes(1);
    unmount();
  });
  it("pauses progress for inaccurate GPS and stops after permission denial", () => {
    const { result, unmount } = renderHook(() => useLiveNavigation(route));
    act(() => result.current.start());
    fix(33.752, 100);
    expect(result.current.progress).toBeNull();
    expect(result.current.arrived).toBe(false);
    act(() => failure?.({ code: 1, message: "denied", PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3 }));
    expect(result.current.active).toBe(false);
    expect(result.current.error).toContain("permission was denied");
    expect(clearWatch).toHaveBeenCalledWith(17);
    unmount();
  });
  it("reacquires a released wake lock when the page becomes visible", async () => {
    const { result, unmount } = renderHook(() => useLiveNavigation(route));
    act(() => result.current.start());
    await waitFor(() => expect(request).toHaveBeenCalledTimes(1));
    const lock = await request.mock.results[0]?.value;
    act(() => lock?.dispatchEvent(new Event("release")));
    act(() => document.dispatchEvent(new Event("visibilitychange")));
    await waitFor(() => expect(request).toHaveBeenCalledTimes(2));
    unmount();
    expect(clearWatch).toHaveBeenCalledWith(17);
  });
});