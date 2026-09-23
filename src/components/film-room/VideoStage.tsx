import { useEffect, useRef, type RefObject } from "react";
import { drawShapes, type Point, type Shape, type ToolId } from "@/lib/film-room";

type Props = {
  videoRef: RefObject<HTMLVideoElement | null>;
  src: string | null;
  aspect: number;
  shapes: Shape[];
  pending: { tool: ToolId; color: string; points: Point[] } | null;
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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const box = boxRef.current;
    if (!canvas || !box) return;

    const paint = () => {
      const rect = box.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.max(1, Math.round(rect.width * dpr));
      canvas.height = Math.max(1, Math.round(rect.height * dpr));
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawShapes(ctx, shapes, pending, canvas.width, canvas.height);
    };

    paint();
    const ro = new ResizeObserver(paint);
    ro.observe(box);
    return () => ro.disconnect();
  }, [shapes, pending]);

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
        ref={boxRef}
        onPointerDown={handleTap}
        className="relative mx-auto w-full touch-none select-none"
        style={{ aspectRatio: String(aspect) }}
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
        <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 h-full w-full" />
      </div>
    </div>
  );
}
