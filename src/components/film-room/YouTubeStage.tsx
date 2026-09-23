import { useEffect, useId, useRef, useState } from "react";
import { StageCanvas } from "@/components/film-room/StageCanvas";
import type { PendingShape, Point, Shape } from "@/lib/film-room";

export type YouTubePlayer = {
  playVideo(): void;
  pauseVideo(): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  getCurrentTime(): number;
  getDuration(): number;
  setPlaybackRate(rate: number): void;
  getPlayerState(): number;
  destroy(): void;
};

type Props = {
  videoId: string;
  aspect?: number;
  shapes: Shape[];
  pending: PendingShape | null;
  drawingEnabled: boolean;
  onAddPoint: (p: Point) => void;
  onReady: (player: YouTubePlayer) => void;
  onStateChange: (state: number) => void;
  onError: (message: string) => void;
};

type Api = {
  Player: new (el: HTMLElement | string, options: Record<string, unknown>) => YouTubePlayer;
};

declare global {
  interface Window {
    YT?: Api;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let apiPromise: Promise<Api> | null = null;

/** Loads the YouTube IFrame Player API once and resolves with window.YT. */
function loadYouTubeApi(): Promise<Api> {
  if (!apiPromise) {
    apiPromise = new Promise<Api>((resolve, reject) => {
      if (window.YT?.Player) return resolve(window.YT);

      const previous = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        previous?.();
        if (window.YT?.Player) resolve(window.YT);
        else reject(new Error("Couldn't load the YouTube player."));
      };

      const script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      script.async = true;
      script.onerror = () => reject(new Error("Couldn't reach YouTube. Check your connection."));
      document.head.appendChild(script);

      setTimeout(() => {
        if (!window.YT?.Player) reject(new Error("YouTube took too long to load."));
      }, 15000);
    });
  }
  return apiPromise;
}

export function YouTubeStage({
  videoId,
  aspect = 16 / 9,
  shapes,
  pending,
  drawingEnabled,
  onAddPoint,
  onReady,
  onStateChange,
  onError,
}: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YouTubePlayer | null>(null);
  const [ready, setReady] = useState(false);
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");

  const callbacks = useRef({ onReady, onStateChange, onError });
  callbacks.current = { onReady, onStateChange, onError };

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let cancelled = false;
    setReady(false);

    loadYouTubeApi()
      .then((YT) => {
        if (cancelled) return;
        host.innerHTML = "";
        const mount = document.createElement("div");
        mount.id = `film-room-yt-${uid}`;
        host.appendChild(mount);

        playerRef.current = new YT.Player(mount, {
          videoId,
          width: "100%",
          height: "100%",
          playerVars: {
            autoplay: 0,
            controls: 0,
            rel: 0,
            playsinline: 1,
            modestbranding: 1,
            iv_load_policy: 3,
            disablekb: 1,
            fs: 0,
          },
          events: {
            onReady: (e: { target: YouTubePlayer }) => {
              if (cancelled) return;
              setReady(true);
              callbacks.current.onReady(e.target);
            },
            onStateChange: (e: { data: number }) => {
              if (!cancelled) callbacks.current.onStateChange(e.data);
            },
            onError: () => {
              if (!cancelled) {
                callbacks.current.onError(
                  "YouTube couldn't play this video. It may be private, or embedding may be turned off.",
                );
              }
            },
          },
        });
      })
      .catch((err: Error) => {
        if (!cancelled) callbacks.current.onError(err.message);
      });

    return () => {
      cancelled = true;
      playerRef.current?.destroy?.();
      playerRef.current = null;
    };
  }, [videoId, uid]);

  const handleTap = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    onAddPoint({
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    });
  };

  return (
    <div className="bg-black">
      <div
        className="relative mx-auto"
        style={{
          width: `min(100%, ${(70 * aspect).toFixed(2)}vh)`,
          aspectRatio: String(aspect),
        }}
      >
        <div ref={hostRef} className="absolute inset-0" />

        {/* Paused: this layer catches taps for the drawing tools.
            Playing: taps fall through to the player underneath. */}
        <div
          className="absolute inset-0 touch-none select-none"
          style={{ pointerEvents: drawingEnabled ? "auto" : "none" }}
          onPointerDown={handleTap}
        >
          <StageCanvas shapes={shapes} pending={pending} />
        </div>

        {!ready ? (
          <div className="pointer-events-none absolute inset-0 grid place-items-center px-6 text-center text-sm text-muted-foreground">
            Loading YouTube video…
          </div>
        ) : null}
      </div>
    </div>
  );
}
