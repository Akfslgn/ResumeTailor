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

    // Second pass: rewrite summary separately with focused prompt
    const totalYears = (() => {
      const jobs = parsed.original.experience ?? [];
      let months = 0;
      for (const job of jobs) {
        try {
          const start = new Date(job.startDate);
          const end = job.endDate?.toLowerCase().includes("present")
            ? new Date()
            : new Date(job.endDate);
          if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
            months += (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
          }
        } catch { /* skip */ }
      }
      return Math.max(1, Math.round(months / 12));
    })();

    const summaryCompletion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `Write a resume professional summary. 2-3 sentences. No fluff.

Rules:
- Start with role + years of experience (use exactly ${totalYears}+ years)
- Include 1-2 specific achievements with numbers from the resume
- End with what the person does best in plain words
- NEVER start with: "I specialize", "With over", "I am a", "As a"
- NEVER use: passionate, leverage, innovative, cutting-edge, dynamic, synergy, committed to, dedicated to, collaborative environments, I thrive, strong background, proven track record, solid foundation, specialize in

Return JSON: { "summary": "..." }`,
        },
        {
          role: "user",
          content: `Resume data: ${JSON.stringify({ experience: parsed.original.experience, skills: parsed.original.skills, projects: parsed.original.projects })}

Job description: ${jobDescription.slice(0, 1500)}

Write the summary now.`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.8,
    });

    const summaryRaw = summaryCompletion.choices[0].message.content;
    if (summaryRaw) {
      try {
        const { summary } = JSON.parse(summaryRaw) as { summary: string };
        if (summary) parsed.tailored.summary = summary;
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
