import { type RefObject } from "react";
import { StageCanvas } from "@/components/film-room/StageCanvas";
import type { PendingShape, Point, Shape } from "@/lib/film-room";

type Props = {
  videoRef: RefObject<HTMLVideoElement | null>;
  src: string | null;
  aspect: number;
  shapes: Shape[];
  pending: PendingShape | null;
  drawingEnabled: boolean;
  onAddPoint: (p: Point) => void;
  onLoaded: () => void;
  onTimeUpdate: () => void;
  onEnded: () => void;
  onError: () => void;
};

export function VideoStage({
  videoRef,
  src,
  aspect,
  shapes,
  pending,
  drawingEnabled,
  onAddPoint,
  onLoaded,
  onTimeUpdate,
  onEnded,
  onError,
}: Props) {
  const handleTap = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!drawingEnabled) return;
    const rect = e.currentTarget.getBoundingClientRect();
    onAddPoint({
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    });
  };

  return (
    <div className="bg-black">
      <div
        ref={undefined}
        onPointerDown={handleTap}
        className="relative mx-auto touch-none select-none"
        style={{
          // Keep the exact video aspect while capping the stage at 70vh, so
          // portrait clips stay on screen instead of running past the fold.
          width: `min(100%, ${(70 * aspect).toFixed(2)}vh)`,
          aspectRatio: String(aspect),
        }}
      >
        {src ? (
          <video
            ref={videoRef}
            src={src}
            playsInline
            preload="auto"
            className="absolute inset-0 h-full w-full"
            onLoadedMetadata={onLoaded}
            onTimeUpdate={onTimeUpdate}
            onSeeked={onTimeUpdate}
            onEnded={onEnded}
            onError={onError}
          />
        ) : null}
        <StageCanvas shapes={shapes} pending={pending} />
      </div>
    </div>
  );
}
