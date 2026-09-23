import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Camera, Upload, Youtube } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { VideoStage } from "@/components/film-room/VideoStage";
import { PlaybackControls } from "@/components/film-room/PlaybackControls";
import { DrawTools } from "@/components/film-room/DrawTools";
import { CaptureDialog } from "@/components/film-room/CaptureDialog";
import { Gallery } from "@/components/film-room/Gallery";
import { YouTubeStage, type YouTubePlayer } from "@/components/film-room/YouTubeStage";
import { YouTubeDialog } from "@/components/film-room/YouTubeDialog";
import {
  POINTS_NEEDED,
  colorCss,
  captureFilename,
  dataUrlToBlob,
  formatTime,
  renderCapture,
  sortCaptures,
  type Capture,
  type MarkColorId,
  type Phase,
  type Point,
  type Shape,
  type ToolId,
} from "@/lib/film-room";
import { parseYouTubeId } from "@/lib/youtube";

const UPLOAD_RATES = [0.1, 0.25, 0.5, 1];
const YOUTUBE_RATES = [0.25, 0.5, 1];

// YouTube IFrame API player states this screen reacts to.
const YT_ENDED = 0;
const YT_PLAYING = 1;
const YT_PAUSED = 2;

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Film Room — Volleyball Technique Breakdown" },
      {
        name: "description",
        content:
          "Load your own volleyball clips, step frame by frame, draw angles and lines, and export labeled stills. Runs entirely on your phone.",
      },
      { property: "og:title", content: "Film Room — Volleyball Technique Breakdown" },
      {
        property: "og:description",
        content:
          "Frame-by-frame volleyball film study with angle tools and labeled frame captures. Nothing leaves your device.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: FilmRoom,
});

