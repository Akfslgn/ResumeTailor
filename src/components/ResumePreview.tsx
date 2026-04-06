"use client";
import { createContext, useContext, useState, useRef, useMemo } from "react";
import { Link2, Pencil, Check, X, Plus, Trash2, GripVertical } from "lucide-react";
import { Resume } from "@/types/resume";
import {
  ResumeSettings, DEFAULT_SETTINGS,
  fontFamilyCSS, fontSizePx, lineHeightVal, ACCENT,
} from "@/types/settings";
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface Props {
  resume: Resume;
  onUpdate?: (updated: Resume) => void;
  settings?: ResumeSettings;
}

type AccentColors = { headerBorder: string; sectionBorder: string; sectionText: string; pdfBorder: string; pdfTitle: string };
const AccentCtx = createContext<AccentColors>(ACCENT.black);

// Parse **bold** markers into React nodes
function parseMarkup(text: string | undefined | null): React.ReactNode {
  if (!text) return null;
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  if (parts.length === 1) return text;
  return parts.map((part, i) =>
    part.startsWith("**") && part.endsWith("**")
      ? <strong key={i}>{part.slice(2, -2)}</strong>
      : <span key={i}>{part}</span>
  );
}

// Wrap/unwrap selection in **...**
function applyFormat(el: HTMLInputElement | HTMLTextAreaElement, draft: string | undefined, setDraft: (v: string) => void) {
  if (!draft) return;
  const start = el.selectionStart ?? 0;
  const end = el.selectionEnd ?? 0;
  if (start === end) return;
  const sel = draft.slice(start, end);
  const toggled = sel.startsWith("**") && sel.endsWith("**")
    ? draft.slice(0, start) + sel.slice(2, -2) + draft.slice(end)
    : draft.slice(0, start) + `**${sel}**` + draft.slice(end);
  setDraft(toggled);
}

const DEFAULT_ORDER = ["summary", "skills", "experience", "projects", "education"];
const DEFAULT_TITLES: Record<string, string> = {
  summary: "Professional Summary",
  skills: "Technical Skills",
  experience: "Professional Experience",
  projects: "Projects",
  education: "Education",
};

