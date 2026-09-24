export class EpubImportError extends Error {
  constructor(
    message: string,
    readonly code:
      | "unsupported"
      | "too-large"
      | "duplicate"
      | "corrupt"
      | "storage",
  ) {
    super(message);
    this.name = "EpubImportError";
  }
}

