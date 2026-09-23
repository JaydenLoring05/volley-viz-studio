import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { PHASES, type Phase } from "@/lib/film-room";

const REPS = Array.from({ length: 20 }, (_, i) => i + 1);

type Props = {
  open: boolean;
  title: string;
  initial: { phase: Phase; rep: number; note: string };
  onOpenChange: (open: boolean) => void;
  onSubmit: (v: { phase: Phase; rep: number; note: string }) => void;
};

export function CaptureDialog({ open, title, initial, onOpenChange, onSubmit }: Props) {
  const [phase, setPhase] = useState<Phase>(initial.phase);
  const [rep, setRep] = useState(initial.rep);
  const [note, setNote] = useState(initial.note);

  useEffect(() => {
    if (open) {
      setPhase(initial.phase);
      setRep(initial.rep);
      setNote(initial.note);
    }
  }, [open, initial.phase, initial.rep, initial.note]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto bg-surface sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl uppercase tracking-wide">
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <div className="space-y-2">
            <span className="eyebrow">Phase</span>
            <div className="grid grid-cols-2 gap-2">
              {PHASES.map((p) => (
                <button
                  key={p}
                  onClick={() => setPhase(p)}
                  className={cn(
                    "h-12 rounded-md border px-2 text-sm transition-colors",
                    phase === p
                      ? "border-primary bg-primary font-semibold text-primary-foreground"
                      : "border-border bg-surface-raised text-foreground",
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <span className="eyebrow">Rep</span>
            <div className="grid grid-cols-5 gap-2">
              {REPS.map((r) => (
                <button
                  key={r}
                  onClick={() => setRep(r)}
                  className={cn(
                    "tabnum h-11 rounded-md border text-sm transition-colors",
                    rep === r
                      ? "border-primary bg-primary font-semibold text-primary-foreground"
                      : "border-border bg-surface-raised text-foreground",
                  )}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <span className="eyebrow">Note (optional)</span>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. left shoulder drops early"
              className="min-h-20 bg-surface-raised"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            className="h-14 w-full text-base font-semibold"
            onClick={() => onSubmit({ phase, rep, note })}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