export default function ResumePreview({ resume, onUpdate, settings = DEFAULT_SETTINGS }: Props) {
  const accent = ACCENT[settings.accentColor];
  const sectionOrder = useMemo(() => resume.sectionOrder ?? DEFAULT_ORDER, [resume.sectionOrder]);
  const sectionTitles = useMemo(() => ({ ...DEFAULT_TITLES, ...resume.sectionTitles }), [resume.sectionTitles]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function upd(partial: Partial<Resume>) {
    onUpdate?.({ ...resume, ...partial });
  }

  function setSectionTitle(key: string, title: string) {
    upd({ sectionTitles: { ...sectionTitles, [key]: title } });
  }

  function handleSectionDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = sectionOrder.indexOf(active.id as string);
    const newIndex = sectionOrder.indexOf(over.id as string);
    upd({ sectionOrder: arrayMove(sectionOrder, oldIndex, newIndex) });
  }

  function handleExpDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = Number(active.id);
    const newIndex = Number(over.id);
    upd({ experience: arrayMove(resume.experience, oldIndex, newIndex) });
  }

  function handleEduDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    upd({ education: arrayMove(resume.education, Number(active.id), Number(over.id)) });
  }

  function handleProjDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    upd({ projects: arrayMove(resume.projects, Number(active.id), Number(over.id)) });
  }

  function handleBulletDragEnd(expIdx: number, event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const newBullets = arrayMove(resume.experience[expIdx].bullets, Number(active.id), Number(over.id));
    upd({ experience: resume.experience.map((e, i) => i === expIdx ? { ...e, bullets: newBullets } : e) });
  }

  function renderSection(key: string) {
    const title = sectionTitles[key] ?? key;
    switch (key) {
      case "summary":
        return (
          <EditableSection key={key} sectionKey={key} title={title} onTitleChange={onUpdate ? (v) => setSectionTitle(key, v) : undefined} onDelete={onUpdate ? () => upd({ sectionOrder: sectionOrder.filter(s => s !== key) }) : undefined} editable={!!onUpdate}>
            <EBlock value={resume.summary} onSave={onUpdate ? (v) => upd({ summary: v }) : undefined} />
          </EditableSection>
        );
      case "skills":
        return (
          <EditableSection key={key} sectionKey={key} title={title} onTitleChange={onUpdate ? (v) => setSectionTitle(key, v) : undefined} onDelete={onUpdate ? () => upd({ sectionOrder: sectionOrder.filter(s => s !== key) }) : undefined} editable={!!onUpdate}>
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
                    onDelete={onUpdate ? () => {
                      const newSkills = { ...resume.skills };
                      delete newSkills[label];
                      upd({ skills: newSkills });
                    } : undefined}
                  />
                ) : null
              )}
            </div>
            {onUpdate && (
              <button onClick={() => upd({ skills: { ...resume.skills, ["New Category"]: ["Skill 1"] } })}
                className="text-xs text-blue-500 hover:text-blue-700 flex items-center gap-1 mt-1">
                <Plus size={11} /> Add skill category
              </button>
            )}
          </EditableSection>
        );
      case "experience":
        if (!resume.experience?.length && !onUpdate) return null;
        return (
          <EditableSection key={key} sectionKey={key} title={title} onTitleChange={onUpdate ? (v) => setSectionTitle(key, v) : undefined} onDelete={onUpdate ? () => upd({ sectionOrder: sectionOrder.filter(s => s !== key) }) : undefined} editable={!!onUpdate}>
            {onUpdate ? (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleExpDragEnd}>
                <SortableContext items={resume.experience.map((_, i) => i)} strategy={verticalListSortingStrategy}>
                  {resume.experience.map((exp, i) => (
                    <SortableExpItem key={i} id={i} exp={exp} idx={i} resume={resume} upd={upd} sensors={sensors} onBulletDragEnd={handleBulletDragEnd} />
                  ))}
                </SortableContext>
              </DndContext>
            ) : (
              resume.experience.map((exp, i) => <ExpItemView key={i} exp={exp} />)
            )}
            {onUpdate && (
              <button onClick={() => upd({ experience: [...resume.experience, { company: "Company Name", title: "Job Title", location: "City, State", startDate: "Jan 2023", endDate: "Present", bullets: ["Describe what you did"] }] })}
                className="text-xs text-blue-500 hover:text-blue-700 flex items-center gap-1 mt-1">
                <Plus size={11} /> Add experience
              </button>
            )}
          </EditableSection>
        );
      case "projects":
        if (!resume.projects?.length && !onUpdate) return null;
        return (
          <EditableSection key={key} sectionKey={key} title={title} onTitleChange={onUpdate ? (v) => setSectionTitle(key, v) : undefined} onDelete={onUpdate ? () => upd({ sectionOrder: sectionOrder.filter(s => s !== key) }) : undefined} editable={!!onUpdate}>
            {onUpdate ? (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleProjDragEnd}>
                <SortableContext items={resume.projects.map((_, i) => i)} strategy={verticalListSortingStrategy}>
                  {resume.projects.map((proj, i) => (
                    <SortableProjItem key={i} id={i} proj={proj} idx={i} resume={resume} upd={upd} />
                  ))}
                </SortableContext>
              </DndContext>
            ) : (
              resume.projects.map((proj, i) => <ProjItemView key={i} proj={proj} />)
            )}
            {onUpdate && (
              <button onClick={() => upd({ projects: [...(resume.projects || []), { name: "Project Name", description: "Project description", technologies: ["Tech 1", "Tech 2"], url: "" }] })}
                className="text-xs text-blue-500 hover:text-blue-700 flex items-center gap-1 mt-1">
                <Plus size={11} /> Add project
              </button>
            )}
          </EditableSection>
        );
      case "education":
        if (!resume.education?.length && !onUpdate) return null;
        return (
          <EditableSection key={key} sectionKey={key} title={title} onTitleChange={onUpdate ? (v) => setSectionTitle(key, v) : undefined} onDelete={onUpdate ? () => upd({ sectionOrder: sectionOrder.filter(s => s !== key) }) : undefined} editable={!!onUpdate}>
            {onUpdate ? (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleEduDragEnd}>
                <SortableContext items={resume.education.map((_, i) => i)} strategy={verticalListSortingStrategy}>
                  {resume.education.map((ed, i) => (
                    <SortableEduItem key={i} id={i} ed={ed} idx={i} resume={resume} upd={upd} />
                  ))}
                </SortableContext>
              </DndContext>
            ) : (
              resume.education.map((ed, i) => <EduItemView key={i} ed={ed} />)
            )}
            {onUpdate && (
              <button onClick={() => upd({ education: [...(resume.education || []), { school: "University Name", degree: "Bachelor of Science", field: "Your Field", graduationDate: "May 2022" }] })}
                className="text-xs text-blue-500 hover:text-blue-700 flex items-center gap-1 mt-1">
                <Plus size={11} /> Add education
              </button>
            )}
          </EditableSection>
        );
      default: {
        // Custom section
        const custom = resume.customSections?.[key];
        if (!custom && !onUpdate) return null;
        const items = custom?.items ?? [];
        return (
          <EditableSection key={key} sectionKey={key} title={title} onTitleChange={onUpdate ? (v) => setSectionTitle(key, v) : undefined} onDelete={onUpdate ? () => {
            const newCustom = { ...resume.customSections };
            delete newCustom[key];
            upd({ sectionOrder: sectionOrder.filter(s => s !== key), customSections: newCustom });
          } : undefined} editable={!!onUpdate}>
            {items.map((item, i) => (
              <div key={i} className="flex items-start gap-1 group/citem">
                {onUpdate && (
                  <button onClick={() => {
                    const newItems = items.filter((_, j) => j !== i);
                    upd({ customSections: { ...resume.customSections, [key]: { ...custom!, items: newItems } } });
                  }} className="opacity-0 group-hover/citem:opacity-100 text-red-400 hover:text-red-600 mt-0.5 flex-shrink-0">
                    <Trash2 size={11} />
                  </button>
                )}
                <span className="text-gray-400 mt-0.5 flex-shrink-0">•</span>
                <E value={item} onSave={onUpdate ? (v) => {
                  const newItems = [...items];
                  newItems[i] = v;
                  upd({ customSections: { ...resume.customSections, [key]: { ...custom!, items: newItems } } });
                } : undefined} />
              </div>
            ))}
            {onUpdate && (
              <button onClick={() => upd({ customSections: { ...resume.customSections, [key]: { title: title, items: [...items, "New item"] } } })}
                className="text-xs text-blue-500 hover:text-blue-700 flex items-center gap-1 mt-1">
                <Plus size={11} /> Add item
              </button>
            )}
          </EditableSection>
        );
      }
    }
  }

  return (
    <AccentCtx.Provider value={accent}>
      <div
        id="resume-preview"
        className="bg-white text-gray-900 p-4 sm:p-8 max-w-[800px] mx-auto shadow-lg"
        style={{
          fontFamily: fontFamilyCSS(settings.fontStyle),
          fontSize: fontSizePx(settings.fontSize),
          lineHeight: lineHeightVal(settings.lineHeight),
        }}
      >
        {/* Header */}
        <div className="text-center pb-4 mb-4 border-b-2" style={{ borderColor: accent.headerBorder }}>
          <h1 className="text-3xl font-bold tracking-wide uppercase text-gray-900">
            <E value={resume.name} bold onSave={onUpdate ? (v) => upd({ name: v }) : undefined} />
          </h1>
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-4 text-xs text-gray-600">
            {resume.email && <E value={resume.email} onSave={onUpdate ? (v) => upd({ email: v }) : undefined} onDelete={onUpdate ? () => upd({ email: "" }) : undefined} />}
            {resume.phone && <E value={resume.phone} onSave={onUpdate ? (v) => upd({ phone: v }) : undefined} onDelete={onUpdate ? () => upd({ phone: "" }) : undefined} />}
            {resume.location && <E value={resume.location} onSave={onUpdate ? (v) => upd({ location: v }) : undefined} onDelete={onUpdate ? () => upd({ location: "" }) : undefined} />}
            {resume.linkedin && <E value={resume.linkedin} onSave={onUpdate ? (v) => upd({ linkedin: v }) : undefined} onDelete={onUpdate ? () => upd({ linkedin: "" }) : undefined} />}
            {resume.github && <E value={resume.github} onSave={onUpdate ? (v) => upd({ github: v }) : undefined} onDelete={onUpdate ? () => upd({ github: "" }) : undefined} />}
            {resume.website && <E value={resume.website} onSave={onUpdate ? (v) => upd({ website: v }) : undefined} onDelete={onUpdate ? () => upd({ website: "" }) : undefined} />}
            {(resume.extraContact ?? []).map((c, i) => (
              <E key={i} value={c} onSave={onUpdate ? (v) => {
                const arr = [...(resume.extraContact ?? [])];
                arr[i] = v;
                upd({ extraContact: arr });
              } : undefined} onDelete={onUpdate ? () => upd({ extraContact: (resume.extraContact ?? []).filter((_, j) => j !== i) }) : undefined} />
            ))}
            {onUpdate && <AddContactButton resume={resume} upd={upd} />}
          </div>
        </div>

        {/* Sections — sortable */}
        {onUpdate ? (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleSectionDragEnd}>
            <SortableContext items={sectionOrder} strategy={verticalListSortingStrategy}>
              {sectionOrder.map((key) => (
                <SortableSectionWrapper key={key} id={key}>
                  {renderSection(key)}
                </SortableSectionWrapper>
              ))}
            </SortableContext>
          </DndContext>
        ) : (
          sectionOrder.map((key) => renderSection(key))
        )}

        {/* Add section button */}
        {onUpdate && (
          <div className="mt-2 flex items-center gap-2">
            <AddSectionButton
              currentOrder={sectionOrder}
              onAdd={(key) => upd({ sectionOrder: [...sectionOrder, key] })}
              onAddCustom={(name) => {
                const key = `custom_${Date.now()}`;
                upd({
                  sectionOrder: [...sectionOrder, key],
                  sectionTitles: { ...sectionTitles, [key]: name },
                  customSections: { ...resume.customSections, [key]: { title: name, items: ["New item"] } },
                });
              }}
            />
          </div>
        )}
      </div>
    </AccentCtx.Provider>
  );
}

