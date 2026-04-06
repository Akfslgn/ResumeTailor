export interface ResumeSettings {
  fontStyle: "serif" | "sans" | "mono";
  fontSize: "sm" | "md" | "lg";
  lineHeight: "tight" | "normal" | "relaxed";
  accentColor: "black" | "navy" | "slate" | "forest";
  nameSize: "sm" | "md" | "lg" | "xl";
  nameCase: "normal" | "uppercase";
  nameBold: boolean;
  sectionHeaderCase: "normal" | "uppercase";
  headerAlign: "center" | "left";
}

export const DEFAULT_SETTINGS: ResumeSettings = {
  fontStyle: "serif",
  fontSize: "md",
  lineHeight: "normal",
  accentColor: "black",
  nameSize: "lg",
  nameCase: "uppercase",
  nameBold: true,
  sectionHeaderCase: "uppercase",
  headerAlign: "center",
};

export function fontFamilyCSS(f: ResumeSettings["fontStyle"]): string {
  if (f === "sans") return "Arial, Helvetica, sans-serif";
  if (f === "mono") return "'Courier New', Courier, monospace";
  return "Georgia, serif";
}

export function fontSizePx(f: ResumeSettings["fontSize"]): number {
  return f === "sm" ? 12 : f === "lg" ? 15 : 13;
}

export function lineHeightVal(f: ResumeSettings["lineHeight"]): number {
  return f === "tight" ? 1.3 : f === "relaxed" ? 1.7 : 1.5;
}

export function fontSizePt(f: ResumeSettings["fontSize"]): number {
  return f === "sm" ? 9 : f === "lg" ? 11 : 10;
}

export function lineHeightPDF(f: ResumeSettings["lineHeight"]): number {
  return f === "tight" ? 1.2 : f === "relaxed" ? 1.6 : 1.4;
}

export function nameSizePx(s: ResumeSettings["nameSize"]): string {
  return s === "sm"
    ? "1.25rem"
    : s === "xl"
      ? "2.25rem"
      : s === "lg"
        ? "1.875rem"
        : "1.5rem";
}

export function nameSizePt(s: ResumeSettings["nameSize"]): number {
  return s === "sm" ? 14 : s === "xl" ? 26 : s === "lg" ? 22 : 18;
}

export const ACCENT = {
  black: {
    headerBorder: "#111111",
    sectionBorder: "#cccccc",
    sectionText: "#222222",
    pdfBorder: "#111111",
    pdfTitle: "#333333",
  },
  navy: {
    headerBorder: "#1e3a5f",
    sectionBorder: "#93c5fd",
    sectionText: "#1e3a8a",
    pdfBorder: "#1e3a5f",
    pdfTitle: "#1e40af",
  },
  slate: {
    headerBorder: "#475569",
    sectionBorder: "#cbd5e1",
    sectionText: "#334155",
    pdfBorder: "#475569",
    pdfTitle: "#334155",
  },
  forest: {
    headerBorder: "#14532d",
    sectionBorder: "#86efac",
    sectionText: "#166534",
    pdfBorder: "#14532d",
    pdfTitle: "#166534",
  },
} as const;
