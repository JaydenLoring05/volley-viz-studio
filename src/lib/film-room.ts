export const PHASES = [
  "Penultimate",
  "Plant",
  "Takeoff",
  "Loaded Arm",
  "Contact",
  "Landing",
  "Serve Toss",
  "Serve Contact",
  "Pass",
  "Block",
] as const;

export type Phase = (typeof PHASES)[number];

export const MARK_COLORS = [
  { id: "red", label: "Red", css: "oklch(0.63 0.24 25)" },
  { id: "yellow", label: "Yellow", css: "oklch(0.88 0.19 96)" },
  { id: "cyan", label: "Cyan", css: "oklch(0.82 0.15 200)" },
] as const;

export type MarkColorId = (typeof MARK_COLORS)[number]["id"];

export type ToolId = "line" | "angle" | "circle";

export type Point = { x: number; y: number };

export type PendingShape = { tool: ToolId; color: string; points: Point[] };

export type Shape = {
  id: string;
  tool: ToolId;
  color: string;
  points: Point[];
};

export type Capture = {
  id: string;
  dataUrl: string;
  phase: Phase;
  rep: number;
  note: string;
  time: number;
  frame: number;
};

export const POINTS_NEEDED: Record<ToolId, number> = {
  line: 2,
  angle: 3,
  circle: 2,
};

export function colorCss(id: MarkColorId) {
  return MARK_COLORS.find((c) => c.id === id)!.css;
}

