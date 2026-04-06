"use client";

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  PDFDownloadLink,
  Font,
  Link,
} from "@react-pdf/renderer";
import { useState } from "react";
import { Resume, ElementStyle } from "@/types/resume";
import {
  ResumeSettings,
  DEFAULT_SETTINGS,
  fontSizePt,
  lineHeightPDF,
  nameSizePt,
  ACCENT,
} from "@/types/settings";
import { Download, Pencil, Check } from "lucide-react";

function makeStyles(s: ResumeSettings) {
  const font = s.fontStyle;
  const base =
    font === "serif"
      ? "Times-Roman"
      : font === "mono"
        ? "Courier"
        : "Helvetica";
  const bold =
    font === "serif"
      ? "Times-Bold"
      : font === "mono"
        ? "Courier-Bold"
        : "Helvetica-Bold";
  const fs = fontSizePt(s.fontSize);
  const lh = lineHeightPDF(s.lineHeight);
  const ac = ACCENT[s.accentColor];
  return {
    boldFont: bold,
    styles: StyleSheet.create({
      page: {
        padding: 40,
        fontSize: fs,
        fontFamily: base,
        color: "#111111",
        lineHeight: lh,
      },
      header: {
        textAlign: s.headerAlign === "left" ? "left" : "center",
        marginBottom: 10,
        borderBottomWidth: 1.5,
        borderBottomColor: ac.pdfBorder,
        paddingBottom: 8,
      },
      name: {
        fontSize: nameSizePt(s.nameSize ?? "lg"),
        fontFamily: (s.nameBold ?? true) ? bold : base,
        textTransform:
          (s.nameCase ?? "uppercase") === "uppercase" ? "uppercase" : "none",
        letterSpacing: 1.5,
        marginBottom: 4,
      },
      contactRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: s.headerAlign === "left" ? "flex-start" : "center",
        gap: 6,
        fontSize: fs * 0.9,
        color: "#444444",
        marginTop: 8,
      },
      contactItem: { marginHorizontal: 4 },
      sectionTitle: {
        fontSize: fs * 0.8,
        fontFamily: bold,
        textTransform:
          (s.sectionHeaderCase ?? "uppercase") === "uppercase"
            ? "uppercase"
            : "none",
        letterSpacing: 2,
        borderBottomWidth: 0.5,
        borderBottomColor: ac.pdfBorder,
        paddingBottom: 2,
        marginTop: 10,
        marginBottom: 4,
        color: ac.pdfTitle,
      },
      skillRow: { flexDirection: "row", marginBottom: 2 },
      skillLabel: { fontFamily: bold, marginRight: 4, minWidth: 100 },
      expHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 1,
      },
      expTitle: { fontFamily: bold },
      expCompany: { color: "#444444" },
      expDate: { fontSize: fs * 0.9, color: "#666666" },
      expLocation: { fontSize: fs * 0.9, color: "#888888", marginBottom: 2 },
      bullet: { flexDirection: "row", marginBottom: 1, paddingLeft: 8 },
      bulletDot: { marginRight: 4, marginTop: 1 },
      bulletText: { flex: 1, color: "#333333" },
      projectHeader: { flexDirection: "row", justifyContent: "space-between" },
      projectName: { fontFamily: bold },
      projectUrl: { fontSize: fs * 0.9, color: "#666666" },
      projectDesc: { color: "#333333", marginTop: 1 },
      projectTech: { fontSize: fs * 0.9, color: "#666666", marginTop: 1 },
      eduRow: { flexDirection: "row", justifyContent: "space-between" },
      eduBold: { fontFamily: bold },
      mb3: { marginBottom: 4 },
    }),
  };
}

// Renders text with **bold** markers as bold inline segments
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function RichText({
  text,
  style,
  boldFont,
}: {
  text: string;
  style: any;
  boldFont: string;
}) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  if (parts.length === 1) return <Text style={style}>{text}</Text>;
  return (
    <Text style={style}>
      {parts.map((part, i) =>
        part.startsWith("**") && part.endsWith("**") ? (
          <Text key={i} style={{ fontFamily: boldFont }}>
            {part.slice(2, -2)}
          </Text>
        ) : (
          <Text key={i}>{part}</Text>
        ),
      )}
    </Text>
  );
}

