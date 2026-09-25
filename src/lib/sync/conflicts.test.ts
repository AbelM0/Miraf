import { describe, expect, it } from "vitest";
import { mergeBookProgress } from "@/lib/sync/conflicts";
import type { BookRecord } from "@/types/book";

const remote: BookRecord = { id: "book", metadata: { title: "Book" }, fileName: "book.epub", fileSize: 1, fingerprint: "hash", hasCover: false, progress: 20, currentCfi: "remote", addedAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-02T00:00:00.000Z", ownerUserId: "user", cloudState: "synced" };

describe("mergeBookProgress", () => {
  it("keeps a newer local position without replacing cloud metadata", () => {
    const local = { ...remote, metadata: { title: "Stale local title" }, progress: 70, currentCfi: "local", updatedAt: "2026-01-03T00:00:00.000Z" };
    expect(mergeBookProgress(local, remote, local.updatedAt)).toMatchObject({ metadata: { title: "Book" }, progress: 70, currentCfi: "local" });
  });
  it("uses cloud progress when it is newer", () => expect(mergeBookProgress({ ...remote, updatedAt: "2026-01-03T00:00:00.000Z" }, remote, "2026-01-01T00:00:00.000Z")).toBe(remote));
  it("does not treat a recent open as a recent progress change", () => expect(mergeBookProgress({ ...remote, progress: 0, updatedAt: "2026-01-04T00:00:00.000Z" }, remote)).toBe(remote));
});
