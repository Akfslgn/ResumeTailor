import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { Resume } from "@/types/resume";

const RESUME_SCHEMA = `{
  name, email, phone, location, linkedin?, github?, website?,
  summary,
  skills: { languages[], frameworks[], tools[], databases[], cloud[] },
  experience: [{ company, title, location, startDate, endDate, bullets[] }],
  education: [{ school, degree, field, graduationDate, gpa? }],
  projects: [{ name, description, technologies[], url? }]
}`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { resumeText, jobDescription } = body;

    if (
      !resumeText ||
      typeof resumeText !== "string" ||
      resumeText.trim().length < 50
    ) {
      return NextResponse.json(
        { error: "Resume text is too short or missing." },
        { status: 400 },
      );
    }
    if (
      !jobDescription ||
      typeof jobDescription !== "string" ||
      jobDescription.trim().length < 20
    ) {
      return NextResponse.json(
        { error: "Job description is too short or missing." },
        { status: 400 },
      );
    }
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OpenAI API key not configured." },
        { status: 500 },
      );
    }
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const systemPrompt = `You are a blunt, no-nonsense resume editor. You hate corporate fluff and AI-sounding language.

ABSOLUTE RULE: The tailored resume must read like a real human wrote it — a developer who knows their own work, not a recruiter bot.

Summary writing rules (MANDATORY):
- 2-4 sentences, prose only, no tech lists
- First sentence: years of experience (SUM ALL jobs including freelance/teaching) + what you build + main stack
- Second sentence: 1-2 real, specific accomplishments with numbers from the resume  
- Third sentence (optional): what makes you different or what you're best at — in plain English
- NEVER start with "I specialize in", "With over X years", "I am a", "As a developer"
- NEVER use: passionate, driven, leverage, innovative, cutting-edge, committed to, dedicated to, dynamic, synergy, best practices, solid foundation, strong background, proven track record, collaborative environments, I thrive, emphasizes, align with
- NEVER mention the company name from the job posting
- Count ALL positions when calculating years of experience — not just the most recent job

Good summary example:
"Full Stack Developer with 8+ years building web apps — React frontends, Node.js/Flask backends, PostgreSQL. At Diamond Ze, shipped a library platform for 500+ users and cut DB query times by 30% through index tuning and query rewrites. Equally comfortable debugging a slow API endpoint or polishing a UI component."

Bad summary example (NEVER write this):
"With over 5 years of experience, I specialize in creating interactive UIs using React. My background includes building scalable applications in collaborative Agile environments."

Bullet point rules:
- Strong past-tense action verb to start every bullet
- Remove ALL filler: "contributing to", "ensuring", "fostering", "in order to", "laying a foundation"
- NEVER use: leverage, innovative, committed to, dynamic, synergy, best practices
- Use numbers from the resume (500+ users, 15+ APIs, 30% faster, etc.)
- Replace vague bullets with specific ones based on technologies and projects in the resume

Your task:
1. Parse the plain-text resume into structured JSON — capture ALL skills, map to correct categories.
2. Create a tailored version optimized for the job description following ALL rules above.

Return a JSON object with exactly two keys:
- "original": the fully parsed resume with ALL content preserved
- "tailored": the tailored version (all skills kept, summary rewritten per rules above)

Both must strictly match this schema:
${RESUME_SCHEMA}

Return ONLY valid JSON — no markdown fences, no explanation.`;

    const userPrompt = `RESUME (plain text):
---
${resumeText.slice(0, 6000)}
---

JOB DESCRIPTION:
---
${jobDescription.slice(0, 4000)}
---

Return JSON with "original" and "tailored" keys.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const raw = completion.choices[0].message.content;
    if (!raw) {
      return NextResponse.json(
        { error: "Empty response from AI." },
        { status: 500 },
      );
    }

    const parsed = JSON.parse(raw) as { original: Resume; tailored: Resume };

    // Second pass: rewrite summary with hardcoded first sentence prefix
    const totalYears = (() => {
      const jobs = parsed.original.experience ?? [];
      let months = 0;
      for (const job of jobs) {
        try {
          const parseDate = (s: string) => {
            if (!s) return null;
            const lower = s.toLowerCase().trim();
            if (lower === "present" || lower === "current") return new Date();
            const d = new Date(s);
            if (!isNaN(d.getTime())) return d;
            const match = s.match(/(\w+)\s+(\d{4})/);
            if (match) return new Date(`${match[1]} 1, ${match[2]}`);
            const yearMatch = s.match(/^(\d{4})$/);
            if (yearMatch) return new Date(`Jan 1, ${yearMatch[1]}`);
            return null;
          };
          const start = parseDate(job.startDate);
          const end = parseDate(job.endDate);
          if (start && end) {
            months += (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
          }
        } catch { /* skip */ }
      }
      return Math.max(1, Math.round(months / 12));
    })();

    // Determine role from most recent job title
    const latestTitle = parsed.original.experience?.[0]?.title ?? "Full Stack Developer";
    const firstSentence = `${latestTitle} — ${totalYears}+ years building web applications.`;

    const summaryCompletion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `Complete a resume professional summary. The first sentence is already written — you must NOT change it or restate it. Only add 1-2 more sentences after it.

Rules for the sentences you add:
- Pick the 1-2 most impressive achievements from the resume that have real numbers (users, %, count)
- Last sentence: what this person does best technically — no soft skills, no Agile, no "collaborative"
- FORBIDDEN words: crafting, passionate, leverage, innovative, dynamic, synergy, committed to, dedicated to, I thrive, specialize in, strong background, proven track record, solid foundation, successfully, collaborative, Agile teams, effectively

Return JSON: { "rest": "sentences 2 and 3 only, NOT including the first sentence" }`,
        },
        {
          role: "user",
          content: `First sentence (already written, do not repeat): "${firstSentence}"

Experience: ${JSON.stringify(parsed.original.experience)}
Projects: ${JSON.stringify(parsed.original.projects)}
Job target: ${jobDescription.slice(0, 800)}

Write only the remaining 1-2 sentences.`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.85,
    });

    const summaryRaw = summaryCompletion.choices[0].message.content;
    if (summaryRaw) {
      try {
        const parsed2 = JSON.parse(summaryRaw) as { rest?: string; summary?: string };
        const rest = parsed2.rest ?? parsed2.summary ?? "";
        if (rest) parsed.tailored.summary = `${firstSentence} ${rest}`;
      } catch { /* keep original summary if parse fails */ }
    }

    return NextResponse.json({
      original: parsed.original,
      tailored: parsed.tailored,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
