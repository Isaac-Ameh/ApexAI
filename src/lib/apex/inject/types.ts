/** Canonical, format-agnostic document IR for course injection.
 *  Downstream Course Intelligence must consume this — not raw PDF strings. */

export type SourceFormat = "pdf" | "docx" | "pptx" | "markdown" | "txt";

export type SourceOrigin = "upload" | "paste" | "sample";

export type LocatorType = "page" | "slide" | "section" | "text";

export type BlockType = "heading" | "paragraph" | "list" | "table";

/** Where a block came from. Page is PDF-only — never a fake universal key. */
export type SourceLocator = {
  type: LocatorType;
  page?: number;
  slide?: number;
  heading?: string;
  section?: string;
  order: number;
};

export type NormalizedBlock = {
  type: BlockType;
  text: string;
  locator: SourceLocator;
  /** Nearest heading context, when known. */
  heading?: string;
  order: number;
};

export type NormalizedSource = {
  name: string;
  format: SourceFormat;
  mimeType: string | null;
  kind: SourceOrigin;
  title?: string;
  pageCount?: number | null;
  slideCount?: number | null;
  truncated?: boolean;
};

export type NormalizedDocument = {
  source: NormalizedSource;
  blocks: NormalizedBlock[];
};

export const INJECTION_LIMITS = {
  maxPages: 80,
  maxSlides: 80,
  maxChars: 120_000,
} as const;
