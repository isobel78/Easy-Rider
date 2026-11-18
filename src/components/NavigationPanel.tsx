import { Navigation, Square, Volume2, VolumeX, LocateFixed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDistance } from "@/lib/live-navigation";
import type { useLiveNavigation } from "@/hooks/use-live-navigation";

export function NavigationPanel({ navigation: n, instruction }: { navigation: ReturnType<typeof useLiveNavigation>; instruction: string }) {
  return <section aria-label="Live navigation" className="absolute inset-x-3 top-3 z-[500] rounded-lg border-2 border-foreground bg-card p-4 text-card-foreground shadow-sm sm:inset-x-5 sm:top-5">
    <div className="flex items-start gap-3">
      <Navigation className="mt-1 size-6 shrink-0 text-primary" />
      <div className="min-w-0 flex-1" aria-live="polite">
        <p className="text-sm font-semibold text-primary">{n.gps || (n.progress?.offRoute ? "Off route" : `${formatDistance(n.progress?.turnDistance ?? 0)} ahead`)}</p>
        <p className="mt-1 text-lg font-bold leading-snug">{n.gps ? "Waiting for an accurate location" : n.progress?.offRoute ? "Stop safely and return to the highlighted route" : instruction}</p>
        <p className="mt-2 text-sm text-muted-foreground">{n.progress ? `${formatDistance(n.progress.remaining)} remaining · ` : ""}{n.awake}</p>
      </div>
    </div>
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <Button size="icon" variant="outline" aria-label={n.voice ? "Mute voice guidance" : "Enable voice guidance"} title={n.voice ? "Mute voice guidance" : "Enable voice guidance"} aria-pressed={n.voice} onClick={n.toggleVoice}>{n.voice ? <Volume2 /> : <VolumeX />}</Button>
      <Button size="icon" variant={n.follow ? "default" : "outline"} aria-label="Recenter on rider" title="Recenter on rider" aria-pressed={n.follow} onClick={() => n.setFollow(true)}><LocateFixed /></Button>
      <Button variant="destructive" className="ml-auto" onClick={n.stop}><Square />End ride</Button>
    </div>
  </section>;
}