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
}`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { resumeText } = body;

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
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OpenAI API key not configured." },
        { status: 500 },
      );
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a resume parser. Your job is to extract ALL information from a plain-text resume into structured JSON.

Rules:
- Preserve ALL content exactly as written — do NOT rephrase, summarize, or omit anything.
- Keep the exact category names for skills (e.g. "Frontend", "Backend", "Database"). Do not rename them.
- Keep all bullet points word-for-word.
- Keep the summary/objective word-for-word.
- If a field is missing from the resume, use an empty string or empty array as appropriate.
- For skills, if the resume doesn't have clear categories, create reasonable ones (Languages, Frameworks, Tools, etc.)

Return ONLY valid JSON matching this schema:
${RESUME_SCHEMA}

No markdown fences, no explanation — just the JSON object.`,
        },
        {
          role: "user",
          content: `Parse this resume into structured JSON. Preserve ALL content exactly as-is.\n\n${resumeText.slice(0, 6000)}`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.1,
    });

    const raw = completion.choices[0].message.content;
    if (!raw) {
      return NextResponse.json(
        { error: "Empty response from AI." },
        { status: 500 },
      );
    }

    const parsed = JSON.parse(raw) as Resume;

    return NextResponse.json({ resume: parsed });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
