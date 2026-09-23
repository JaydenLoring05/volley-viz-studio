import { useEffect, useRef } from "react";
import { drawShapes, type PendingShape, type Shape } from "@/lib/film-room";

type Props = {
  shapes: Shape[];
  pending: PendingShape | null;
};

/**
 * Full-bleed annotation canvas. Sizes itself to its positioned parent and
 * repaints whenever the shapes or the box size change.
 */
export function StageCanvas({ shapes, pending }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const paint = () => {
      const rect = canvas.getBoundingClientRect();
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
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [shapes, pending]);

  return (
    <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 h-full w-full" />
  );
}
