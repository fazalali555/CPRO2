export type HeadingLevel = "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "normal" | "title" | "subtitle" | "quote";
export type Alignment = "left" | "center" | "right" | "justify";

export interface TextFormat {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  backgroundColor?: string;
  alignment?: Alignment;
}

export interface ContentBlock {
  id: string;
  type: "paragraph" | "heading" | "image" | "table";
  content: string;
  format: TextFormat;
  heading: HeadingLevel;
}

export interface EditorState {
  blocks: ContentBlock[];
  version: number;
  lastModified: number;
}

export type PageOrientation = "portrait" | "landscape";
export type PaperSize = "A4" | "Letter" | "Legal";
export type ViewMode = 'print' | 'fluid' | 'split';

export interface PageMargins {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface EditorMetrics {
  wordCount: number;
  charCount: number;
  paragraphCount: number;
  currentPage: number;
  totalPages: number;
}

export interface EditorSettings {
  viewMode: ViewMode;
  zoom: number;
  margins: PageMargins;
  pageSize: PaperSize;
  orientation: PageOrientation;
  showRuler: boolean;
  spellCheck: boolean;
  watermark?: string;
  pageColor?: string;
  showPageNumbers?: boolean;
  showGridlines?: boolean;
  showNavPane?: boolean;
}

export interface CommentData {
  id: string;
  author: string;
  content: string;
  timestamp: number;
  resolved: boolean;
  selection?: { from: number; to: number };
}
