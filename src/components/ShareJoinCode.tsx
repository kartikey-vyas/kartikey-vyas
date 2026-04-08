"use client";

import { useState } from "react";
import { Check, Copy, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function ShareJoinCode({
  joinCode,
  groupName,
}: {
  joinCode: string;
  groupName: string;
}) {
  const [copied, setCopied] = useState(false);

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(joinCode);
      setCopied(true);
      toast.success("Code copied");
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Couldn't copy — long-press to copy manually");
    }
  };

  const share = async () => {
    const url = `${window.location.origin}/groups/${joinCode}/join`;
    const text = `Join my trip "${groupName}" on Tabby with code ${joinCode}`;
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share({ title: groupName, text, url });
        return;
      } catch {
        // user cancelled or unsupported
      }
    }
    try {
      await navigator.clipboard.writeText(`${text}\n${url}`);
      toast.success("Invite link copied");
    } catch {
      toast.error("Couldn't share — copy the code manually");
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={copyCode}
        className="inline-flex items-center gap-2 rounded-full border bg-secondary px-3 py-1.5 font-mono text-sm tracking-[0.2em] text-secondary-foreground transition hover:bg-secondary/80 active:scale-[0.98]"
      >
        {copied ? (
          <Check className="h-3.5 w-3.5" />
        ) : (
          <Copy className="h-3.5 w-3.5" />
        )}
        {joinCode}
      </button>
      <Button type="button" size="icon" variant="ghost" onClick={share} aria-label="Share">
        <Share2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
