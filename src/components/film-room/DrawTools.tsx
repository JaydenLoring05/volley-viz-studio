import { Circle, Minus, Triangle, Trash2, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MARK_COLORS, type MarkColorId, type ToolId } from "@/lib/film-room";

type Props = {
  tool: ToolId;
  color: MarkColorId;
  canEdit: boolean;
  hint: string;
  onTool: (t: ToolId) => void;
  onColor: (c: MarkColorId) => void;
  onUndo: () => void;
  onClear: () => void;
};

const TOOLS: Array<{ id: ToolId; label: string; icon: typeof Minus }> = [
  { id: "line", label: "Line", icon: Minus },
  { id: "angle", label: "Angle", icon: Triangle },
  { id: "circle", label: "Ball", icon: Circle },
];

export function DrawTools({
  tool,
  color,
  canEdit,
  hint,
  onTool,
  onColor,
  onUndo,
  onClear,
}: Props) {
  return (
    <div className="space-y-3 border-b border-border bg-surface px-4 py-4">
      <div className="flex items-center justify-between">
        <span className="eyebrow">Draw</span>
        <span className="text-xs text-muted-foreground">{hint}</span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {TOOLS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              disabled={!canEdit}
              onClick={() => onTool(t.id)}
              className={cn(
                "flex h-14 flex-col items-center justify-center gap-0.5 rounded-md border text-xs transition-colors disabled:opacity-40",
                tool === t.id
                  ? "border-primary bg-primary text-primary-foreground font-semibold"
                  : "border-border bg-surface-raised text-foreground",
              )}
            >
              <Icon className="size-5" />
              {t.label}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-2">
        <div className="flex flex-1 gap-2">
          {MARK_COLORS.map((c) => (
            <button
              key={c.id}
              onClick={() => onColor(c.id)}
              aria-label={c.label}
              className={cn(
                "h-12 flex-1 rounded-md border-2 transition-all",
                color === c.id ? "border-foreground" : "border-transparent opacity-70",
              )}
              style={{ backgroundColor: c.css }}
            />
          ))}
        </div>
        <Button
          variant="secondary"
          className="h-12 px-4"
          onClick={onUndo}
          disabled={!canEdit}
          aria-label="Undo"
        >
          <Undo2 className="size-5" />
        </Button>
        <Button
          variant="secondary"
          className="h-12 px-4"
          onClick={onClear}
          disabled={!canEdit}
          aria-label="Clear drawings"
        >
          <Trash2 className="size-5" />
        </Button>
      </div>
    </div>
  );
}
