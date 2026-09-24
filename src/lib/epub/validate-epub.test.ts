import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { EpubImportError } from "@/lib/epub/errors";
import { validateEpubArchive } from "@/lib/epub/validate-epub";

describe("validateEpubArchive", () => {
  it("accepts a real EPUB and rejects a renamed non-archive", async () => {
    const bytes = readFileSync(path.join(process.cwd(), "tests/e2e/fixtures/minimal.epub"));
    await expect(validateEpubArchive(new Blob([new Uint8Array(bytes)]))).resolves.toBeUndefined();
    await expect(validateEpubArchive(new Blob(["not a zip file"]))).rejects.toBeInstanceOf(EpubImportError);
  });
});
