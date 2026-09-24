import Link from "next/link";
import { BookOpenTextIcon } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";

export function Wordmark({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("inline-flex items-center gap-2 text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring", className)} aria-label="Miraf library">
      <BookOpenTextIcon weight="duotone" className="size-7" aria-hidden />
      <span className="font-heading text-[2rem] leading-none tracking-[-0.04em]">Miraf</span>
    </Link>
  );
}
