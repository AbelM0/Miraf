import { Skeleton } from "@/components/ui/skeleton";

export function LibrarySkeleton() {
  return <div className="space-y-10" aria-label="Loading library" aria-busy="true"><Skeleton className="h-52 rounded-[14px]" /><div>{[0,1,2].map((item) => <div key={item} className="flex items-center gap-5 border-t py-4"><Skeleton className="h-24 w-16 rounded-[10px]" /><div className="flex-1 space-y-3"><Skeleton className="h-5 w-48" /><Skeleton className="h-4 w-28" /></div></div>)}</div></div>;
}
