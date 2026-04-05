"use client";
import { createContext, useContext, useState, useRef } from "react";
import { Link2, Pencil, Check, X, Plus, Trash2 } from "lucide-react";
import { Resume } from "@/types/resume";
import {
  ResumeSettings, DEFAULT_SETTINGS,
  fontFamilyCSS, fontSizePx, lineHeightVal, ACCENT,
} from "@/types/settings";

interface Props {
  resume: Resume;
  onUpdate?: (updated: Resume) => void;
  settings?: ResumeSettings;
}

type AccentColors = { headerBorder: string; sectionBorder: string; sectionText: string; pdfBorder: string; pdfTitle: string };
const AccentCtx = createContext<AccentColors>(ACCENT.black);

// Parse **bold** markers into React nodes
function parseMarkup(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  if (parts.length === 1) return text;
  return parts.map((part, i) =>
    part.startsWith("**") && part.endsWith("**")
      ? <strong key={i}>{part.slice(2, -2)}</strong>
      : <span key={i}>{part}</span>
  );
}

// Wrap/unwrap selection in **...**
function applyFormat(el: HTMLInputElement | HTMLTextAreaElement, draft: string, setDraft: (v: string) => void) {
  const start = el.selectionStart ?? 0;
  const end = el.selectionEnd ?? 0;
  if (start === end) return;
  const sel = draft.slice(start, end);
  const toggled = sel.startsWith("**") && sel.endsWith("**")
    ? draft.slice(0, start) + sel.slice(2, -2) + draft.slice(end)
    : draft.slice(0, start) + `**${sel}**` + draft.slice(end);
  setDraft(toggled);
}

