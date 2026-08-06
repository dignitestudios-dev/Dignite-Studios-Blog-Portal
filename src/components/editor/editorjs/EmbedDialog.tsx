"use client";

/**
 * Link prompt for the toolbar's "Insert embed".
 *
 * The URL is validated as it is typed, so the Insert button only lights up for
 * a link the embed tool can actually render — the previous behaviour was a
 * block that silently rendered nothing.
 */
import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { embedFromUrl, EMBED_SERVICE_NAMES, type EmbedData } from "./blockActions";

interface EmbedDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInsert: (data: EmbedData) => void;
}

export function EmbedDialog({ open, onOpenChange, onInsert }: EmbedDialogProps) {
  const [url, setUrl] = useState("");
  const [touched, setTouched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Start clean every time; a stale URL from last time is never what is wanted.
  useEffect(() => {
    if (!open) return;
    setUrl("");
    setTouched(false);
    // The dialog animates in, so focus has to wait for it to be mounted.
    const timer = setTimeout(() => inputRef.current?.focus(), 60);
    return () => clearTimeout(timer);
  }, [open]);

  const parsed = embedFromUrl(url);
  const showError = touched && url.trim().length > 0 && !parsed;

  const submit = () => {
    if (!parsed) {
      setTouched(true);
      return;
    }
    onInsert(parsed);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle>Insert embed</DialogTitle>
          <DialogDescription>
            Paste a {EMBED_SERVICE_NAMES} link. It is embedded as a responsive
            player on the published page.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="embed-url" className="text-xs font-medium text-gray-600">
            Link
          </Label>
          <Input
            id="embed-url"
            ref={inputRef}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onBlur={() => setTouched(true)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                submit();
              }
            }}
            placeholder="https://www.youtube.com/watch?v=…"
            spellCheck={false}
            autoComplete="off"
            className={
              showError
                ? "border-[#EF3C36] focus-visible:border-[#EF3C36] focus-visible:ring-[#EF3C36]/30"
                : "focus-visible:border-[#F15C20] focus-visible:ring-[#F15C20]/30"
            }
          />

          {showError ? (
            <p className="text-xs text-[#EF3C36]">
              That is not a {EMBED_SERVICE_NAMES} link.
            </p>
          ) : parsed ? (
            <p className="text-xs text-emerald-600">
              {parsed.service.charAt(0).toUpperCase() + parsed.service.slice(1)} link
              recognised.
            </p>
          ) : (
            <p className="text-xs text-gray-400">
              For example: https://youtu.be/dQw4w9WgXcQ
            </p>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="text-sm"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={submit}
            disabled={!parsed}
            className="bg-[#F15C20] text-sm text-white hover:bg-[#d94d17]"
          >
            Insert
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
