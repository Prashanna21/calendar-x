"use client";

import { useState } from "react";
import { Button } from "@/src/components/ui/button";

type CopyBoardLinkButtonProps = {
  boardId: string;
};

function LinkIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-4"
    >
      <path d="M10 13a5 5 0 0 0 7.07 0l2.83-2.83a5 5 0 0 0-7.07-7.07L10 4" />
      <path d="M14 11a5 5 0 0 0-7.07 0L4.1 13.83a5 5 0 0 0 7.07 7.07L14 20" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-4"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

export default function CopyBoardLinkButton({
  boardId,
}: CopyBoardLinkButtonProps) {
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    try {
      const url = `${window.location.origin}/board/${boardId}`;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={onCopy}
      aria-label={copied ? "Board link copied" : "Copy board link"}
      title={copied ? "Copied" : "Copy board link"}
      className="shrink-0"
    >
      {copied ? <CheckIcon /> : <LinkIcon />}
      <span className="sr-only">{copied ? "Copied" : "Copy board link"}</span>
    </Button>
  );
}
