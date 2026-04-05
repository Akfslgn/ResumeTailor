import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { Resume } from "@/types/resume";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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

    const systemPrompt = `You are an expert resume writer and career coach.

Your task:
1. Parse the provided plain-text resume into a structured JSON object matching the schema below.
   - Capture ALL skills exactly as listed — do NOT drop any skill, technology, or tool.
   - Map skills into the correct categories:
       languages: programming/scripting/markup languages (e.g. JavaScript, Python, HTML, CSS)
       frameworks: libraries, frameworks, UI kits (e.g. React, Flask, Express, Bootstrap, Tailwind CSS)
       tools: dev tools, workflow tools, platforms (e.g. Git, GitHub, Jira, OpenAI API, Render)
       databases: databases and ORMs (e.g. PostgreSQL, MongoDB, MySQL)
       cloud: cloud/deployment services (e.g. AWS, Vercel, Render, Heroku)
   - If a skill fits multiple categories, put it in the most specific one.
   - Do NOT leave any array empty if the resume lists relevant items for it.

2. Create a tailored version of that resume optimized for the provided job description.

Tailoring rules:
- NEVER invent skills, experiences, companies, or credentials not in the original resume.
- NEVER remove or omit any skill from skills arrays — all skills must appear in tailored version too.
  You may reorder skills (most relevant first) but deletion is strictly forbidden.
- The "summary" field must be 2-4 sentences of professional prose only.
  DO NOT list technologies or skills in the summary — those belong in the skills section.
  The summary should describe the candidate's experience level, domain, and value proposition.
- Reorder and rephrase bullet points in experience to highlight the most relevant accomplishments.
- Reorder experiences and projects to put the most relevant first.

Return a JSON object with exactly two keys:
- "original": the fully parsed resume with ALL content preserved, just structured
- "tailored": the tailored version optimized for the job (all skills kept, summary as prose)

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
      temperature: 0.3,
    });

    const raw = completion.choices[0].message.content;
    if (!raw) {
      return NextResponse.json(
        { error: "Empty response from AI." },
        { status: 500 },
      );
    }

    const parsed = JSON.parse(raw) as { original: Resume; tailored: Resume };
    return NextResponse.json({
      original: parsed.original,
      tailored: parsed.tailored,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
