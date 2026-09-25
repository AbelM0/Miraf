import { describe, expect, it } from "vitest";
import { resolveLocationProgress } from "@/lib/reader/progress";

describe("resolveLocationProgress", () => {
  it("does not replace restored progress with an uninitialized zero", () => {
    expect(resolveLocationProgress(
      { atStart: false, atEnd: false, mappedPercentage: 0 },
      37,
    )).toBe(37);
  });

  it("allows zero at the real beginning of a book", () => {
    expect(resolveLocationProgress(
      { atStart: true, atEnd: false, mappedPercentage: 0 },
      37,
    )).toBe(0);
  });

  it("uses a stable generated location percentage", () => {
    expect(resolveLocationProgress(
      { atStart: false, atEnd: false, mappedPercentage: 0.3625 },
      37,
    )).toBe(36.25);
  });
});
