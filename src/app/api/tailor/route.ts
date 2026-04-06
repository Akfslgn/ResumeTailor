import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { Resume } from "@/types/resume";

const RESUME_SCHEMA = `{
  name, email, phone, location, linkedin?, github?, website?,
  summary,
  skills: { "Category Name": ["skill1", "skill2"], ... },
  experience: [{ company, title, location, startDate, endDate, bullets[] }],
  education: [{ school, degree, field, graduationDate, gpa? }],
  projects: [{ name, description, technologies[], url? }]
}

For skills, preserve the exact category names from the original resume (e.g. Frontend, Backend, Database). Do not rename them to languages/frameworks/tools.`;

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

ABSOLUTE RULE: The tailored resume must read like a real human wrote it — a developer who knows their own work, not a recruiter bot. A recruiter or hiring manager must NEVER suspect this was AI-generated. If it sounds like ChatGPT wrote it, you failed.

Anti-AI writing rules (CRITICAL):
- Vary sentence length and structure. Mix short punchy sentences with longer ones.
- Use casual-professional tone — like a developer explaining their work to a peer, not a marketing brochure.
- NEVER use these words/phrases: passionate, driven, leverage, innovative, cutting-edge, committed to, dedicated to, dynamic, synergy, best practices, solid foundation, strong background, proven track record, collaborative environments, I thrive, emphasizes, align with, utilize, spearheaded, orchestrated, facilitate, streamline, harness, empower, robust, scalable solutions, cross-functional, stakeholders, actionable insights, paradigm, ecosystem
- NEVER use parallel structure in every bullet (don't start 5 bullets the same way)
- NEVER write generic filler that could apply to anyone — every sentence must be specific to THIS person's actual work
- Prefer concrete verbs: built, wrote, fixed, shipped, cut, added, moved, set up, wired up, broke apart, ran
- Avoid fancy verbs that real developers don't use in conversation: spearheaded, orchestrated, championed, pioneered

Summary writing rules (MANDATORY — HIGHEST PRIORITY, OVERRIDE EVERYTHING ELSE):
- 2-3 sentences MAXIMUM. Short and clean.
- ONLY mention technologies, tools, frameworks, and what kind of development work they do.
- Sentence 1: "[Role title] with [X]+ years of experience building web applications using [Tech1], [Tech2], and [Tech3]."
- Sentence 2: "Focused on [type of work: clean interfaces / full stack / API design / etc]."
- Sentence 3 (optional): "Background in [other area] and [something forward-looking]." or work authorization.
- ZERO project names. ZERO company names. ZERO metrics. ZERO accomplishments. Those go ONLY in experience bullets.
- If the summary contains ANY project name, company name, or number like "500+ users" or "30% faster", you have FAILED.
- Match technologies mentioned to the job description's required stack.

Good summary example:
"Frontend Developer with hands-on experience building web applications using React.js, JavaScript, and modern CSS frameworks. Focused on creating clean and user-friendly interfaces. Background in full stack development and eager to continue growing in frontend technologies."

Bad summary example (NEVER write this):
"With over 5 years of experience, I specialize in creating interactive UIs using React. My background includes building scalable applications in collaborative Agile environments."

Another bad example (NEVER write this — too project-specific for a summary):
"Full Stack Developer who shipped a library platform for 500+ users and cut DB query times by 30%."

Bullet point rules:
- Strong past-tense action verb to start every bullet — but vary them (don't use "Built" 4 times)
- Remove ALL filler: "contributing to", "ensuring", "fostering", "in order to", "laying a foundation", "responsible for"
- Use numbers from the resume (500+ users, 15+ APIs, 30% faster, etc.)
- Replace vague bullets with specific ones based on technologies and projects in the resume
- Each bullet should sound like the developer is casually explaining what they did, not writing a press release
- NEVER invent metrics or achievements that aren't in the original resume — only rephrase and highlight what exists

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

CRITICAL REMINDER — READ BEFORE GENERATING:
The "tailored" summary MUST ONLY mention technologies, tools, and type of work. NO project names, NO company names, NO metrics like "500+ users" or "30% faster". If the summary contains any of those, regenerate it. Follow this exact pattern:
"[Role] with [X]+ years of experience building web applications using [Tech1], [Tech2], and [Tech3]. Focused on [type of work]. [Optional: Background in X / work authorization]."

Return JSON with "original" and "tailored" keys.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.4,
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
            const match = s.match(/(\w+)\s+(\d{4})/);
            if (match) {
              const d = new Date(`${match[1]} 1, ${match[2]}`);
              if (!isNaN(d.getTime())) return d;
            }
            const yearMatch = s.match(/(\d{4})/);
            if (yearMatch) return new Date(parseInt(yearMatch[1]), 0, 1);
            return null;
          };
          const start = parseDate(job.startDate);
          const end = parseDate(job.endDate);
          if (start && end) {
            months +=
              (end.getFullYear() - start.getFullYear()) * 12 +
              (end.getMonth() - start.getMonth());
          }
        } catch {
          /* skip */
        }
      }
      return Math.max(1, Math.round(months / 12));
    })();

    // Determine role from most recent job title
    const latestTitle =
      parsed.original.experience?.[0]?.title ?? "Full Stack Developer";
    const firstSentence = `${latestTitle} — ${totalYears}+ years building web applications.`;

    const summaryCompletion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `Complete a resume professional summary. The first sentence is already written — you must NOT change it or restate it. Only add 1-2 more sentences after it.

Rules for the sentences you add:
- Sentence 2: pick the single most impressive achievement from the resume that has a real number (users, %, count, scale)
- Sentence 3: one specific technical claim about what this person does best — name actual technologies or problem types, NOT generic phrases
- FORBIDDEN phrases for sentence 3: "Excels in", "Excels at", "skilled in", "proficient in", "specializes in", "experienced in", "strong in", "adept at", "expert in"
- FORBIDDEN words anywhere: crafting, passionate, leverage, innovative, dynamic, synergy, committed to, dedicated to, I thrive, strong background, proven track record, solid foundation, successfully, collaborative, Agile teams, effectively, excels

Good sentence 3 examples:
✅ "Strongest working across the full stack — React UI down to PostgreSQL query tuning."
✅ "Most comfortable owning a feature end to end: API design, backend logic, and frontend implementation."
✅ "Goes deep on performance: has cut API response times and DB query times on real production systems."

Bad sentence 3 examples:
❌ "Excels in developing web applications using React, Flask, and PostgreSQL."
❌ "Skilled in building robust web solutions."
❌ "Strong background in full stack development."

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
        const parsed2 = JSON.parse(summaryRaw) as {
          rest?: string;
          summary?: string;
        };
        const rest = parsed2.rest ?? parsed2.summary ?? "";
        if (rest) parsed.tailored.summary = `${firstSentence} ${rest}`;
      } catch {
        /* keep original summary if parse fails */
      }
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
