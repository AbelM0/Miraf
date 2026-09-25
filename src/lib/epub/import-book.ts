import type { BookRepository } from "@/lib/persistence/book-repository";
import type { BookMetadata, ImportedBook } from "@/types/book";
import { EpubImportError } from "@/lib/epub/errors";
import { validateEpubArchive } from "@/lib/epub/validate-epub";
import { getMaxEpubBytes } from "@/lib/config";


type EpubMetadata = {
  title?: unknown;
  creator?: unknown;
  publisher?: unknown;
  language?: unknown;
  description?: unknown;
  identifier?: unknown;
  layout?: unknown;
};

type EpubBook = {
  ready: Promise<void>;
  loaded: { metadata: Promise<EpubMetadata> };
  coverUrl(): Promise<string | null>;
  destroy(): void;
};

function cleanText(value: unknown) {
  const trimmed = typeof value === "string" ? value.replace(/\s+/g, " ").trim() : undefined;
  return trimmed || undefined;
}

async function fingerprint(file: File) {
  const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

async function extractCover(book: EpubBook) {
  const coverUrl = await book.coverUrl();
  if (!coverUrl) return undefined;
  try {
    const response = await fetch(coverUrl);
    return response.ok ? await response.blob() : undefined;
  } catch {
    return undefined;
  }
}

function validateFile(file: File) {
  if (!file.name.toLowerCase().endsWith(".epub")) {
    throw new EpubImportError("Choose a file with the .epub extension.", "unsupported");
  }
  if (file.size === 0) {
    throw new EpubImportError("This EPUB is empty or unreadable.", "corrupt");
  }
  if (file.size > getMaxEpubBytes()) {
    throw new EpubImportError("This EPUB is larger than Miraf's 50 MB limit.", "too-large");
  }
}

export async function importEpub(
  file: File,
  repository: BookRepository,
): Promise<ImportedBook> {
  validateFile(file);
  await validateEpubArchive(file);
  const fileFingerprint = await fingerprint(file);
  if (await repository.findByFingerprint(fileFingerprint)) {
    throw new EpubImportError("This book is already in your library.", "duplicate");
  }

  let epubBook: EpubBook | undefined;
  try {
    const { default: ePub } = await import("epubjs");
    epubBook = ePub(await file.arrayBuffer()) as unknown as EpubBook;
    await epubBook.ready;
    const rawMetadata = await epubBook.loaded.metadata;
    if (rawMetadata.layout === "pre-paginated") {
      throw new EpubImportError("Fixed-layout EPUBs are not supported in Miraf V1.", "unsupported");
    }
    const metadata: BookMetadata = {
      title: cleanText(rawMetadata.title) ?? file.name.replace(/\.epub$/i, ""),
      author: cleanText(rawMetadata.creator),
      publisher: cleanText(rawMetadata.publisher),
      language: cleanText(rawMetadata.language),
      description: cleanText(rawMetadata.description),
      identifier: cleanText(rawMetadata.identifier),
    };
    const cover = await extractCover(epubBook);
    const now = new Date().toISOString();
    return {
      book: {
        id: crypto.randomUUID(),
        metadata,
        fileName: file.name,
        fileSize: file.size,
        fingerprint: fileFingerprint,
        hasCover: Boolean(cover),
        progress: 0,
        addedAt: now,
        updatedAt: now,
      },
      file,
      cover,
    };
  } catch (error) {
    if (error instanceof EpubImportError) throw error;
    throw new EpubImportError(
      "Miraf could not read this EPUB. The file may be damaged or unsupported.",
      "corrupt",
    );
  } finally {
    epubBook?.destroy();
  }
}
