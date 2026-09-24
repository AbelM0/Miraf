"use client";

import { PlusIcon } from "@phosphor-icons/react";
import { useRef } from "react";
import { Button } from "@/components/ui/button";

export function AddBookButton({ onFile, disabled, compact }: { onFile: (file: File) => void; disabled?: boolean; compact?: boolean }) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <>
      <Button type="button" size={compact ? "icon" : "default"} disabled={disabled} onClick={() => inputRef.current?.click()} aria-label={compact ? "Add an EPUB book" : undefined} className="h-11 rounded-[10px] px-4 shadow-none">
        <PlusIcon className="size-4" weight="bold" aria-hidden />
        {!compact && (disabled ? "Adding book…" : "Add Book")}
      </Button>
      <input ref={inputRef} className="sr-only" type="file" accept=".epub,application/epub+zip" tabIndex={-1} onChange={(event) => {
        const file = event.target.files?.[0];
        if (file) onFile(file);
        event.currentTarget.value = "";
      }} />
    </>
  );
}
