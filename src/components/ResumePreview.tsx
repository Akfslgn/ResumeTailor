import { Resume } from "@/types/resume";

interface Props {
  resume: Resume;
}

export default function ResumePreview({ resume }: Props) {
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
          {resume.skills.languages?.length > 0 && (
            <SkillRow label="Languages" items={resume.skills.languages} />
          )}
          {resume.skills.frameworks?.length > 0 && (
            <SkillRow
              label="Frameworks & Libraries"
              items={resume.skills.frameworks}
            />
          )}
          {resume.skills.databases?.length > 0 && (
            <SkillRow label="Databases" items={resume.skills.databases} />
          )}
          {resume.skills.tools?.length > 0 && (
            <SkillRow label="Tools & Platforms" items={resume.skills.tools} />
          )}
          {resume.skills.cloud?.length > 0 && (
            <SkillRow label="Cloud & DevOps" items={resume.skills.cloud} />
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
                  <span className="font-bold text-gray-900">{exp.title}</span>
                  <span className="text-gray-600"> — {exp.company}</span>
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
            <div key={i} className="mb-3">
              <div className="flex justify-between items-baseline">
                <span className="font-bold text-gray-900">{proj.name}</span>
                {proj.url && (
                  <span className="text-xs text-gray-500">{proj.url}</span>
                )}
              </div>
              <p className="text-gray-700 mb-0.5">{proj.description}</p>
              <p className="text-xs text-gray-500">
                {proj.technologies.join(" · ")}
              </p>
            </div>
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
