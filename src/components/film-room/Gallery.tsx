import { Download, Pencil, Share2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { captureFilename, formatTime, sortCaptures, type Capture } from "@/lib/film-room";

type Props = {
  captures: Capture[];
  onRelabel: (c: Capture) => void;
  onDelete: (id: string) => void;
  onShare: (c: Capture) => void;
  onDownloadAll: () => void;
  busy: boolean;
};

export function Gallery({
  captures,
  onRelabel,
  onDelete,
  onShare,
  onDownloadAll,
  busy,
}: Props) {
  const sorted = sortCaptures(captures);

  return (
    <div className="space-y-4 px-4 py-5">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-2xl uppercase">Gallery</h2>
          <p className="text-xs text-muted-foreground">
            {captures.length} capture{captures.length === 1 ? "" : "s"} · sorted by rep, then phase
          </p>
        </div>
        <Button
          variant="secondary"
          className="h-12"
          disabled={!captures.length || busy}
          onClick={onDownloadAll}
        >
          <Download className="size-5" />
          {busy ? "Zipping…" : "Download All"}
        </Button>
      </div>

      {!sorted.length ? (
        <p className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
          Captured frames land here.
        </p>
      ) : (
        <div className="space-y-4">
          {sorted.map((c) => (
            <div key={c.id} className="overflow-hidden rounded-lg border border-border bg-surface">
              <img src={c.dataUrl} alt={`${c.phase} rep ${c.rep}`} className="w-full" />
              <div className="space-y-3 p-3">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-display text-lg uppercase">
                    Rep {String(c.rep).padStart(2, "0")} · {c.phase}
                  </span>
                  <span className="tabnum text-xs text-muted-foreground">
                    {formatTime(c.time)}
                  </span>
                </div>
                {c.note ? <p className="text-sm text-muted-foreground">{c.note}</p> : null}
                <p className="tabnum text-[11px] text-muted-foreground">{captureFilename(c)}</p>
                <div className="grid grid-cols-3 gap-2">
                  <Button variant="secondary" className="h-12" onClick={() => onShare(c)}>
                    <Share2 className="size-5" />
                    Share
                  </Button>
                  <Button variant="secondary" className="h-12" onClick={() => onRelabel(c)}>
                    <Pencil className="size-5" />
                    Label
                  </Button>
                  <Button
                    variant="secondary"
                    className="h-12 text-destructive"
                    onClick={() => onDelete(c.id)}
                  >
                    <Trash2 className="size-5" />
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
