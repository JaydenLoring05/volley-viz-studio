import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatTime } from "@/lib/film-room";

const SPEEDS = [0.1, 0.25, 0.5, 1] as const;

type Props = {
  playing: boolean;
  time: number;
  duration: number;
  frame: number;
  fps: number;
  speed: number;
  rates?: readonly number[];
  onToggle: () => void;
  onStep: (dir: -1 | 1) => void;
  onSeek: (t: number) => void;
  onSpeed: (s: number) => void;
  onFps: (fps: number) => void;
};

export function PlaybackControls({
  playing,
  time,
  duration,
  frame,
  fps,
  speed,
  rates = SPEEDS,
  onToggle,
  onStep,
  onSeek,
  onSpeed,
  onFps,
}: Props) {
  const totalFrames = Math.max(0, Math.round(duration * fps));

  return (
    <div className="space-y-4 border-b border-border bg-surface px-4 py-4">
      <div className="space-y-2">
        <Slider
          value={[Math.min(time, duration || 0)]}
          min={0}
          max={duration || 0.001}
          step={1 / fps}
          onValueChange={(v) => onSeek(v[0] ?? 0)}
          aria-label="Scrub video"
        />
        <div className="flex items-center justify-between tabnum text-xs text-muted-foreground">
          <span className="text-foreground">{formatTime(time)}</span>
          <span>
            frame {frame} / {totalFrames}
          </span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      <div className="grid grid-cols-[1fr_1.3fr_1fr] gap-3">
        <Button
          variant="secondary"
          className="h-16 text-base"
          onClick={() => onStep(-1)}
          aria-label="Step back one frame"
        >
          <ChevronLeft className="size-7" />
        </Button>
        <Button className="h-16 text-base font-semibold" onClick={onToggle}>
          {playing ? <Pause className="size-7" /> : <Play className="size-7" />}
          {playing ? "Pause" : "Play"}
        </Button>
        <Button
          variant="secondary"
          className="h-16 text-base"
          onClick={() => onStep(1)}
          aria-label="Step forward one frame"
        >
          <ChevronRight className="size-7" />
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <span className="eyebrow w-12 shrink-0">Speed</span>
        <div
          className="grid flex-1 gap-2"
          style={{ gridTemplateColumns: `repeat(${rates.length}, minmax(0, 1fr))` }}
        >
          {rates.map((s) => (
            <button
              key={s}
              onClick={() => onSpeed(s)}
              className={cn(
                "tabnum h-12 rounded-md border text-sm transition-colors",
                speed === s
                  ? "border-primary bg-primary text-primary-foreground font-semibold"
                  : "border-border bg-surface-raised text-foreground",
              )}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="eyebrow w-12 shrink-0">FPS</span>
        <div className="grid flex-1 grid-cols-2 gap-2">
          {[30, 60].map((f) => (
            <button
              key={f}
              onClick={() => onFps(f)}
              className={cn(
                "tabnum h-12 rounded-md border text-sm transition-colors",
                fps === f
                  ? "border-primary bg-primary text-primary-foreground font-semibold"
                  : "border-border bg-surface-raised text-foreground",
              )}
            >
              {f} fps
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
