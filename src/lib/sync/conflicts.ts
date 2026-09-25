import type { BookRecord } from "@/types/book";

export function mergeBookProgress(
  local: BookRecord | undefined,
  remote: BookRecord,
  localProgressUpdatedAt?: string,
) {
  if (!local || !localProgressUpdatedAt || localProgressUpdatedAt <= remote.updatedAt) return remote;
  return {
    ...remote,
    progress: local.progress,
    currentCfi: local.currentCfi,
    updatedAt: local.updatedAt,
    lastOpenedAt: local.lastOpenedAt,
    cloudState: "synced" as const,
  };
}
