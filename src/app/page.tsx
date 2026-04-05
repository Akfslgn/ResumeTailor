"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import { Toaster, toast } from "react-hot-toast";
import {
  Sparkles,
  FileText,
  RotateCcw,
  ClipboardPaste,
  UploadCloud,
  X,
  FileCheck,
  Settings,
} from "lucide-react";
import ResumePreview from "@/components/ResumePreview";
import ResumeChatPanel from "@/components/ResumeChatPanel";
import SettingsPanel from "@/components/SettingsPanel";
import { Resume } from "@/types/resume";
import { ResumeSettings, DEFAULT_SETTINGS } from "@/types/settings";
import { EXAMPLE_RESUME, EXAMPLE_JOB_DESCRIPTION } from "@/data/exampleData";

const PDFExport = dynamic(() => import("@/components/PDFExport"), {
  ssr: false,
  loading: () => (
    <button className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium opacity-60 cursor-not-allowed">
      Loading...
    </button>
  ),
});

type Tab = "original" | "tailored";

export default function Home() {
  const [resumeText, setResumeText] = useState(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("rt_resumeText") ?? "";
  });
  const [jobDescription, setJobDescription] = useState(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("rt_jobDescription") ?? "";
  });
  const [originalResume, setOriginalResume] = useState<Resume | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      return JSON.parse(localStorage.getItem("rt_original") ?? "null");
    } catch {
      return null;
    }
  });
  const [tailoredResume, setTailoredResume] = useState<Resume | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      return JSON.parse(localStorage.getItem("rt_tailored") ?? "null");
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>(() => {
    if (typeof window === "undefined") return "original";
    return (localStorage.getItem("rt_activeTab") as Tab) ?? "original";
  });
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(
    () => {
      if (typeof window === "undefined") return null;
      return localStorage.getItem("rt_fileName") ?? null;
    },
  );
  const [parsing, setParsing] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<ResumeSettings>(() => {
    if (typeof window === "undefined") return DEFAULT_SETTINGS;
    try {
      const stored = localStorage.getItem("rt_settings");
      if (stored) return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
      // migrate old rt_font key
      const oldFont = localStorage.getItem("rt_font") as ResumeSettings["fontStyle"] | null;
      if (oldFont) return { ...DEFAULT_SETTINGS, fontStyle: oldFont };
    } catch {}
    return DEFAULT_SETTINGS;
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Persist to localStorage on change
  useEffect(() => {
    localStorage.setItem("rt_resumeText", resumeText);
  }, [resumeText]);
  useEffect(() => {
    localStorage.setItem("rt_jobDescription", jobDescription);
  }, [jobDescription]);
  useEffect(() => {
    localStorage.setItem("rt_original", JSON.stringify(originalResume));
  }, [originalResume]);
  useEffect(() => {
    localStorage.setItem("rt_tailored", JSON.stringify(tailoredResume));
  }, [tailoredResume]);
  useEffect(() => {
    localStorage.setItem("rt_activeTab", activeTab);
  }, [activeTab]);
  useEffect(() => {
    localStorage.setItem("rt_fileName", uploadedFileName ?? "");
  }, [uploadedFileName]);
  useEffect(() => {
    localStorage.setItem("rt_settings", JSON.stringify(settings));
  }, [settings]);

  const displayedResume =
    activeTab === "tailored" && tailoredResume
      ? tailoredResume
      : (originalResume ?? null);

  async function handleTailor() {
    if (resumeText.trim().length < 50) {
      toast.error("Please paste your resume text (at least 50 characters).");
      return;
    }
    if (jobDescription.trim().length < 20) {
      toast.error("Please paste a job description.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/tailor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText, jobDescription }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong.");

      setOriginalResume(data.original);
      setTailoredResume(data.tailored);
      setActiveTab("tailored");
      toast.success("Resume tailored successfully!");
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Failed to tailor resume.",
      );
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setResumeText("");
    setJobDescription("");
    setOriginalResume(null);
    setTailoredResume(null);
    setActiveTab("original");
    setUploadedFileName(null);
    localStorage.removeItem("rt_resumeText");
    localStorage.removeItem("rt_jobDescription");
    localStorage.removeItem("rt_original");
    localStorage.removeItem("rt_tailored");
    localStorage.removeItem("rt_activeTab");
    localStorage.removeItem("rt_fileName");
  }

  const handleFile = useCallback(async (file: File) => {
    const allowed = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
      "text/plain",
    ];
    if (!allowed.includes(file.type)) {
      toast.error("Unsupported file. Please upload PDF, DOCX, DOC, or TXT.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File too large. Maximum size is 5 MB.");
      return;
    }
    setParsing(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/parse-resume", {
        method: "POST",
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to parse file.");
      setResumeText(data.text);
      setUploadedFileName(file.name);
      toast.success(`"${file.name}" loaded successfully.`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to read file.");
    } finally {
      setParsing(false);
    }
  }, []);

  const hasResult = originalResume !== null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white flex flex-col">
      <Toaster position="top-right" />

      {/* Header */}
      <header className="flex-shrink-0 border-b border-slate-700 px-6 py-4 flex items-center gap-3">
        <FileText className="text-blue-400" size={22} />
        <span className="text-lg font-bold tracking-tight">ResumeTailor</span>
        <span className="ml-2 text-xs bg-blue-600/30 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-full">
          GPT-4o
        </span>
        {hasResult && (
          <button
            onClick={handleReset}
            className="ml-auto flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
          >
            <RotateCcw size={12} />
            Start Over
          </button>
        )}
      </header>

      {/* Main */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left — Inputs */}
        <div className="w-[420px] flex-shrink-0 flex flex-col border-r border-slate-700 bg-slate-900/60 overflow-y-auto">
          <div className="flex flex-col gap-0 p-5">
            {/* Resume Input */}
            <div className="flex flex-col">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-semibold text-slate-200">
                  Your Resume
                </label>
                <button
                  onClick={() => {
                    setResumeText(EXAMPLE_RESUME);
                    setUploadedFileName(null);
                  }}
                  className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                >
                  <ClipboardPaste size={11} />
                  Load Example
                </button>
              </div>

              {/* Drop Zone */}
              <div
                className={`relative flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-lg px-4 py-4 mb-3 cursor-pointer transition-colors ${
                  dragging
                    ? "border-blue-400 bg-blue-500/10"
                    : "border-slate-600 hover:border-slate-400 bg-slate-800/50"
                }`}
                onClick={() => !parsing && fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragging(false);
                  const file = e.dataTransfer.files[0];
                  if (file) handleFile(file);
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.doc,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword,text/plain"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFile(f);
                    e.target.value = "";
                  }}
                />
                {parsing ? (
                  <>
                    <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-400" />
                    <span className="text-xs text-slate-400">
                      Reading file...
                    </span>
                  </>
                ) : uploadedFileName ? (
                  <>
                    <FileCheck size={18} className="text-green-400" />
                    <span className="text-xs text-slate-300 font-medium truncate max-w-full">
                      {uploadedFileName}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setUploadedFileName(null);
                        setResumeText("");
                      }}
                      className="absolute top-2 right-2 text-slate-500 hover:text-slate-300"
                    >
                      <X size={13} />
                    </button>
                  </>
                ) : (
                  <>
                    <UploadCloud size={20} className="text-slate-400" />
                    <div className="text-center">
                      <p className="text-xs font-medium text-slate-300">
                        Drop your resume here
                      </p>
                      <p className="text-xs text-slate-500">
                        PDF, DOCX, DOC, TXT — max 5 MB
                      </p>
                    </div>
                  </>
                )}
              </div>

              {hasResult ? (
                <div className="flex flex-col">
                  <div className="h-px bg-slate-700 mb-3" />
                  <ResumeChatPanel
                    resume={tailoredResume}
                    onResumeUpdate={(updated) => {
                      setTailoredResume(updated);
                      if (!originalResume) setOriginalResume(updated);
                      setActiveTab("tailored");
                    }}
                  />
                </div>
              ) : (
                <>
                  <div className="h-px bg-slate-700 my-3" />
                  <div className="flex flex-col">
                    <ResumeChatPanel
                      resume={null}
                      onResumeUpdate={(created) => {
                        setOriginalResume(created);
                        setTailoredResume(created);
                        setActiveTab("tailored");
                      }}
                    />
                  </div>
                  <div className="h-px bg-slate-700 my-3" />
                  <p className="text-xs text-slate-500 mb-1.5">
                    Or paste / type your resume below:
                  </p>
                  <textarea
                    className="h-28 w-full bg-slate-800 border border-slate-600 rounded-lg p-3.5 text-xs text-slate-200 placeholder-slate-500 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-mono leading-relaxed"
                    placeholder={
                      "John Doe\njohn@email.com | +1 555 000 0000 | New York, NY\n\nSUMMARY\nExperienced developer with...\n\nSKILLS\nLanguages: Python, JavaScript...\n\nEXPERIENCE\nSoftware Engineer — Acme Corp\nJan 2021 – Present\n• Built and maintained..."
                    }
                    value={resumeText}
                    onChange={(e) => {
                      setResumeText(e.target.value);
                      if (!e.target.value) setUploadedFileName(null);
                    }}
                  />
                  {resumeText.length > 0 && (
                    <p className="text-xs text-slate-600 mt-1 text-right">
                      {resumeText.trim().split(/\s+/).length} words
                    </p>
                  )}
                </>
              )}
            </div>

            <div className="h-px bg-slate-700 my-4" />

            {/* Job Description Input */}
            <div className="flex flex-col">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-semibold text-slate-200">
                  Job Description
                </label>
                <div className="flex items-center gap-2">
                  {jobDescription.length > 0 && (
                    <button
                      onClick={() => setJobDescription("")}
                      className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 transition-colors"
                    >
                      <X size={11} />
                      Clear
                    </button>
                  )}
                  <button
                    onClick={() => setJobDescription(EXAMPLE_JOB_DESCRIPTION)}
                    className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    <ClipboardPaste size={11} />
                    Load Example
                  </button>
                </div>
              </div>
              <p className="text-xs text-slate-500 mb-2">
                Paste the full job posting from LinkedIn, company website, etc.
              </p>
              <textarea
                className="h-52 w-full bg-slate-800 border border-slate-600 rounded-lg p-3.5 text-xs text-slate-200 placeholder-slate-500 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all leading-relaxed"
                placeholder={
                  "Senior Frontend Developer — Acme Corp\n\nWe are looking for a passionate developer to join our team.\n\nResponsibilities:\n• Build and maintain React applications\n• Collaborate with designers...\n\nRequirements:\n• 4+ years React experience\n• TypeScript proficiency..."
                }
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
              />
              {jobDescription.length > 0 && (
                <p className="text-xs text-slate-600 mt-1 text-right">
                  {jobDescription.trim().split(/\s+/).length} words
                </p>
              )}
            </div>

            {/* Tailor Button */}
            <button
              onClick={handleTailor}
              disabled={loading}
              className="mt-4 w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-60 disabled:cursor-not-allowed text-white px-5 py-3 rounded-lg font-semibold text-sm transition-colors"
            >
              {loading ? (
                <>
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  Analyzing &amp; Tailoring...
                </>
              ) : (
                <>
                  <Sparkles size={15} />
                  Tailor Resume with AI
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right — Preview */}
        <div className="flex-1 flex flex-col bg-slate-100 overflow-hidden">
          {/* Toolbar */}
          <div className="flex-shrink-0 bg-slate-200 border-b border-slate-300 px-5 py-2.5 flex items-center justify-between gap-4">
            <div className="flex gap-1 bg-slate-300 rounded-lg p-1">
              <TabBtn
                label="Original"
                active={activeTab === "original"}
                disabled={!hasResult}
                onClick={() => hasResult && setActiveTab("original")}
              />
              <TabBtn
                label="✨ Tailored"
                active={activeTab === "tailored"}
                disabled={!tailoredResume}
                onClick={() => tailoredResume && setActiveTab("tailored")}
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowSettings(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-slate-300 hover:bg-slate-400 text-slate-700 rounded-lg transition-colors font-medium"
              >
                <Settings size={13} /> Appearance
              </button>
              {displayedResume && <PDFExport resume={displayedResume} settings={settings} />}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto p-6">
            {!hasResult ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-5">
                <div className="w-16 h-16 rounded-2xl bg-slate-300 flex items-center justify-center">
                  <Sparkles size={28} className="text-slate-400" />
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold text-slate-600 mb-1">
                    Your tailored resume will appear here
                  </p>
                  <p className="text-sm text-slate-400 max-w-sm">
                    Paste your resume and a job description on the left, then
                    click <strong>&quot;Tailor Resume&quot;</strong>.
                  </p>
                </div>
                <div className="flex flex-col gap-2 text-xs text-slate-400 bg-slate-200 rounded-xl px-5 py-4 max-w-xs">
                  <Step n={1} text="Paste your resume text" />
                  <Step n={2} text="Paste the job description" />
                  <Step n={3} text="Click Tailor Resume with AI" />
                  <Step n={4} text="Download as PDF" />
                </div>
              </div>
            ) : (
              displayedResume && (
                <ResumePreview
                  resume={displayedResume}
                  settings={settings}
                  onUpdate={(updated) => {
                    if (activeTab === "tailored") {
                      setTailoredResume(updated);
                    } else {
                      setOriginalResume(updated);
                    }
                  }}
                />
              )
            )}
          </div>
        </div>
      </div>
      {showSettings && (
        <SettingsPanel
          settings={settings}
          onChange={setSettings}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}

function TabBtn({
  label,
  active,
  disabled,
  onClick,
}: {
  label: string;
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
        active
          ? "bg-white text-slate-900 shadow-sm"
          : disabled
            ? "text-slate-400 cursor-not-allowed"
            : "text-slate-600 hover:text-slate-900"
      }`}
    >
      {label}
    </button>
  );
}

function Step({ n, text }: { n: number; text: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-500 text-xs font-bold flex items-center justify-center flex-shrink-0">
        {n}
      </span>
      <span>{text}</span>
    </div>
  );
}