export default function ResumePreview({ resume, onUpdate, settings = DEFAULT_SETTINGS }: Props) {
  const accent = ACCENT[settings.accentColor];

  function upd(partial: Partial<Resume>) {
    onUpdate?.({ ...resume, ...partial });
  }

  return (
    <AccentCtx.Provider value={accent}>
      <div
        id="resume-preview"
        className="bg-white text-gray-900 p-8 max-w-[800px] mx-auto shadow-lg"
        style={{
          fontFamily: fontFamilyCSS(settings.fontStyle),
          fontSize: fontSizePx(settings.fontSize),
          lineHeight: lineHeightVal(settings.lineHeight),
        }}
      >
        {/* Header */}
        <div
          className="text-center pb-4 mb-4 border-b-2"
          style={{ borderColor: accent.headerBorder }}
        >
          <h1 className="text-3xl font-bold tracking-wide uppercase text-gray-900">
            <E value={resume.name} bold onSave={onUpdate ? (v) => upd({ name: v }) : undefined} />
          </h1>
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-4 text-xs text-gray-600">
            <E value={resume.email} onSave={onUpdate ? (v) => upd({ email: v }) : undefined} />
            <E value={resume.phone} onSave={onUpdate ? (v) => upd({ phone: v }) : undefined} />
            <E value={resume.location} onSave={onUpdate ? (v) => upd({ location: v }) : undefined} />
            {resume.linkedin && (
              <E value={resume.linkedin} onSave={onUpdate ? (v) => upd({ linkedin: v }) : undefined} />
            )}
            {resume.github && (
              <E value={resume.github} onSave={onUpdate ? (v) => upd({ github: v }) : undefined} />
            )}
            {resume.website && (
              <E value={resume.website} onSave={onUpdate ? (v) => upd({ website: v }) : undefined} />
            )}
          </div>
        </div>

        {/* Summary */}
        {resume.summary && (
          <Section title="Professional Summary">
            <EBlock value={resume.summary} onSave={onUpdate ? (v) => upd({ summary: v }) : undefined} />
          </Section>
        )}

        {/* Skills */}
        <Section title="Technical Skills">
          <div className="grid grid-cols-1 gap-1">
            {Object.entries(resume.skills).map(([label, items]) =>
              items?.length > 0 ? (
                <EditableSkillRow
                  key={label}
                  label={label}
                  items={items}
                  onSave={onUpdate ? (newLabel, newItems) => {
                    const newSkills: Record<string, string[]> = {};
                    for (const [k, v] of Object.entries(resume.skills)) {
                      newSkills[k === label ? newLabel : k] = v;
                    }
                    newSkills[newLabel] = newItems;
                    upd({ skills: newSkills });
                  } : undefined}
                />
              ) : null
            )}
          </div>
        </Section>

        {/* Experience */}
        {resume.experience?.length > 0 && (
          <Section title="Professional Experience">
            {resume.experience.map((exp, i) => (
              <div key={i} className="mb-4">
                <div className="flex justify-between items-start gap-2">
                  <div className="flex flex-wrap items-baseline gap-x-1">
                    <E value={exp.title} bold onSave={onUpdate ? (v) => {
                      upd({ experience: resume.experience.map((e, j) => j === i ? { ...e, title: v } : e) });
                    } : undefined} />
                    <span className="text-gray-500"> — </span>
                    <E value={exp.company} onSave={onUpdate ? (v) => {
                      upd({ experience: resume.experience.map((e, j) => j === i ? { ...e, company: v } : e) });
                    } : undefined} />
                  </div>
                  <div className="text-xs text-gray-500 whitespace-nowrap flex items-center gap-1 flex-shrink-0">
                    <E value={exp.startDate} small onSave={onUpdate ? (v) => {
                      upd({ experience: resume.experience.map((e, j) => j === i ? { ...e, startDate: v } : e) });
                    } : undefined} />
                    <span>–</span>
                    <E value={exp.endDate} small onSave={onUpdate ? (v) => {
                      upd({ experience: resume.experience.map((e, j) => j === i ? { ...e, endDate: v } : e) });
                    } : undefined} />
                  </div>
                </div>
                {exp.location && (
                  <div className="mt-0.5">
                    <E value={exp.location} small muted onSave={onUpdate ? (v) => {
                      upd({ experience: resume.experience.map((e, j) => j === i ? { ...e, location: v } : e) });
                    } : undefined} />
                  </div>
                )}
                <ul className="list-disc list-outside ml-4 space-y-0.5 mt-1">
                  {exp.bullets.map((b, j) => (
                    <li key={j} className="text-gray-700">
                      <E value={b} wide onSave={onUpdate ? (v) => {
                        const bullets = exp.bullets.map((x, k) => k === j ? v : x);
                        upd({ experience: resume.experience.map((e, k) => k === i ? { ...e, bullets } : e) });
                      } : undefined} onDelete={onUpdate ? () => {
                        const bullets = exp.bullets.filter((_, k) => k !== j);
                        upd({ experience: resume.experience.map((e, k) => k === i ? { ...e, bullets } : e) });
                      } : undefined} />
                    </li>
                  ))}
                  {onUpdate && (
                    <li className="list-none ml-[-1rem]">
                      <button
                        onClick={() => {
                          const bullets = [...exp.bullets, "New bullet point"];
                          upd({ experience: resume.experience.map((e, k) => k === i ? { ...e, bullets } : e) });
                        }}
                        className="text-xs text-blue-500 hover:text-blue-700 flex items-center gap-1 mt-0.5"
                      >
                        <Plus size={11} /> Add bullet
                      </button>
                    </li>
                  )}
                </ul>
              </div>
            ))}
          </Section>
        )}

        {/* Projects */}
        {resume.projects?.length > 0 && (
          <Section title="Projects">
            {resume.projects.map((proj, i) => (
              <div key={i} className="mb-3">
                <div className="flex justify-between items-start gap-2">
                  <E value={proj.name} bold onSave={onUpdate ? (v) => {
                    upd({ projects: resume.projects.map((p, j) => j === i ? { ...p, name: v } : p) });
                  } : undefined} />
                  <ProjectUrlEditor
                    url={proj.url}
                    onSave={onUpdate ? (url) => {
                      upd({ projects: resume.projects.map((p, j) => j === i ? { ...p, url } : p) });
                    } : undefined}
                  />
                </div>
                <EBlock value={proj.description} onSave={onUpdate ? (v) => {
                  upd({ projects: resume.projects.map((p, j) => j === i ? { ...p, description: v } : p) });
                } : undefined} />
                <E value={proj.technologies.join(", ")} small muted onSave={onUpdate ? (v) => {
                  upd({ projects: resume.projects.map((p, j) => j === i ? { ...p, technologies: v.split(",").map((t) => t.trim()).filter(Boolean) } : p) });
                } : undefined} />
              </div>
            ))}
          </Section>
        )}

        {/* Education */}
        {resume.education?.length > 0 && (
          <Section title="Education">
            {resume.education.map((ed, i) => (
              <div key={i} className="flex flex-wrap justify-between items-baseline mb-1 gap-x-1">
                <div className="flex flex-wrap items-baseline gap-x-1">
                  <E value={ed.school} bold onSave={onUpdate ? (v) => {
                    upd({ education: resume.education.map((e, j) => j === i ? { ...e, school: v } : e) });
                  } : undefined} />
                  <span className="text-gray-500"> — </span>
                  <E value={ed.degree} onSave={onUpdate ? (v) => {
                    upd({ education: resume.education.map((e, j) => j === i ? { ...e, degree: v } : e) });
                  } : undefined} />
                  <span className="text-gray-500"> in </span>
                  <E value={ed.field} onSave={onUpdate ? (v) => {
                    upd({ education: resume.education.map((e, j) => j === i ? { ...e, field: v } : e) });
                  } : undefined} />
                </div>
                <E value={ed.graduationDate} small muted onSave={onUpdate ? (v) => {
                  upd({ education: resume.education.map((e, j) => j === i ? { ...e, graduationDate: v } : e) });
                } : undefined} />
              </div>
            ))}
          </Section>
        )}
      </div>
    </AccentCtx.Provider>
  );
}

