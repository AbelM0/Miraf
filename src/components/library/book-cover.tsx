"use client";

import Image from "next/image";
import { BookOpenIcon } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { useObjectUrl } from "@/hooks/use-object-url";
import { libraryService } from "@/lib/services/library-service";
import { cn } from "@/lib/utils";

type Props = { bookId: string; title: string; hasCover: boolean; className?: string; priority?: boolean };

export function BookCover({ bookId, title, hasCover, className, priority }: Props) {
  const [cover, setCover] = useState<Blob>();
  const coverUrl = useObjectUrl(cover);
  useEffect(() => {
    let active = true;
    if (hasCover) void libraryService.getBookCover(bookId).then((blob) => { if (active) setCover(blob); });
    return () => { active = false; };
  }, [bookId, hasCover]);

  return (
    <div className={cn("relative isolate aspect-[2/3] overflow-hidden rounded-[10px] bg-primary text-primary-foreground shadow-[0_16px_38px_-24px_rgba(18,60,53,0.65)]", className)}>
      {coverUrl ? (
        <Image src={coverUrl} alt={`Cover of ${title}`} fill priority={priority} unoptimized sizes="(max-width: 640px) 80px, 132px" className="object-cover" />
      ) : (
        <div className="flex h-full flex-col items-center justify-center gap-3 p-3 text-center">
          <BookOpenIcon className="size-7 opacity-70" weight="light" aria-hidden />
          <span className="line-clamp-4 font-heading text-sm leading-tight">{title}</span>
        </div>
      )}
    </div>
  );
}
