import { BlobReader, TextWriter, ZipReader } from "@zip.js/zip.js";

import { EpubImportError } from "@/lib/epub/errors";

const MAX_ENTRIES = 10_000;
const MAX_EXPANDED_BYTES = 300 * 1024 * 1024;

/** Inspect the central directory before passing an untrusted archive to EPUB.js. */
export async function validateEpubArchive(file: Blob): Promise<void> {
  const reader = new ZipReader(new BlobReader(file), {
    filenameValidation: "strict",
    strictness: "balanced",
  });

  try {
    const entries = await reader.getEntries();
    if (entries.length === 0 || entries.length > MAX_ENTRIES) {
      throw new EpubImportError("This EPUB has an invalid number of files.", "corrupt");
    }

    let expandedBytes = 0;
    for (const entry of entries) {
      if (entry.encrypted || entry.symlink) {
        throw new EpubImportError("Encrypted or linked EPUB files are not supported.", "unsupported");
      }
      expandedBytes += entry.uncompressedSize;
      if (expandedBytes > MAX_EXPANDED_BYTES) {
        throw new EpubImportError("This EPUB expands beyond the supported size.", "too-large");
      }
    }

    const mimetype = entries.find((entry) => entry.filename === "mimetype");
    const container = entries.find((entry) => entry.filename === "META-INF/container.xml");
    if (!mimetype || mimetype.directory || !container || container.directory) {
      throw new EpubImportError("This file is not a valid EPUB archive.", "corrupt");
    }
    const type = await mimetype.getData(new TextWriter());
    if (type.trim() !== "application/epub+zip") {
      throw new EpubImportError("This file is not a valid EPUB archive.", "corrupt");
    }
  } catch (error) {
    if (error instanceof EpubImportError) throw error;
    throw new EpubImportError("This EPUB archive is damaged or unreadable.", "corrupt");
  } finally {
    await reader.close();
  }
}