// Convert ElementStyle to react-pdf compatible style object
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function pdfElemStyle(
  s: ElementStyle | undefined,
  boldFont: string,
  baseFont: string,
): any {
  if (!s) return {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const out: any = {};
  if (s.fontSize) out.fontSize = s.fontSize * 0.75; // px to pt approx
  if (s.fontFamily) {
    // Map CSS font-family to PDF font
    if (
      s.fontFamily.includes("Arial") ||
      s.fontFamily.includes("Helvetica") ||
      s.fontFamily.includes("Verdana") ||
      s.fontFamily.includes("Trebuchet")
    )
      out.fontFamily = "Helvetica";
    else if (s.fontFamily.includes("Courier")) out.fontFamily = "Courier";
    else if (s.fontFamily.includes("Georgia") || s.fontFamily.includes("Times"))
      out.fontFamily = "Times-Roman";
  }
  if (s.fontWeight === "bold") out.fontFamily = boldFont;
  if (s.fontStyle === "italic")
    out.fontFamily = (out.fontFamily || baseFont) + "-Oblique";
  if (s.textDecoration === "underline") out.textDecoration = "underline";
  if (s.textTransform === "uppercase") out.textTransform = "uppercase";
  if (s.color) out.color = s.color;
  return out;
}

function ResumePDFDoc({
  resume,
  settings = DEFAULT_SETTINGS,
}: {
  resume: Resume;
  settings?: ResumeSettings;
}) {
  const { styles, boldFont } = makeStyles(settings);
  const baseFont =
    settings.fontStyle === "serif"
      ? "Times-Roman"
      : settings.fontStyle === "mono"
        ? "Courier"
        : "Helvetica";
  const so = resume.styleOverrides ?? {};
  function es(key: string) {
    return pdfElemStyle(so[key], boldFont, baseFont);
  }

  const DEFAULT_ORDER = [
    "summary",
    "skills",
    "experience",
    "projects",
    "education",
  ];
  const DEFAULT_TITLES: Record<string, string> = {
    summary: "Professional Summary",
    skills: "Technical Skills",
    experience: "Professional Experience",
    projects: "Projects",
    education: "Education",
  };
  const sectionOrder = resume.sectionOrder ?? DEFAULT_ORDER;
  const sectionTitles = { ...DEFAULT_TITLES, ...resume.sectionTitles };

  function renderSection(key: string) {
    const title = sectionTitles[key] ?? key;
    switch (key) {
      case "summary":
        if (!resume.summary) return null;
        return (
          <View key={key}>
            <Text style={styles.sectionTitle}>{title}</Text>
            <RichText
              text={resume.summary}
              style={[{ color: "#333333" }, es("summary")]}
              boldFont={boldFont}
            />
          </View>
        );
      case "skills":
        return (
          <View key={key}>
            <Text style={styles.sectionTitle}>{title}</Text>
            {Object.entries(resume.skills).map(([label, items]) =>
              items?.length > 0 ? (
                <View key={label} style={styles.skillRow}>
                  <Text style={styles.skillLabel}>{label}:</Text>
                  <Text>{items.join(", ")}</Text>
                </View>
              ) : null,
            )}
          </View>
        );
      case "experience":
        if (!resume.experience?.length) return null;
        return (
          <View key={key}>
            <Text style={styles.sectionTitle}>{title}</Text>
            {resume.experience.map((exp, i) => (
              <View key={i} style={styles.mb3}>
                <View style={styles.expHeader}>
                  <View style={{ flexDirection: "row" }}>
                    <Text style={[styles.expTitle, es("jobTitle")]}>
                      {exp.title}
                    </Text>
                    <Text style={[styles.expCompany, es("company")]}>
                      {" "}
                      — {exp.company}
                    </Text>
                  </View>
                  <Text style={[styles.expDate, es("date")]}>
                    {exp.startDate} – {exp.endDate}
                  </Text>
                </View>
                {exp.location && (
                  <Text style={styles.expLocation}>{exp.location}</Text>
                )}
                {exp.bullets.map((b, j) => (
                  <View key={j} style={styles.bullet}>
                    <Text style={styles.bulletDot}>•</Text>
                    <RichText
                      text={b}
                      style={[styles.bulletText, es("bullet")]}
                      boldFont={boldFont}
                    />
                  </View>
                ))}
              </View>
            ))}
          </View>
        );
      case "projects":
        if (!resume.projects?.length) return null;
        return (
          <View key={key}>
            <Text style={styles.sectionTitle}>{title}</Text>
            {resume.projects.map((proj, i) => (
              <View key={i} style={styles.mb3}>
                <View style={styles.projectHeader}>
                  <Text style={styles.projectName}>{proj.name}</Text>
                  {proj.url && (
                    <Link
                      src={proj.url}
                      style={{
                        fontSize: 8,
                        color: "#2563eb",
                        textDecoration: "underline",
                      }}
                    >
                      {proj.url}
                    </Link>
                  )}
                </View>
                <RichText
                  text={proj.description}
                  style={styles.projectDesc}
                  boldFont={boldFont}
                />
                <Text style={styles.projectTech}>
                  {proj.technologies.join(" · ")}
                </Text>
              </View>
            ))}
          </View>
        );
      case "education":
        if (!resume.education?.length) return null;
        return (
          <View key={key}>
            <Text style={styles.sectionTitle}>{title}</Text>
            {resume.education.map((ed, i) => (
              <View key={i} style={styles.eduRow}>
                <Text>
                  <Text style={styles.eduBold}>{ed.school}</Text>
                  {ed.degree} in {ed.field}
                  {ed.gpa ? ` · GPA: ${ed.gpa}` : ""}
                </Text>
                <Text style={{ fontSize: 9, color: "#666666" }}>
                  {ed.graduationDate}
                </Text>
              </View>
            ))}
          </View>
        );
      default: {
        const custom = resume.customSections?.[key];
        if (!custom?.items?.length) return null;
        return (
          <View key={key}>
            <Text style={styles.sectionTitle}>{title}</Text>
            {custom.items.map((item, i) => (
              <View key={i} style={styles.bullet}>
                <Text style={styles.bulletDot}>•</Text>
                <RichText
                  text={item}
                  style={styles.bulletText}
                  boldFont={boldFont}
                />
              </View>
            ))}
          </View>
        );
      }
    }
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.name, es("name")]}>{resume.name}</Text>
          <View style={styles.contactRow}>
            {resume.email && (
              <Text style={[styles.contactItem, es("contact")]}>
                {resume.email}
              </Text>
            )}
            {resume.phone && (
              <Text style={[styles.contactItem, es("contact")]}>
                {resume.phone}
              </Text>
            )}
            {resume.location && (
              <Text style={[styles.contactItem, es("contact")]}>
                {resume.location}
              </Text>
            )}
            {resume.linkedin && (
              <Link
                src={
                  resume.linkedin.startsWith("http")
                    ? resume.linkedin
                    : `https://${resume.linkedin}`
                }
                style={styles.contactItem}
              >
                {resume.linkedin}
              </Link>
            )}
            {resume.github && (
              <Link
                src={
                  resume.github.startsWith("http")
                    ? resume.github
                    : `https://${resume.github}`
                }
                style={styles.contactItem}
              >
                {resume.github}
              </Link>
            )}
            {resume.website && (
              <Link
                src={
                  resume.website.startsWith("http")
                    ? resume.website
                    : `https://${resume.website}`
                }
                style={styles.contactItem}
              >
                {resume.website}
              </Link>
            )}
            {(resume.extraContact ?? []).map((c, i) => (
              <Text key={i} style={styles.contactItem}>
                {c}
              </Text>
            ))}
          </View>
        </View>

        {/* Sections in order */}
        {sectionOrder.map((key) => renderSection(key))}
      </Page>
    </Document>
  );
}

