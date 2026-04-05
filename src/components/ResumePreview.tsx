"use client";
import { useState } from "react";
import { Link2, Pencil, Check, X } from "lucide-react";
import { Resume } from "@/types/resume";

interface Props {
  resume: Resume;
  onUpdate?: (updated: Resume) => void;
}

export default function ResumePreview({ resume, onUpdate }: Props) {
  return (
    <div
      id="resume-preview"
      className="bg-white text-gray-900 p-8 font-sans text-sm leading-relaxed max-w-[800px] mx-auto shadow-lg"
      style={{ fontFamily: "Georgia, serif" }}
    >
      {/* Header */}
      <div className="text-center border-b-2 border-gray-800 pb-4 mb-4">
        <h1 className="text-3xl font-bold tracking-wide uppercase text-gray-900">
          {resume.name}
        </h1>
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-4 text-xs text-gray-600">
          {resume.email && <span>{resume.email}</span>}
          {resume.phone && <span>{resume.phone}</span>}
          {resume.location && <span>{resume.location}</span>}
          {resume.linkedin && (
            <span>
              linkedin.com/in/{resume.linkedin.replace(/.*\/in\//, "")}
            </span>
          )}
          {resume.github && (
            <span>
              github.com/{resume.github.replace(/.*github\.com\//, "")}
            </span>
          )}
          {resume.website && <span>{resume.website}</span>}
        </div>
      </div>

      {/* Summary */}
      {resume.summary && (
        <Section title="Professional Summary">
          <p className="text-gray-700">{resume.summary}</p>
        </Section>
      )}

      {/* Skills */}
      <Section title="Technical Skills">
        <div className="grid grid-cols-1 gap-1">
          {Object.entries(resume.skills).map(([label, items]) =>
            items?.length > 0 ? (
              <SkillRow key={label} label={label} items={items} />
            ) : null
          )}
        </div>
      </Section>

      {/* Experience */}
      {resume.experience?.length > 0 && (
        <Section title="Professional Experience">
          {resume.experience.map((exp, i) => (
            <div key={i} className="mb-4">
              <div className="flex justify-between items-baseline">
                <div>
                  <EditableText
                    value={exp.title}
                    bold
                    onSave={onUpdate ? (val) => {
                      const updated = { ...resume, experience: resume.experience.map((e, j) => j === i ? { ...e, title: val } : e) };
                      onUpdate(updated);
                    } : undefined}
                  />
                  <span className="text-gray-600"> — </span>
                  <EditableText
                    value={exp.company}
                    onSave={onUpdate ? (val) => {
                      const updated = { ...resume, experience: resume.experience.map((e, j) => j === i ? { ...e, company: val } : e) };
                      onUpdate(updated);
                    } : undefined}
                  />
                </div>
                <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                  {exp.startDate} – {exp.endDate}
                </span>
              </div>
              {exp.location && (
                <p className="text-xs text-gray-500 mb-1">{exp.location}</p>
              )}
              <ul className="list-disc list-outside ml-4 space-y-0.5">
                {exp.bullets.map((b, j) => (
                  <li key={j} className="text-gray-700">
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </Section>
      )}

      {/* Projects */}
      {resume.projects?.length > 0 && (
        <Section title="Projects">
          {resume.projects.map((proj, i) => (
            <ProjectCard
              key={i}
              proj={proj}
              onUrlChange={onUpdate ? (url) => {
                const updated = {
                  ...resume,
                  projects: resume.projects.map((p, j) =>
                    j === i ? { ...p, url } : p
                  ),
                };
                onUpdate(updated);
              } : undefined}
            />
          ))}
        </Section>
      )}

      {/* Education */}
      {resume.education?.length > 0 && (
        <Section title="Education">
          {resume.education.map((ed, i) => (
            <div key={i} className="flex justify-between items-baseline">
              <div>
                <span className="font-bold text-gray-900">{ed.school}</span>
                <span className="text-gray-600">
                  {" "}
                  — {ed.degree} in {ed.field}
                  {ed.gpa && ` · GPA: ${ed.gpa}`}
                </span>
              </div>
              <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                {ed.graduationDate}
              </span>
            </div>
          ))}
        </Section>
      )}
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-4">
      <h2 className="text-xs font-bold uppercase tracking-widest text-gray-800 border-b border-gray-300 pb-0.5 mb-2">
        {title}
      </h2>
      {children}
    </div>
  );
}

function SkillRow({ label, items }: { label: string; items: string[] }) {
  return (
    <p className="text-gray-700">
      <span className="font-semibold">{label}: </span>
      {items.join(", ")}
    </p>
  );
}

function EditableText({
  value,
  bold,
  onSave,
}: {
  value: string;
  bold?: boolean;
  onSave?: (val: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  if (!onSave) {
    return <span className={bold ? "font-bold text-gray-900" : "text-gray-600"}>{value}</span>;
  }

  if (editing) {
    return (
      <span className="inline-flex items-center gap-1">
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") { onSave(draft.trim()); setEditing(false); }
            if (e.key === "Escape") setEditing(false);
          }}
          className={`border border-blue-400 rounded px-1 py-0 text-sm outline-none text-gray-800 ${bold ? "font-bold" : ""}`}
          style={{ width: `${Math.max(draft.length, 10)}ch` }}
        />
        <button onClick={() => { onSave(draft.trim()); setEditing(false); }} className="text-green-600 hover:text-green-700"><Check size={12} /></button>
        <button onClick={() => setEditing(false)} className="text-gray-400 hover:text-gray-600"><X size={12} /></button>
      </span>
    );
  }

  return (
    <span
      className={`cursor-pointer hover:bg-yellow-50 rounded px-0.5 transition-colors ${bold ? "font-bold text-gray-900" : "text-gray-600"}`}
      title="Click to edit"
      onClick={() => { setDraft(value); setEditing(true); }}
    >
      {value}
    </span>
  );
}

function ProjectCard({
  proj,
  onUrlChange,
}: {
  proj: { name: string; description: string; technologies: string[]; url?: string };
  onUrlChange?: (url: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(proj.url ?? "");

  function confirm() {
    onUrlChange?.(draft.trim());
    setEditing(false);
  }

  return (
    <div className="mb-3">
      <div className="flex justify-between items-start gap-2">
        <span className="font-bold text-gray-900">{proj.name}</span>
        <div className="flex items-center gap-1 flex-shrink-0">
          {editing ? (
            <>
              <input
                autoFocus
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") confirm();
                  if (e.key === "Escape") setEditing(false);
                }}
                placeholder="https://..."
                className="text-xs border border-blue-400 rounded px-1.5 py-0.5 w-52 outline-none text-gray-800"
              />
              <button onClick={confirm} className="text-green-600 hover:text-green-700">
                <Check size={13} />
              </button>
              <button onClick={() => setEditing(false)} className="text-gray-400 hover:text-gray-600">
                <X size={13} />
              </button>
            </>
          ) : (
            <>
              {proj.url ? (
                <a
                  href={proj.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:underline"
                >
                  {proj.url}
                </a>
              ) : null}
              {onUrlChange && (
                <button
                  onClick={() => { setDraft(proj.url ?? ""); setEditing(true); }}
                  className="text-gray-400 hover:text-blue-500 transition-colors"
                  title="Edit project link"
                >
                  {proj.url ? <Pencil size={11} /> : <Link2 size={13} />}
                </button>
              )}
            </>
          )}
        </div>
      </div>
      <p className="text-gray-700 mb-0.5">{proj.description}</p>
      <p className="text-xs text-gray-500">{proj.technologies.join(" · ")}</p>
    </div>
  );
}
