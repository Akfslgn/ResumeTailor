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
import { Resume } from "@/types/resume";
import { Download, Pencil, Check } from "lucide-react";

Font.register({
  family: "Times",
  fonts: [
    {
      src: "https://fonts.gstatic.com/s/timesnewroman/v1/stub-placeholder.ttf",
    },
  ],
});

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#111111",
    lineHeight: 1.4,
  },
  header: {
    textAlign: "center",
    marginBottom: 10,
    borderBottomWidth: 1.5,
    borderBottomColor: "#111111",
    paddingBottom: 8,
  },
  name: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  contactRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 6,
    fontSize: 9,
    color: "#444444",
    marginTop: 8,
  },
  contactItem: {
    marginHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 2,
    borderBottomWidth: 0.5,
    borderBottomColor: "#888888",
    paddingBottom: 2,
    marginTop: 10,
    marginBottom: 4,
    color: "#333333",
  },
  skillRow: {
    flexDirection: "row",
    marginBottom: 2,
  },
  skillLabel: {
    fontFamily: "Helvetica-Bold",
    marginRight: 4,
    minWidth: 100,
  },
  expHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 1,
  },
  expTitle: {
    fontFamily: "Helvetica-Bold",
  },
  expCompany: {
    color: "#444444",
  },
  expDate: {
    fontSize: 9,
    color: "#666666",
  },
  expLocation: {
    fontSize: 9,
    color: "#888888",
    marginBottom: 2,
  },
  bullet: {
    flexDirection: "row",
    marginBottom: 1,
    paddingLeft: 8,
  },
  bulletDot: {
    marginRight: 4,
    marginTop: 1,
  },
  bulletText: {
    flex: 1,
    color: "#333333",
  },
  projectHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  projectName: {
    fontFamily: "Helvetica-Bold",
  },
  projectUrl: {
    fontSize: 9,
    color: "#666666",
  },
  projectDesc: {
    color: "#333333",
    marginTop: 1,
  },
  projectTech: {
    fontSize: 9,
    color: "#666666",
    marginTop: 1,
  },
  eduRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  mb3: { marginBottom: 4 },
});

function ResumePDFDoc({ resume }: { resume: Resume }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.name}>{resume.name}</Text>
          <View style={styles.contactRow}>
            {resume.email && (
              <Text style={styles.contactItem}>{resume.email}</Text>
            )}
            {resume.phone && (
              <Text style={styles.contactItem}>{resume.phone}</Text>
            )}
            {resume.location && (
              <Text style={styles.contactItem}>{resume.location}</Text>
            )}
            {resume.linkedin && (
              <Link src={resume.linkedin.startsWith("http") ? resume.linkedin : `https://${resume.linkedin}`} style={styles.contactItem}>
                {resume.linkedin}
              </Link>
            )}
            {resume.github && (
              <Link src={resume.github.startsWith("http") ? resume.github : `https://${resume.github}`} style={styles.contactItem}>
                {resume.github}
              </Link>
            )}
            {resume.website && (
              <Link src={resume.website.startsWith("http") ? resume.website : `https://${resume.website}`} style={styles.contactItem}>
                {resume.website}
              </Link>
            )}
          </View>
        </View>

        {/* Summary */}
        {resume.summary && (
          <View>
            <Text style={styles.sectionTitle}>Professional Summary</Text>
            <Text style={{ color: "#333333" }}>{resume.summary}</Text>
          </View>
        )}

        {/* Skills */}
        <View>
          <Text style={styles.sectionTitle}>Technical Skills</Text>
          {Object.entries(resume.skills).map(([label, items]) =>
            items?.length > 0 ? (
              <View key={label} style={styles.skillRow}>
                <Text style={styles.skillLabel}>{label}:</Text>
                <Text>{items.join(", ")}</Text>
              </View>
            ) : null
          )}
        </View>

        {/* Experience */}
        {resume.experience?.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>Professional Experience</Text>
            {resume.experience.map((exp, i) => (
              <View key={i} style={styles.mb3}>
                <View style={styles.expHeader}>
                  <View style={{ flexDirection: "row" }}>
                    <Text style={styles.expTitle}>{exp.title}</Text>
                    <Text style={styles.expCompany}> — {exp.company}</Text>
                  </View>
                  <Text style={styles.expDate}>
                    {exp.startDate} – {exp.endDate}
                  </Text>
                </View>
                {exp.location && (
                  <Text style={styles.expLocation}>{exp.location}</Text>
                )}
                {exp.bullets.map((b, j) => (
                  <View key={j} style={styles.bullet}>
                    <Text style={styles.bulletDot}>•</Text>
                    <Text style={styles.bulletText}>{b}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        )}

        {/* Projects */}
        {resume.projects?.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>Projects</Text>
            {resume.projects.map((proj, i) => (
              <View key={i} style={styles.mb3}>
                <View style={styles.projectHeader}>
                  <Text style={styles.projectName}>{proj.name}</Text>
                  {proj.url && (
                    <Link src={proj.url} style={{ fontSize: 8, color: "#2563eb", textDecoration: "underline" }}>
                      {proj.url}
                    </Link>
                  )}
                </View>
                <Text style={styles.projectDesc}>{proj.description}</Text>
                <Text style={styles.projectTech}>
                  {proj.technologies.join(" · ")}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Education */}
        {resume.education?.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>Education</Text>
            {resume.education.map((ed, i) => (
              <View key={i} style={styles.eduRow}>
                <Text>
                  <Text style={{ fontFamily: "Helvetica-Bold" }}>
                    {ed.school}
                  </Text>
                  {" — "}
                  {ed.degree} in {ed.field}
                  {ed.gpa ? ` · GPA: ${ed.gpa}` : ""}
                </Text>
                <Text style={{ fontSize: 9, color: "#666666" }}>
                  {ed.graduationDate}
                </Text>
              </View>
            ))}
          </View>
        )}
      </Page>
    </Document>
  );
}

export default function PDFExportButton({ resume }: { resume: Resume }) {
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
    <div className="flex items-center gap-2">
      {/* Filename editor */}
      <div className="flex items-center gap-1 bg-slate-300 border border-slate-400 rounded-lg px-2 py-1.5 text-slate-700">
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
        document={<ResumePDFDoc resume={resume} />}
        fileName={filename}
      >
        {({ loading }) => (
          <button
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-60"
            disabled={loading}
          >
            <Download size={15} />
            {loading ? "Preparing..." : "Download PDF"}
          </button>
        )}
      </PDFDownloadLink>
    </div>
  );
}
