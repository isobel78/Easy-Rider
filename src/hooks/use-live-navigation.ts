import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { navigationProgress, routeDistances, formatDistance, type Coordinate, type NavigationStep } from "@/lib/live-navigation";

type Route = { path: Coordinate[]; steps: NavigationStep[] };
type Fix = { position: Coordinate; heading: number | null };

export function useLiveNavigation(route: Route | null) {
  const [active, setActive] = useState(false);
  const [fix, setFix] = useState<Fix | null>(null);
  const [progress, setProgress] = useState<ReturnType<typeof navigationProgress> | null>(null);
  const [gps, setGps] = useState("Waiting for GPS…");
  const [awake, setAwake] = useState("Screen-awake off");
  const [voice, setVoice] = useState(false);
  const [arrived, setArrived] = useState(false);
  const [error, setError] = useState("");
  const [follow, setFollow] = useState(true);
  const distances = useMemo(() => route ? routeDistances(route.path) : [], [route]);
  const traveled = useRef(0);
  const spoken = useRef("");
  useEffect(() => { setArrived(false); setError(""); }, [route]);
  const stop = useCallback(() => { setActive(false); window.speechSynthesis?.cancel(); }, []);
  const start = useCallback(() => {
    if (!navigator.geolocation) { setError("This browser cannot share GPS location."); return; }
    if (!route || route.path.length < 2 || !route.steps.length) { setError("Plan a route first."); return; }
    traveled.current = 0; spoken.current = "";
    setProgress(null); setFix(null); setError(""); setArrived(false); setFollow(true); setGps("Waiting for GPS…"); setActive(true);
  }, [route]);

  useEffect(() => {
    if (!active || !route) return;
    let lastFix = Date.now();
    const id = navigator.geolocation.watchPosition((pos) => {
      if (pos.coords.accuracy > 50) { setGps("GPS accuracy is low — guidance paused"); return; }
      lastFix = Date.now();
      const position: Coordinate = [pos.coords.latitude, pos.coords.longitude];
      setFix({ position, heading: pos.coords.heading }); setGps("");
      const next = navigationProgress(route.path, distances, route.steps, position, traveled.current);
      traveled.current = next.progress; setProgress(next);
      if (next.arrived) { setArrived(true); setActive(false); }
    }, (e) => {
      if (e.code === 1) { setError("Location permission was denied. Allow location access, then start again."); setActive(false); }
      else setGps("GPS unavailable — guidance paused");
    }, { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 });
    const timer = window.setInterval(() => { if (Date.now() - lastFix > 15000) setGps("GPS signal lost — guidance paused"); }, 3000);
    return () => { navigator.geolocation.clearWatch(id); window.clearInterval(timer); };
  }, [active, route, distances]);

  useEffect(() => {
    if (!active) return;
    let disposed = false;
    let lock: WakeLockSentinel | null = null;
    let requesting = false;
    const request = async () => {
      if (document.visibilityState !== "visible" || requesting || lock) return;
      if (!("wakeLock" in navigator)) { setAwake("Screen-awake unavailable"); return; }
      requesting = true;
      try {
        const acquired = await navigator.wakeLock.request("screen");
        if (disposed) { await acquired.release(); return; }
        lock = acquired; setAwake("Screen staying awake");
        acquired.addEventListener("release", () => { if (lock === acquired) lock = null; if (!disposed) setAwake("Screen-awake released"); });
      } catch { if (!disposed) setAwake("Screen-awake unavailable — check power settings"); }
      finally { requesting = false; }
    };
    void request();
    document.addEventListener("visibilitychange", request);
    return () => { disposed = true; document.removeEventListener("visibilitychange", request); void lock?.release(); setAwake("Screen-awake off"); };
  }, [active]);

  useEffect(() => {
    if (!voice || !active || gps || !progress || !route || !("speechSynthesis" in window)) return;
    const bucket = progress.turnDistance <= 40 ? "now" : progress.turnDistance <= 200 ? "soon" : "ahead";
    const key = progress.offRoute ? "off-route" : `${progress.nextIndex}-${bucket}`;
    if (spoken.current === key) return;
    spoken.current = key;
    const text = progress.offRoute ? "You are off route. Stop safely and return to the highlighted route." : `In ${formatDistance(progress.turnDistance)}, ${route.steps[progress.nextIndex]?.text ?? "continue"}`;
    window.speechSynthesis.cancel(); window.speechSynthesis.speak(new SpeechSynthesisUtterance(text));
  }, [voice, active, gps, progress, route]);
  useEffect(() => { if (!active || !voice) window.speechSynthesis?.cancel(); return () => window.speechSynthesis?.cancel(); }, [active, voice]);
  const toggleVoice = () => {
    if (!("speechSynthesis" in window)) { setError("Voice guidance is unavailable in this browser."); return; }
    if (!voice) { spoken.current = ""; window.speechSynthesis.speak(new SpeechSynthesisUtterance("Voice guidance on")); }
    setVoice(!voice);
  };
  return { active, fix, progress, gps, awake, voice, arrived, error, follow, setFollow, start, stop, toggleVoice };
}