/* ── Sortable section wrapper ── */
function SortableSectionWrapper({ id, children }: { id: string; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
  return (
    <div ref={setNodeRef} style={style} className="relative group/section">
      <div {...attributes} {...listeners} className="absolute -left-6 top-0 opacity-0 group-hover/section:opacity-100 cursor-grab text-gray-300 hover:text-gray-500 transition-opacity" title="Drag to reorder">
        <GripVertical size={14} />
      </div>
      {children}
    </div>
  );
}

/* ── Section with editable title ── */
function EditableSection({ sectionKey, title, children, onTitleChange, onDelete, editable }: {
  sectionKey: string; title: string; children: React.ReactNode;
  onTitleChange?: (v: string) => void; onDelete?: () => void; editable: boolean;
}) {
  const c = useContext(AccentCtx);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(title);

  return (
    <div className="mb-4">
      <div className="flex items-center gap-1 border-b pb-0.5 mb-2" style={{ borderColor: c.sectionBorder }}>
        {editing && onTitleChange ? (
          <span className="inline-flex items-center gap-1">
            <input autoFocus value={draft} onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { onTitleChange(draft.trim()); setEditing(false); } if (e.key === "Escape") setEditing(false); }}
              className="text-xs font-bold uppercase tracking-widest border border-blue-400 rounded px-1 py-0 outline-none" style={{ color: c.sectionText }} />
            <button onClick={() => { onTitleChange(draft.trim()); setEditing(false); }} className="text-green-600 hover:text-green-700"><Check size={11} /></button>
            <button onClick={() => setEditing(false)} className="text-gray-400 hover:text-gray-600"><X size={11} /></button>
          </span>
        ) : (
          <h2 className={`text-xs font-bold uppercase tracking-widest flex-1 ${editable ? "cursor-pointer hover:bg-yellow-50 rounded px-0.5 transition-colors" : ""}`}
            style={{ color: c.sectionText }}
            onClick={onTitleChange ? () => { setDraft(title); setEditing(true); } : undefined}>
            {title}
          </h2>
        )}
        {onDelete && !editing && (
          <button onClick={onDelete} className="opacity-0 group-hover/section:opacity-100 text-red-400 hover:text-red-600 transition-opacity" title="Remove section">
            <Trash2 size={11} />
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

/* ── Add contact info button ── */
const CONTACT_FIELDS: { key: keyof Resume; label: string; placeholder: string }[] = [
  { key: "email", label: "Email", placeholder: "email@example.com" },
  { key: "phone", label: "Phone", placeholder: "+1 (555) 123-4567" },
  { key: "location", label: "Location", placeholder: "City, State" },
  { key: "linkedin", label: "LinkedIn", placeholder: "linkedin.com/in/yourname" },
  { key: "github", label: "GitHub", placeholder: "github.com/yourname" },
  { key: "website", label: "Website", placeholder: "yourwebsite.com" },
];

function AddContactButton({ resume, upd }: { resume: Resume; upd: (p: Partial<Resume>) => void }) {
  const [open, setOpen] = useState(false);
  const [customVal, setCustomVal] = useState("");
  const missing = CONTACT_FIELDS.filter(f => !resume[f.key]);
  return (
    <span className="relative inline-block">
      <button onClick={() => setOpen(!open)} className="text-blue-500 hover:text-blue-700 flex items-center gap-0.5" title="Add contact info">
        <Plus size={11} />
      </button>
      {open && (
        <div className="absolute top-full mt-1 left-1/2 -translate-x-1/2 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10 min-w-[180px] text-left">
          {missing.map(f => (
            <button key={f.key} onClick={() => { upd({ [f.key]: f.placeholder }); setOpen(false); }}
              className="block w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-blue-50 whitespace-nowrap">
              {f.label}
            </button>
          ))}
          <div className="border-t border-gray-100 mt-1 pt-1 px-2 pb-1">
            <form onSubmit={(e) => { e.preventDefault(); if (customVal.trim()) { upd({ extraContact: [...(resume.extraContact ?? []), customVal.trim()] }); setCustomVal(""); setOpen(false); } }} className="flex gap-1">
              <input type="text" placeholder="Custom field..." value={customVal} onChange={(e) => setCustomVal(e.target.value)}
                className="flex-1 text-xs border border-gray-200 rounded px-2 py-1 outline-none focus:border-blue-400" autoFocus />
              <button type="submit" className="text-xs text-white bg-blue-500 hover:bg-blue-600 rounded px-2 py-1">Add</button>
            </form>
          </div>
        </div>
      )}
    </span>
  );
}

/* ── Add section button ── */
function AddSectionButton({ currentOrder, onAdd, onAddCustom }: { currentOrder: string[]; onAdd: (key: string) => void; onAddCustom: (name: string) => void }) {
  const missing = DEFAULT_ORDER.filter(k => !currentOrder.includes(k));
  const [open, setOpen] = useState(false);
  const [customName, setCustomName] = useState("");
  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="text-xs text-blue-500 hover:text-blue-700 flex items-center gap-1">
        <Plus size={11} /> Add section
      </button>
      {open && (
        <div className="absolute bottom-full mb-1 left-0 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10 min-w-[200px]">
          {missing.map(key => (
            <button key={key} onClick={() => { onAdd(key); setOpen(false); }}
              className="block w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-blue-50 whitespace-nowrap">
              {DEFAULT_TITLES[key] ?? key}
            </button>
          ))}
          <div className="border-t border-gray-100 mt-1 pt-1 px-2 pb-1">
            <form onSubmit={(e) => { e.preventDefault(); if (customName.trim()) { onAddCustom(customName.trim()); setCustomName(""); setOpen(false); } }} className="flex gap-1">
              <input
                type="text" placeholder="Custom section name..."
                value={customName} onChange={(e) => setCustomName(e.target.value)}
                className="flex-1 text-xs border border-gray-200 rounded px-2 py-1 outline-none focus:border-blue-400"
                autoFocus
              />
              <button type="submit" className="text-xs text-white bg-blue-500 hover:bg-blue-600 rounded px-2 py-1">
                Add
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Sortable experience item ── */
function SortableExpItem({ id, exp, idx, resume, upd, sensors, onBulletDragEnd }: {
  id: number; exp: Resume["experience"][0]; idx: number;
  resume: Resume; upd: (p: Partial<Resume>) => void;
  sensors: ReturnType<typeof useSensors>; onBulletDragEnd: (expIdx: number, event: DragEndEvent) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
  return (
    <div ref={setNodeRef} style={style} className="mb-4 relative group/exp">
      <div className="flex justify-between items-start gap-2">
        <div className="flex items-start gap-1">
          <div {...attributes} {...listeners} className="opacity-0 group-hover/exp:opacity-100 cursor-grab text-gray-300 hover:text-gray-500 transition-opacity mt-0.5 flex-shrink-0">
            <GripVertical size={12} />
          </div>
          <div className="flex flex-wrap items-baseline gap-x-1">
            <E value={exp.title} bold onSave={(v) => upd({ experience: resume.experience.map((e, j) => j === idx ? { ...e, title: v } : e) })} />
            <span className="text-gray-500"> — </span>
            <E value={exp.company} onSave={(v) => upd({ experience: resume.experience.map((e, j) => j === idx ? { ...e, company: v } : e) })} />
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <div className="text-xs text-gray-500 whitespace-nowrap flex items-center gap-1">
            <E value={exp.startDate} small onSave={(v) => upd({ experience: resume.experience.map((e, j) => j === idx ? { ...e, startDate: v } : e) })} />
            <span>–</span>
            <E value={exp.endDate} small onSave={(v) => upd({ experience: resume.experience.map((e, j) => j === idx ? { ...e, endDate: v } : e) })} />
          </div>
          <button onClick={() => upd({ experience: resume.experience.filter((_, j) => j !== idx) })}
            className="opacity-0 group-hover/exp:opacity-100 text-red-400 hover:text-red-600 transition-opacity flex-shrink-0" title="Remove">
            <Trash2 size={12} />
          </button>
        </div>
      </div>
      {exp.location && (
        <div className="mt-0.5 ml-4">
          <E value={exp.location} small muted onSave={(v) => upd({ experience: resume.experience.map((e, j) => j === idx ? { ...e, location: v } : e) })} />
        </div>
      )}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => onBulletDragEnd(idx, e)}>
        <SortableContext items={exp.bullets.map((_, j) => j)} strategy={verticalListSortingStrategy}>
          <ul className="list-disc list-outside ml-4 space-y-0.5 mt-1">
            {exp.bullets.map((b, j) => (
              <SortableBullet key={j} id={j} value={b}
                onSave={(v) => { const bullets = exp.bullets.map((x, k) => k === j ? v : x); upd({ experience: resume.experience.map((e, k) => k === idx ? { ...e, bullets } : e) }); }}
                onDelete={() => { const bullets = exp.bullets.filter((_, k) => k !== j); upd({ experience: resume.experience.map((e, k) => k === idx ? { ...e, bullets } : e) }); }}
              />
            ))}
            <li className="list-none ml-[-1rem]">
              <button onClick={() => { const bullets = [...exp.bullets, "New bullet point"]; upd({ experience: resume.experience.map((e, k) => k === idx ? { ...e, bullets } : e) }); }}
                className="text-xs text-blue-500 hover:text-blue-700 flex items-center gap-1 mt-0.5">
                <Plus size={11} /> Add bullet
              </button>
            </li>
          </ul>
        </SortableContext>
      </DndContext>
    </div>
  );
}

/* ── Static experience view (no editing) ── */
function ExpItemView({ exp }: { exp: Resume["experience"][0] }) {
  return (
    <div className="mb-4">
      <div className="flex justify-between items-start gap-2">
        <div className="flex flex-wrap items-baseline gap-x-1">
          <span className="font-bold text-gray-900">{parseMarkup(exp.title)}</span>
          <span className="text-gray-500"> — </span>
          <span className="text-gray-700">{parseMarkup(exp.company)}</span>
        </div>
        <div className="text-xs text-gray-500 whitespace-nowrap">{exp.startDate} – {exp.endDate}</div>
      </div>
      {exp.location && <div className="text-xs text-gray-500 mt-0.5">{exp.location}</div>}
      <ul className="list-disc list-outside ml-4 space-y-0.5 mt-1">
        {exp.bullets.map((b, j) => <li key={j} className="text-gray-700">{parseMarkup(b)}</li>)}
      </ul>
    </div>
  );
}

/* ── Sortable bullet ── */
function SortableBullet({ id, value, onSave, onDelete }: { id: number; value: string; onSave: (v: string) => void; onDelete: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
  return (
    <li ref={setNodeRef} style={style} className="text-gray-700 group/bullet flex items-start gap-0.5">
      <span {...attributes} {...listeners} className="opacity-0 group-hover/bullet:opacity-100 cursor-grab text-gray-300 hover:text-gray-500 transition-opacity mt-0.5 flex-shrink-0">
        <GripVertical size={10} />
      </span>
      <span className="flex-1"><E value={value} wide onSave={onSave} onDelete={onDelete} /></span>
    </li>
  );
}

/* ── Sortable project item ── */
function SortableProjItem({ id, proj, idx, resume, upd }: {
  id: number; proj: Resume["projects"][0]; idx: number;
  resume: Resume; upd: (p: Partial<Resume>) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
  return (
    <div ref={setNodeRef} style={style} className="mb-3 relative group/proj">
      <div className="flex justify-between items-start gap-2">
        <div className="flex items-start gap-1">
          <div {...attributes} {...listeners} className="opacity-0 group-hover/proj:opacity-100 cursor-grab text-gray-300 hover:text-gray-500 transition-opacity mt-0.5 flex-shrink-0">
            <GripVertical size={12} />
          </div>
          <E value={proj.name} bold onSave={(v) => upd({ projects: resume.projects.map((p, j) => j === idx ? { ...p, name: v } : p) })} />
        </div>
        <div className="flex items-center gap-1.5">
          <ProjectUrlEditor url={proj.url} onSave={(url) => upd({ projects: resume.projects.map((p, j) => j === idx ? { ...p, url } : p) })} />
          <button onClick={() => upd({ projects: resume.projects.filter((_, j) => j !== idx) })}
            className="opacity-0 group-hover/proj:opacity-100 text-red-400 hover:text-red-600 transition-opacity flex-shrink-0" title="Remove">
            <Trash2 size={12} />
          </button>
        </div>
      </div>
      <EBlock value={proj.description} onSave={(v) => upd({ projects: resume.projects.map((p, j) => j === idx ? { ...p, description: v } : p) })} />
      <E value={proj.technologies.join(", ")} small muted onSave={(v) => upd({ projects: resume.projects.map((p, j) => j === idx ? { ...p, technologies: v.split(",").map((t) => t.trim()).filter(Boolean) } : p) })} />
    </div>
  );
}

/* ── Static project view ── */
function ProjItemView({ proj }: { proj: Resume["projects"][0] }) {
  return (
    <div className="mb-3">
      <div className="flex justify-between items-start gap-2">
        <span className="font-bold text-gray-900">{parseMarkup(proj.name)}</span>
        {proj.url && <a href={proj.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">{proj.url}</a>}
      </div>
      <p className="text-gray-700">{parseMarkup(proj.description)}</p>
      <span className="text-xs text-gray-500">{proj.technologies.join(", ")}</span>
    </div>
  );
}

/* ── Sortable education item ── */
function SortableEduItem({ id, ed, idx, resume, upd }: {
  id: number; ed: Resume["education"][0]; idx: number;
  resume: Resume; upd: (p: Partial<Resume>) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
  return (
    <div ref={setNodeRef} style={style} className="flex flex-wrap justify-between items-baseline mb-1 gap-x-1 relative group/edu">
      <div className="flex items-baseline gap-1">
        <div {...attributes} {...listeners} className="opacity-0 group-hover/edu:opacity-100 cursor-grab text-gray-300 hover:text-gray-500 transition-opacity flex-shrink-0">
          <GripVertical size={12} />
        </div>
        <div className="flex flex-wrap items-baseline gap-x-1">
          <E value={ed.school} bold onSave={(v) => upd({ education: resume.education.map((e, j) => j === idx ? { ...e, school: v } : e) })} />
          <span className="text-gray-500"> — </span>
          <E value={ed.degree} onSave={(v) => upd({ education: resume.education.map((e, j) => j === idx ? { ...e, degree: v } : e) })} />
          <span className="text-gray-500"> in </span>
          <E value={ed.field} onSave={(v) => upd({ education: resume.education.map((e, j) => j === idx ? { ...e, field: v } : e) })} />
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        <E value={ed.graduationDate} small muted onSave={(v) => upd({ education: resume.education.map((e, j) => j === idx ? { ...e, graduationDate: v } : e) })} />
        <button onClick={() => upd({ education: resume.education.filter((_, j) => j !== idx) })}
          className="opacity-0 group-hover/edu:opacity-100 text-red-400 hover:text-red-600 transition-opacity flex-shrink-0" title="Remove">
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );
}

/* ── Static education view ── */
function EduItemView({ ed }: { ed: Resume["education"][0] }) {
  return (
    <div className="flex flex-wrap justify-between items-baseline mb-1 gap-x-1">
      <div className="flex flex-wrap items-baseline gap-x-1">
        <span className="font-bold text-gray-900">{ed.school}</span>
        <span className="text-gray-500"> — </span>
        <span className="text-gray-700">{ed.degree}</span>
        <span className="text-gray-500"> in </span>
        <span className="text-gray-700">{ed.field}</span>
      </div>
      <span className="text-xs text-gray-500">{ed.graduationDate}</span>
    </div>
  );
}

/* ── Section with accent colors from context (static, used for non-edit mode) ── */
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
function EditableSkillRow({ label, items, onSave, onDelete }: {
  label: string; items: string[]; onSave?: (label: string, items: string[]) => void; onDelete?: () => void;
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
        {onDelete && <button onClick={onDelete} className="text-red-400 hover:text-red-600"><Trash2 size={12} /></button>}
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