function FilmRoom() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const rafRef = useRef<number | null>(null);

  const [src, setSrc] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [aspect, setAspect] = useState(16 / 9);

  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [fps, setFps] = useState(30);
  const [speed, setSpeed] = useState(1);

  const [tool, setTool] = useState<ToolId>("line");
  const [color, setColor] = useState<MarkColorId>("red");
  const [annotations, setAnnotations] = useState<{ frame: number; shapes: Shape[] }>({
    frame: 0,
    shapes: [],
  });
  const [pending, setPending] = useState<Point[]>([]);

  const [captures, setCaptures] = useState<Capture[]>([]);
  const [captureOpen, setCaptureOpen] = useState(false);
  const [relabelId, setRelabelId] = useState<string | null>(null);
  const [zipping, setZipping] = useState(false);

  const [mode, setMode] = useState<"upload" | "youtube">("upload");
  const [ytId, setYtId] = useState<string | null>(null);
  const [ytOpen, setYtOpen] = useState(false);
  const playerRef = useRef<YouTubePlayer | null>(null);

  const frame = Math.round(time * fps);
  const shapes = annotations.frame === frame ? annotations.shapes : [];
  const pendingShape = pending.length
    ? { tool, color: colorCss(color), points: pending }
    : null;
  const hasStage = mode === "youtube" ? !!ytId : !!src;

  // Drawings belong to a single frame — moving off it clears the overlay.
  useEffect(() => {
    setPending([]);
  }, [frame]);

  useEffect(() => {
    const v = videoRef.current;
    if (v) v.playbackRate = speed;
  }, [speed, src]);

  const readTime = useCallback(() => {
    if (mode === "youtube") return playerRef.current?.getCurrentTime() ?? 0;
    return videoRef.current?.currentTime ?? 0;
  }, [mode]);

  // Smooth time readout while playing.
  useEffect(() => {
    if (!playing) return;
    const tick = () => {
      setTime(readTime());
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [playing, readTime]);

  const pickFile = () => fileInputRef.current?.click();

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    setLoadError(null);
    // Choosing a local clip leaves YouTube mode; unmounting the stage
    // destroys the embedded player.
    setMode("upload");
    setYtId(null);
    playerRef.current = null;
    // Load it and let the <video> element be the judge; if it can't decode the
    // file the error handler shows a clear message.

    if (src) URL.revokeObjectURL(src);
    setSrc(URL.createObjectURL(file));
    setFileName(file.name);
    setPlaying(false);
    setTime(0);
    setDuration(0);
    setAnnotations({ frame: 0, shapes: [] });
    setPending([]);
  };

  const onLoaded = () => {
    const v = videoRef.current;
    if (!v) return;
    setDuration(v.duration || 0);
    if (v.videoWidth && v.videoHeight) setAspect(v.videoWidth / v.videoHeight);
    v.playbackRate = speed;
    setLoadError(null);
  };

  const togglePlay = useCallback(() => {
    if (mode === "youtube") {
      const p = playerRef.current;
      if (!p) return;
      if (p.getPlayerState() === YT_PLAYING) p.pauseVideo();
      else p.playVideo();
      return;
    }
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.playbackRate = speed;
      v.play()
        .then(() => setPlaying(true))
        .catch(() => setLoadError("This video couldn't be played in this browser."));
    } else {
      v.pause();
      setPlaying(false);
      setTime(v.currentTime);
    }
  }, [mode, speed]);

  const step = useCallback(
    (dir: -1 | 1) => {
      if (mode === "youtube") {
        const p = playerRef.current;
        if (!p) return;
        p.pauseVideo();
        setPlaying(false);
        const next = Math.min(
          Math.max(0, p.getCurrentTime() + dir / fps),
          p.getDuration() || 0,
        );
        p.seekTo(next, true);
        setTime(next);
        return;
      }
      const v = videoRef.current;
      if (!v) return;
      v.pause();
      setPlaying(false);
      const next = Math.min(
        Math.max(0, (Math.round(v.currentTime * fps) + dir) / fps),
        v.duration || 0,
      );
      v.currentTime = next;
      setTime(next);
    },
    [fps, mode],
  );

  const seek = (t: number) => {
    if (mode === "youtube") {
      const p = playerRef.current;
      if (!p) return;
      p.seekTo(t, true);
      setTime(t);
      return;
    }
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = t;
    setTime(t);
  };

  // YouTube's slowest rate is 0.25x, so 0.1x isn't offered there.
  const changeSpeed = (s: number) => {
    const rate = mode === "youtube" ? Math.max(0.25, s) : s;
    setSpeed(rate);
    if (mode === "youtube") playerRef.current?.setPlaybackRate(rate);
  };

  const openYouTube = (url: string) => {
    const id = parseYouTubeId(url);
    if (!id) {
      toast.error("That doesn't look like a YouTube link.");
      return;
    }
    setLoadError(null);
    setMode("youtube");
    setYtId(id);
    setYtOpen(false);
    setPlaying(false);
    setTime(0);
    setDuration(0);
    setAnnotations({ frame: 0, shapes: [] });
    setPending([]);
    setSpeed((s) => Math.max(0.25, s));
  };

  const onYtReady = (player: YouTubePlayer) => {
    playerRef.current = player;
    setDuration(player.getDuration() || 0);
    player.setPlaybackRate(Math.max(0.25, speed));
    setLoadError(null);
  };

  const onYtState = (state: number) => {
    const p = playerRef.current;
    if (state === YT_PLAYING) setPlaying(true);
    else if (state === YT_PAUSED || state === YT_ENDED) {
      setPlaying(false);
      setTime(p?.getCurrentTime() ?? 0);
    }
    const d = p?.getDuration() ?? 0;
    if (d) setDuration(d);
  };

  // Desktop keyboard shortcuts.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName)) return;
      if (e.code === "Space") {
        // A focused button activates on Space itself — don't also toggle play.
        if (el?.tagName === "BUTTON") return;
        e.preventDefault();
        togglePlay();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        step(-1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        step(1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [togglePlay, step]);

  const addPoint = (p: Point) => {
    const next = [...pending, p];
    if (next.length >= POINTS_NEEDED[tool]) {
      const shape: Shape = {
        id: crypto.randomUUID(),
        tool,
        color: colorCss(color),
        points: next,
      };
      setAnnotations((prev) =>
        prev.frame === frame
          ? { frame, shapes: [...prev.shapes, shape] }
          : { frame, shapes: [shape] },
      );
      setPending([]);
    } else {
      setPending(next);
    }
  };

  const undo = () => {
    if (pending.length) {
      setPending(pending.slice(0, -1));
      return;
    }
    setAnnotations((prev) =>
      prev.frame === frame ? { frame, shapes: prev.shapes.slice(0, -1) } : prev,
    );
  };

  const clearDrawings = () => {
    setPending([]);
    setAnnotations({ frame, shapes: [] });
  };

  const relabelTarget = captures.find((c) => c.id === relabelId) ?? null;
  const nextRep = useMemo(() => {
    const last = sortCaptures(captures).at(-1);
    return last ? last.rep : 1;
  }, [captures]);

  const saveCapture = (v: { phase: Phase; rep: number; note: string }) => {
    const video = videoRef.current;
    if (!video) return;
    try {
      const dataUrl = renderCapture(video, shapes, { ...v, time, frame });
      setCaptures((prev) => [
        ...prev,
        { id: crypto.randomUUID(), dataUrl, ...v, time, frame },
      ]);
      setCaptureOpen(false);
      toast.success(`Captured ${v.phase} · rep ${v.rep}`);
    } catch {
      toast.error("Couldn't capture this frame.");
    }
  };

  const applyRelabel = (v: { phase: Phase; rep: number; note: string }) => {
    setCaptures((prev) => prev.map((c) => (c.id === relabelId ? { ...c, ...v } : c)));
    setRelabelId(null);
    toast.success("Label updated");
  };

  const share = async (c: Capture) => {
    try {
      const blob = await dataUrlToBlob(c.dataUrl);
      const file = new File([blob], captureFilename(c), { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: `${c.phase} · rep ${c.rep}` });
        return;
      }
      downloadBlob(blob, captureFilename(c));
      toast.info("Sharing isn't available here — saved the image instead.");
    } catch {
      /* user dismissed the share sheet */
    }
  };

  const downloadAll = async () => {
    setZipping(true);
    try {
      const { default: JSZip } = await import("jszip");
      const zip = new JSZip();
      const used = new Set<string>();
      for (const c of sortCaptures(captures)) {
        let name = captureFilename(c);
        let n = 2;
        while (used.has(name)) name = captureFilename(c).replace(/\.png$/, `_${n++}.png`);
        used.add(name);
        zip.file(name, await dataUrlToBlob(c.dataUrl));
      }
      const blob = await zip.generateAsync({ type: "blob" });
      downloadBlob(blob, "film-room-captures.zip");
    } catch {
      toast.error("Couldn't build the zip file.");
    } finally {
      setZipping(false);
    }
  };

  const hint = playing
    ? "Pause to draw"
    : pending.length
      ? `${POINTS_NEEDED[tool] - pending.length} more tap${POINTS_NEEDED[tool] - pending.length === 1 ? "" : "s"}`
      : tool === "angle"
        ? "Tap 3 points"
        : tool === "line"
          ? "Tap 2 points"
          : "Tap center, then edge";

  return (
    <div className="min-h-dvh bg-background pb-10">
      <header className="flex items-center justify-between gap-3 px-4 py-3">
        <div className="min-w-0">
          <h1 className="truncate text-2xl leading-none uppercase">
            Film <span className="text-primary">Room</span>
          </h1>
          <p className="truncate text-[11px] text-muted-foreground">
            {fileName || "Stays on your device"}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button variant="outline" className="h-12 px-3" onClick={() => setYtOpen(true)}>
            <Youtube className="size-5" />
            YouTube
          </Button>
          <Button variant="secondary" className="h-12 px-3" onClick={pickFile}>
            <Upload className="size-5" />
            {src ? "New clip" : "Upload"}
          </Button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="video/mp4,video/quicktime,.mp4,.mov,video/*"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </header>

      {loadError ? (
        <p className="mx-4 mb-3 rounded-md border border-destructive bg-destructive/15 px-3 py-3 text-sm text-foreground">
          {loadError}
        </p>
      ) : null}

      {hasStage ? (
        <>
          {mode === "youtube" ? (
            <YouTubeStage
              videoId={ytId ?? ""}
              shapes={shapes}
              pending={pendingShape}
              drawingEnabled={!playing}
              onAddPoint={addPoint}
              onReady={onYtReady}
              onStateChange={onYtState}
              onError={(message) => setLoadError(message)}
            />
          ) : (
            <VideoStage
              videoRef={videoRef}
              src={src}
              aspect={aspect}
              shapes={shapes}
              pending={pendingShape}
              drawingEnabled={!playing}
              onAddPoint={addPoint}
              onLoaded={onLoaded}
              onTimeUpdate={() => {
                const v = videoRef.current;
                if (v && v.paused) setTime(v.currentTime);
              }}
              onEnded={() => setPlaying(false)}
              onError={() =>
                setLoadError("This browser can't play that file. Try an .mp4 (H.264) version.")
              }
            />
          )}

          <PlaybackControls
            playing={playing}
            time={time}
            duration={duration}
            frame={frame}
            fps={fps}
            speed={speed}
            rates={mode === "youtube" ? YOUTUBE_RATES : UPLOAD_RATES}
            onToggle={togglePlay}
            onStep={step}
            onSeek={seek}
            onSpeed={changeSpeed}
            onFps={setFps}
          />

          <DrawTools
            tool={tool}
            color={color}
            canEdit={!playing}
            hint={hint}
            onTool={setTool}
            onColor={setColor}
            onUndo={undo}
            onClear={clearDrawings}
          />

          {mode === "youtube" ? (
            <div className="px-4 py-4">
              <p className="rounded-md border border-border bg-surface px-3 py-3 text-sm text-muted-foreground">
                Capture unavailable for YouTube — take a phone screenshot, or download the video
                from YouTube Studio and upload it for full features.
              </p>
            </div>
          ) : (
            <div className="px-4 py-4">
              <Button
                className="h-16 w-full text-base font-semibold"
                disabled={playing}
                onClick={() => setCaptureOpen(true)}
              >
                <Camera className="size-6" />
                Capture Frame · {formatTime(time)}
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="px-4 py-10">
          <div className="rounded-xl border border-dashed border-border bg-surface px-5 py-12 text-center">
            <h2 className="text-2xl uppercase">Load a clip</h2>
            <p className="mx-auto mt-2 max-w-xs text-sm text-muted-foreground">
              Pick an .mp4 or .mov from your camera roll. It plays straight from your phone —
              nothing is uploaded.
            </p>
            <Button className="mt-6 h-16 w-full text-base font-semibold" onClick={pickFile}>
              <Upload className="size-6" />
              Choose video
            </Button>
          </div>
        </div>
      )}

      <Gallery
        captures={captures}
        busy={zipping}
        onRelabel={(c) => setRelabelId(c.id)}
        onDelete={(id) => setCaptures((prev) => prev.filter((c) => c.id !== id))}
        onShare={share}
        onDownloadAll={downloadAll}
      />

      <CaptureDialog
        open={captureOpen}
        title="Label capture"
        initial={{ phase: "Contact", rep: nextRep, note: "" }}
        onOpenChange={setCaptureOpen}
        onSubmit={saveCapture}
      />

      <CaptureDialog
        open={!!relabelTarget}
        title="Re-label"
        initial={{
          phase: relabelTarget?.phase ?? "Contact",
          rep: relabelTarget?.rep ?? 1,
          note: relabelTarget?.note ?? "",
        }}
        onOpenChange={(o) => !o && setRelabelId(null)}
        onSubmit={applyRelabel}
      />

      <YouTubeDialog open={ytOpen} onOpenChange={setYtOpen} onSubmit={openYouTube} />
    </div>
  );
}

function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  // Safari can abort the download if the URL is revoked immediately.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