export default function PDFExportButton({
  resume,
  settings = DEFAULT_SETTINGS,
}: {
  resume: Resume;
  settings?: ResumeSettings;
}) {
  const defaultName = `${resume.name.replace(/\s+/g, "_")}_Resume`;
  const [basename, setBasename] = useState(defaultName);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(defaultName);

  const filename = `${basename.trim() || defaultName}.pdf`;

  function startEdit() {
    setDraft(basename);
    setEditing(true);
  }

  function confirmEdit() {
    setBasename(draft.trim() || defaultName);
    setEditing(false);
  }

  return (
    <div className="flex items-center gap-1.5 sm:gap-2">
      {/* Filename editor */}
      <div className="hidden sm:flex items-center gap-1 bg-slate-300 border border-slate-400 rounded-lg px-2 py-1.5 text-slate-700">
        {editing ? (
          <>
            <input
              autoFocus
              className="bg-transparent text-xs w-40 outline-none text-slate-800"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") confirmEdit();
                if (e.key === "Escape") setEditing(false);
              }}
            />
            <span className="text-xs text-slate-500">.pdf</span>
            <button
              onClick={confirmEdit}
              className="ml-1 text-green-600 hover:text-green-700"
            >
              <Check size={13} />
            </button>
          </>
        ) : (
          <>
            <span className="text-xs text-slate-600 max-w-[140px] truncate">
              {filename}
            </span>
            <button
              onClick={startEdit}
              className="ml-1 text-slate-500 hover:text-slate-700"
            >
              <Pencil size={11} />
            </button>
          </>
        )}
      </div>

      {/* Download button */}
      <PDFDownloadLink
        document={<ResumePDFDoc resume={resume} settings={settings} />}
        fileName={filename}
      >
        {({ loading }) => (
          <button
            className="flex items-center gap-1.5 sm:gap-2 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors disabled:opacity-60"
            disabled={loading}
          >
            <Download size={14} />
            <span className="hidden sm:inline">
              {loading ? "Preparing..." : "Download PDF"}
            </span>
            <span className="sm:hidden">{loading ? "..." : "PDF"}</span>
          </button>
        )}
      </PDFDownloadLink>
    </div>
  );
}
