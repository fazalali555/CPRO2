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
