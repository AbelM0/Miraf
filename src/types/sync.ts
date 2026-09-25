import type { ReaderPreferences } from "@/types/reader";

export type SyncOperationKind = "upload" | "progress" | "preferences" | "delete" | "storage-cleanup";
export type SyncOperation = { id: string; userId: string; kind: SyncOperationKind; bookId?: string; stage?: string; payload?: Record<string, unknown>; attempts: number; createdAt: string; updatedAt: string; lastError?: string };
export type AccountState = { userId: string; lastSyncedAt?: string; migrationDismissedAt?: string };
export type StoredReaderPreferences = { userId: string; preferences: ReaderPreferences; changedAt: string };
export type SyncStatus = "idle" | "syncing" | "offline" | "error";