export function formatTime(seconds: number) {
  if (!Number.isFinite(seconds)) seconds = 0;
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  const cs = Math.floor((seconds % 1) * 100);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(cs).padStart(2, "0")}`;
}

export function angleAt(a: Point, b: Point, c: Point) {
  const v1 = { x: a.x - b.x, y: a.y - b.y };
  const v2 = { x: c.x - b.x, y: c.y - b.y };
  const dot = v1.x * v2.x + v1.y * v2.y;
  const m1 = Math.hypot(v1.x, v1.y);
  const m2 = Math.hypot(v2.x, v2.y);
  if (!m1 || !m2) return 0;
  const cos = Math.min(1, Math.max(-1, dot / (m1 * m2)));
  return (Math.acos(cos) * 180) / Math.PI;
}

/** Draws normalized shapes onto a context sized w x h. */
export function drawShapes(
  ctx: CanvasRenderingContext2D,
  shapes: Shape[],
  pending: PendingShape | null,
  w: number,
  h: number,
) {
  const unit = Math.max(w, h) / 320;
  const px = (p: Point) => ({ x: p.x * w, y: p.y * h });

  const dot = (p: Point, color: string) => {
    const q = px(p);
    ctx.beginPath();
    ctx.arc(q.x, q.y, 3.2 * unit, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.lineWidth = 1.2 * unit;
    ctx.strokeStyle = "rgba(0,0,0,0.6)";
    ctx.stroke();
  };

  const stroke = (color: string) => {
    ctx.lineWidth = 2.4 * unit;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = color;
    ctx.shadowColor = "rgba(0,0,0,0.65)";
    ctx.shadowBlur = 3 * unit;
  };

  const all: Array<{ tool: ToolId; color: string; points: Point[] }> = [
    ...shapes,
    ...(pending && pending.points.length ? [pending] : []),
  ];

  for (const s of all) {
    const pts = s.points.map(px);
    const [p0, p1, p2] = pts;
    stroke(s.color);

    if (s.tool === "line" && p0 && p1) {
      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y);
      ctx.lineTo(p1.x, p1.y);
      ctx.stroke();
    }

    if (s.tool === "angle" && p0 && p1) {
      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y);
      ctx.lineTo(p1.x, p1.y);
      if (p2) ctx.lineTo(p2.x, p2.y);
      ctx.stroke();

      const n0 = s.points[0];
      const n1 = s.points[1];
      const n2 = s.points[2];
      if (p2 && n0 && n1 && n2) {
        const deg = angleAt(p0, p1, p2);
        const r = 14 * unit;
        const a1 = Math.atan2(p0.y - p1.y, p0.x - p1.x);
        const a2 = Math.atan2(p2.y - p1.y, p2.x - p1.x);
        ctx.beginPath();
        ctx.lineWidth = 1.6 * unit;
        ctx.arc(p1.x, p1.y, r, a1, a2, shouldAnticlockwise(a1, a2));
        ctx.stroke();

        const text = `${deg.toFixed(1)}\u00B0`;
        ctx.shadowBlur = 0;
        ctx.font = `700 ${13 * unit}px ui-monospace, monospace`;
        ctx.textBaseline = "middle";
        const tw = ctx.measureText(text).width;
        const lx = p1.x + 18 * unit;
        const ly = p1.y - 18 * unit;
        ctx.fillStyle = "rgba(0,0,0,0.72)";
        roundRect(ctx, lx - 4 * unit, ly - 10 * unit, tw + 8 * unit, 20 * unit, 4 * unit);
        ctx.fill();
        ctx.fillStyle = s.color;
        ctx.fillText(text, lx, ly);
      }
    }

    if (s.tool === "circle" && p0 && p1) {
      const r = Math.hypot(p1.x - p0.x, p1.y - p0.y);
      ctx.beginPath();
      ctx.arc(p0.x, p0.y, Math.max(r, 3 * unit), 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.shadowBlur = 0;
    for (const p of s.points) dot(p, s.color);
  }

}

function shouldAnticlockwise(a1: number, a2: number) {
  let d = a2 - a1;
  while (d < -Math.PI) d += Math.PI * 2;
  while (d > Math.PI) d -= Math.PI * 2;
  return d < 0;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Renders the paused video frame + shapes + banner to a PNG data URL. */
export function renderCapture(
  video: HTMLVideoElement,
  shapes: Shape[],
  meta: { phase: string; rep: number; note: string; time: number; frame: number },
) {
  const vw = video.videoWidth || 1280;
  const vh = video.videoHeight || 720;
  const banner = Math.round(Math.max(vw, vh) * 0.062);
  const canvas = document.createElement("canvas");
  canvas.width = vw;
  canvas.height = vh + banner;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#0b0e14";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(video, 0, banner, vw, vh);

  // Banner
  ctx.fillStyle = "#0b0e14";
  ctx.fillRect(0, 0, canvas.width, banner);
  ctx.fillStyle = "#c9f24a";
  ctx.fillRect(0, banner - Math.max(2, banner * 0.035), canvas.width, Math.max(2, banner * 0.035));

  const pad = banner * 0.28;
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#c9f24a";
  ctx.font = `700 ${banner * 0.42}px "Barlow Condensed", system-ui, sans-serif`;
  ctx.fillText(`REP ${String(meta.rep).padStart(2, "0")}`, pad, banner * 0.42);

  const repW = ctx.measureText(`REP ${String(meta.rep).padStart(2, "0")}`).width;
  ctx.fillStyle = "#ffffff";
  ctx.font = `600 ${banner * 0.4}px "Barlow Condensed", system-ui, sans-serif`;
  ctx.fillText(meta.phase.toUpperCase(), pad + repW + banner * 0.3, banner * 0.42);

  ctx.fillStyle = "#9aa4b2";
  ctx.font = `500 ${banner * 0.26}px ui-monospace, monospace`;
  const stamp = `${formatTime(meta.time)}  ·  f${meta.frame}`;
  ctx.textAlign = "right";
  ctx.fillText(stamp, canvas.width - pad, banner * 0.42);
  ctx.textAlign = "left";

  if (meta.note.trim()) {
    ctx.fillStyle = "#d6dbe3";
    ctx.font = `400 ${banner * 0.26}px "Barlow", system-ui, sans-serif`;
    ctx.fillText(meta.note.trim().slice(0, 90), pad, banner * 0.78);
  }

  const shapeCtx = ctx;
  shapeCtx.save();
  shapeCtx.translate(0, banner);
  drawShapes(shapeCtx, shapes, null, vw, vh);
  shapeCtx.restore();

  return canvas.toDataURL("image/png");
}

export function captureFilename(c: Capture) {
  const slug = c.phase.toLowerCase().replace(/[^a-z0-9]+/g, "_");
  return `rep${String(c.rep).padStart(2, "0")}_${slug}.png`;
}

export function sortCaptures(list: Capture[]) {
  return [...list].sort(
    (a, b) =>
      a.rep - b.rep ||
      PHASES.indexOf(a.phase) - PHASES.indexOf(b.phase) ||
      a.time - b.time,
  );
}

export async function dataUrlToBlob(dataUrl: string) {
  const res = await fetch(dataUrl);
  return await res.blob();
}