/* ── Section with accent colors from context ── */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const c = useContext(AccentCtx);
  return (
    <div className="mb-4">
      <h2
        className="text-xs font-bold uppercase tracking-widest border-b pb-0.5 mb-2"
        style={{ color: c.sectionText, borderColor: c.sectionBorder }}
      >
        {title}
      </h2>
      {children}
    </div>
  );
}

/* ── Inline editable single-line ── */
function E({
  value, bold, small, muted, wide, onSave, onDelete,
}: {
  value: string; bold?: boolean; small?: boolean; muted?: boolean; wide?: boolean;
  onSave?: (v: string) => void; onDelete?: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  const cls = [
    bold  ? "font-bold text-gray-900" : "",
    small ? "text-xs" : "",
    muted ? "text-gray-500" : (!bold ? "text-gray-700" : ""),
  ].filter(Boolean).join(" ");

  if (!onSave) return <span className={cls}>{parseMarkup(value)}</span>;

  if (editing) {
    return (
      <span className="inline-flex items-center gap-1">
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); if (inputRef.current) applyFormat(inputRef.current, draft, setDraft); }}
          title="Bold selected text (Ctrl+B)"
          className="px-1.5 py-0 text-xs font-bold border border-gray-300 rounded hover:bg-gray-100 text-gray-700 flex-shrink-0 leading-4"
        >B</button>
        <input
          ref={inputRef}
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") { onSave(draft.trim()); setEditing(false); }
            if (e.key === "Escape") setEditing(false);
            if ((e.ctrlKey || e.metaKey) && e.key === "b") { e.preventDefault(); if (inputRef.current) applyFormat(inputRef.current, draft, setDraft); }
          }}
          className={`border border-blue-400 rounded px-1 py-0 outline-none text-gray-800 ${bold ? "font-bold" : ""} ${small ? "text-xs" : "text-sm"}`}
          style={{ width: wide ? "100%" : `${Math.max((draft.length || 8) + 2, 8)}ch`, minWidth: "6ch" }}
        />
        <button onClick={() => { onSave(draft.trim()); setEditing(false); }} className="text-green-600 hover:text-green-700 flex-shrink-0"><Check size={11} /></button>
        <button onClick={() => setEditing(false)} className="text-gray-400 hover:text-gray-600 flex-shrink-0"><X size={11} /></button>
        {onDelete && <button onClick={onDelete} className="text-red-400 hover:text-red-600 flex-shrink-0"><Trash2 size={11} /></button>}
      </span>
    );
  }

  return (
    <span
      className={`cursor-pointer hover:bg-yellow-50 rounded px-0.5 transition-colors ${cls}`}
      title="Click to edit"
      onClick={() => { setDraft(value); setEditing(true); }}
    >
      {parseMarkup(value)}
    </span>
  );
}

