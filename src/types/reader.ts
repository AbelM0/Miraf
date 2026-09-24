export type ReaderTheme = "light" | "sepia" | "dark";
export type ReaderFlow = "paginated" | "scrolled";
export type ReaderFont = "serif" | "sans";
export type ReaderWidth = "narrow" | "standard" | "wide";

export type ReaderPreferences = {
  theme: ReaderTheme;
  flow: ReaderFlow;
  fontFamily: ReaderFont;
  fontSize: number;
  lineHeight: number;
  contentWidth: ReaderWidth;
};

export type TocItem = {
  id: string;
  href: string;
  label: string;
  subitems?: TocItem[];
};

