import { useEffect, useState } from "react";
import { Youtube } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (url: string) => void;
};

export function YouTubeDialog({ open, onOpenChange, onSubmit }: Props) {
  const [url, setUrl] = useState("");

  useEffect(() => {
    if (open) setUrl("");
  }, [open]);

  const submit = () => {
    const value = url.trim();
    if (!value) return;
    onSubmit(value);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-surface sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl uppercase tracking-wide">
            Paste YouTube link
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-2">
          <span className="eyebrow">Video link</span>
          <Input
            autoFocus
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                submit();
              }
            }}
            placeholder="https://youtu.be/… or youtube.com/watch?v=…"
            inputMode="url"
            autoCapitalize="off"
            spellCheck={false}
            className="h-14 bg-surface-raised text-base"
          />
          <p className="text-xs text-muted-foreground">
            Plays inside Film Room, so you can step frames and draw on it. Capturing stills needs
            an uploaded file.
          </p>
        </div>

        <DialogFooter>
          <Button
            className="h-14 w-full text-base font-semibold"
            disabled={!url.trim()}
            onClick={submit}
          >
            <Youtube className="size-5" />
            Load video
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