/* ── Multiline editable block ── */
function EBlock({ value, onSave }: { value: string; onSave?: (v: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const taRef = useRef<HTMLTextAreaElement>(null);

  if (!onSave) return <p className="text-gray-700">{parseMarkup(value)}</p>;

  if (editing) {
    return (
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-1.5 mb-0.5">
          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); if (taRef.current) applyFormat(taRef.current, draft, setDraft); }}
            title="Bold selected text (Ctrl+B)"
            className="px-2 py-0.5 text-xs font-bold border border-gray-300 rounded hover:bg-gray-100 text-gray-700"
          >B</button>
          <span className="text-xs text-gray-400">Metni seçip B'ye tıkla</span>
        </div>
        <textarea
          ref={taRef}
          autoFocus value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === "b") { e.preventDefault(); if (taRef.current) applyFormat(taRef.current, draft, setDraft); }
          }}
          rows={4}
          className="w-full border border-blue-400 rounded px-2 py-1 text-sm outline-none text-gray-800 resize-y"
        />
        <div className="flex gap-2">
          <button onClick={() => { onSave(draft.trim()); setEditing(false); }} className="text-xs text-green-600 hover:text-green-700 flex items-center gap-1"><Check size={11} /> Save</button>
          <button onClick={() => setEditing(false)} className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"><X size={11} /> Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <p className="text-gray-700 cursor-pointer hover:bg-yellow-50 rounded px-0.5 transition-colors" title="Click to edit"
      onClick={() => { setDraft(value); setEditing(true); }}>
      {parseMarkup(value)}
    </p>
  );
}

/* ── Editable skill row ── */
function EditableSkillRow({ label, items, onSave }: {
  label: string; items: string[]; onSave?: (label: string, items: string[]) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draftLabel, setDraftLabel] = useState(label);
  const [draftItems, setDraftItems] = useState(items.join(", "));

  if (!onSave) {
    return (
      <p className="text-gray-700">
        <span className="font-semibold">{label}: </span>{items.join(", ")}
      </p>
    );
  }

  if (editing) {
    return (
      <div className="flex gap-1 items-center mb-1">
        <input value={draftLabel} onChange={(e) => setDraftLabel(e.target.value)}
          className="border border-blue-400 rounded px-1 py-0 text-xs font-semibold outline-none text-gray-800 w-28" placeholder="Category" />
        <span className="text-gray-500 text-xs">:</span>
        <input autoFocus value={draftItems} onChange={(e) => setDraftItems(e.target.value)}
          className="border border-blue-400 rounded px-1 py-0 text-xs outline-none text-gray-800 flex-1"
          placeholder="skill1, skill2, ..."
          onKeyDown={(e) => {
            if (e.key === "Enter") { onSave(draftLabel.trim(), draftItems.split(",").map((s) => s.trim()).filter(Boolean)); setEditing(false); }
            if (e.key === "Escape") setEditing(false);
          }} />
        <button onClick={() => { onSave(draftLabel.trim(), draftItems.split(",").map((s) => s.trim()).filter(Boolean)); setEditing(false); }} className="text-green-600 hover:text-green-700"><Check size={12} /></button>
        <button onClick={() => setEditing(false)} className="text-gray-400 hover:text-gray-600"><X size={12} /></button>
      </div>
    );
  }

  return (
    <p className="text-gray-700 cursor-pointer hover:bg-yellow-50 rounded px-0.5 transition-colors" title="Click to edit"
      onClick={() => { setDraftLabel(label); setDraftItems(items.join(", ")); setEditing(true); }}>
      <span className="font-semibold">{label}: </span>{items.join(", ")}
    </p>
  );
}

/* ── Project URL editor ── */
function ProjectUrlEditor({ url, onSave }: { url?: string; onSave?: (url: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(url ?? "");

  if (!onSave) {
    return url ? <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">{url}</a> : null;
  }
  if (editing) {
    return (
      <span className="inline-flex items-center gap-1">
        <input autoFocus value={draft} onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") { onSave(draft.trim()); setEditing(false); }
            if (e.key === "Escape") setEditing(false);
          }}
          placeholder="https://..." className="text-xs border border-blue-400 rounded px-1.5 py-0.5 w-52 outline-none text-gray-800" />
        <button onClick={() => { onSave(draft.trim()); setEditing(false); }} className="text-green-600 hover:text-green-700"><Check size={12} /></button>
        <button onClick={() => setEditing(false)} className="text-gray-400 hover:text-gray-600"><X size={12} /></button>
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 flex-shrink-0">
      {url && <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">{url}</a>}
      <button onClick={() => { setDraft(url ?? ""); setEditing(true); }} className="text-gray-400 hover:text-blue-500 transition-colors" title="Edit link">
        {url ? <Pencil size={11} /> : <Link2 size={13} />}
      </button>
    </span>
  );
}
