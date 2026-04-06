"use client";
import { Settings, X } from "lucide-react";
import { ResumeSettings } from "@/types/settings";

interface Props {
  settings: ResumeSettings;
  onChange: (s: ResumeSettings) => void;
  onClose: () => void;
}

export default function SettingsPanel({ settings, onChange, onClose }: Props) {
  function set<K extends keyof ResumeSettings>(key: K, val: ResumeSettings[K]) {
    onChange({ ...settings, [key]: val });
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div
        className="w-72 h-full bg-white shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-2 text-gray-800 font-semibold text-sm">
            <Settings size={15} /> Appearance
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-7">
          {/* Font Family */}
          <SettingSection label="Font Family">
            <ToggleGroup
              options={[
                { value: "serif", label: "Serif", style: { fontFamily: "Georgia, serif" } },
                { value: "sans",  label: "Sans",  style: { fontFamily: "Arial, sans-serif" } },
                { value: "mono",  label: "Mono",  style: { fontFamily: "'Courier New', monospace" } },
              ]}
              value={settings.fontStyle}
              onChange={(v) => set("fontStyle", v as ResumeSettings["fontStyle"])}
            />
            <p className="text-xs text-gray-400 mt-1.5">
              {settings.fontStyle === "serif" ? "Georgia / Times New Roman — classic, formal" : ""}
              {settings.fontStyle === "sans"  ? "Arial / Helvetica — clean, modern" : ""}
              {settings.fontStyle === "mono"  ? "Courier New — technical, distinct" : ""}
            </p>
          </SettingSection>

          {/* Font Size */}
          <SettingSection label="Font Size">
            <ToggleGroup
              options={[
                { value: "sm", label: "Small"  },
                { value: "md", label: "Medium" },
                { value: "lg", label: "Large"  },
              ]}
              value={settings.fontSize}
              onChange={(v) => set("fontSize", v as ResumeSettings["fontSize"])}
            />
          </SettingSection>

          {/* Line Spacing */}
          <SettingSection label="Line Spacing">
            <ToggleGroup
              options={[
                { value: "tight",   label: "Compact" },
                { value: "normal",  label: "Normal"  },
                { value: "relaxed", label: "Relaxed" },
              ]}
              value={settings.lineHeight}
              onChange={(v) => set("lineHeight", v as ResumeSettings["lineHeight"])}
            />
          </SettingSection>

          {/* Accent Color */}
          <SettingSection label="Accent Color">
            <div className="grid grid-cols-4 gap-2">
              {(
                [
                  { value: "black",  color: "#111111", label: "Black"  },
                  { value: "navy",   color: "#1e3a8a", label: "Navy"   },
                  { value: "slate",  color: "#475569", label: "Slate"  },
                  { value: "forest", color: "#166534", label: "Forest" },
                ] as const
              ).map(({ value, color, label }) => (
                <button
                  key={value}
                  onClick={() => set("accentColor", value)}
                  className={`flex flex-col items-center gap-1.5 py-2 rounded-lg border-2 transition-colors ${
                    settings.accentColor === value
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-100 hover:border-gray-300 bg-gray-50"
                  }`}
                >
                  <div className="w-5 h-5 rounded-full shadow-sm" style={{ backgroundColor: color }} />
                  <span className="text-xs text-gray-600">{label}</span>
                </button>
              ))}
            </div>
          </SettingSection>

          {/* Header Alignment */}
          <SettingSection label="Header Alignment">
            <ToggleGroup
              options={[
                { value: "center", label: "Center" },
                { value: "left",   label: "Left"   },
              ]}
              value={settings.headerAlign ?? "center"}
              onChange={(v) => set("headerAlign", v as ResumeSettings["headerAlign"])}
            />
          </SettingSection>

          {/* Name Size */}
          <SettingSection label="Name Size">
            <ToggleGroup
              options={[
                { value: "sm", label: "S" },
                { value: "md", label: "M" },
                { value: "lg", label: "L" },
                { value: "xl", label: "XL" },
              ]}
              value={settings.nameSize ?? "lg"}
              onChange={(v) => set("nameSize", v as ResumeSettings["nameSize"])}
            />
          </SettingSection>

          {/* Name Style */}
          <SettingSection label="Name Style">
            <div className="flex gap-2">
              <ToggleGroup
                options={[
                  { value: "uppercase", label: "UPPERCASE" },
                  { value: "normal",    label: "Normal" },
                ]}
                value={settings.nameCase ?? "uppercase"}
                onChange={(v) => set("nameCase", v as ResumeSettings["nameCase"])}
              />
            </div>
            <label className="flex items-center gap-2 mt-2 text-xs text-gray-600 cursor-pointer">
              <input type="checkbox" checked={settings.nameBold ?? true} onChange={(e) => set("nameBold", e.target.checked)}
                className="rounded border-gray-300" />
              Bold name
            </label>
          </SettingSection>

          {/* Section Headers */}
          <SettingSection label="Section Headers">
            <ToggleGroup
              options={[
                { value: "uppercase", label: "UPPERCASE" },
                { value: "normal",    label: "Normal" },
              ]}
              value={settings.sectionHeaderCase ?? "uppercase"}
              onChange={(v) => set("sectionHeaderCase", v as ResumeSettings["sectionHeaderCase"])}
            />
          </SettingSection>

          {/* Preview hint */}
          <div className="text-xs text-gray-400 bg-gray-50 rounded-lg p-3 leading-relaxed">
            Changes apply to both the preview and the downloaded PDF.
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{label}</p>
      {children}
    </div>
  );
}

function ToggleGroup({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string; style?: React.CSSProperties }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex gap-0.5 bg-gray-100 rounded-lg p-1">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          style={o.style}
          className={`flex-1 py-1.5 text-xs rounded-md transition-colors ${
            value === o.value
              ? "bg-white text-gray-800 shadow-sm font-medium"
              : "text-gray-400 hover:text-gray-600"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
