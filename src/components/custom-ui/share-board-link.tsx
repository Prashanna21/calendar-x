"use client";

import { useState } from "react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";

type ShareBoardLinkProps = {
  shareUrl: string;
};

export default function ShareBoardLink({ shareUrl }: ShareBoardLinkProps) {
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="w-full max-w-sm space-y-2 rounded-md border p-3">
      <p className="text-sm font-medium">Share board link</p>
      <p className="text-xs text-muted-foreground">
        Anyone with this link can open the latest board view.
      </p>
      <div className="flex gap-2">
        <Input value={shareUrl} readOnly />
        <Button type="button" onClick={onCopy}>
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
    </div>
  );
}
