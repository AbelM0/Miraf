import { clampProgress } from "@/lib/format";
import { cn } from "@/lib/utils";

export function ReadingProgress({ value, className }: { value: number; className?: string }) {
  const progress = clampProgress(value);
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="h-1.5 min-w-20 flex-1 overflow-hidden rounded-full bg-primary/10" role="progressbar" aria-label="Reading progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)}>
        <div className="h-full rounded-full bg-primary transition-[width] duration-300 motion-reduce:transition-none" style={{ width: `${progress}%` }} />
      </div>
      <span className="w-9 text-right text-sm tabular-nums text-muted-foreground">{Math.round(progress)}%</span>
    </div>
  );
}
