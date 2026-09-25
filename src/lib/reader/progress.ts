export type LocationProgress = {
  atStart: boolean;
  atEnd: boolean;
  mappedPercentage?: number;
};

export function resolveLocationProgress(
  location: LocationProgress,
  lastKnownProgress: number,
) {
  if (location.atEnd) return 100;

  const mapped = location.mappedPercentage;
  if (typeof mapped !== "number" || !Number.isFinite(mapped)) {
    return lastKnownProgress;
  }

  const normalized = Math.max(0, Math.min(100, mapped * 100));

  // EPUB.js reports location zero while its generated location map is still
  // settling. Zero is trustworthy only when the rendition is actually at the
  // beginning of the book; otherwise keep the last durable cloud position.
  if (normalized === 0 && !location.atStart && lastKnownProgress > 0) {
    return lastKnownProgress;
  }

  return normalized;
}
