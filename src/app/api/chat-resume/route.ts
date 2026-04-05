import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { Resume } from "@/types/resume";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const RESUME_SCHEMA = `{
  name, email, phone, location, linkedin?, github?, website?,
  summary,
  skills: { "Category Name": ["skill1", "skill2"], ... },
  experience: [{ company, title, location, startDate, endDate, bullets[] }],
  education: [{ school, degree, field, graduationDate, gpa? }],
  projects: [{ name, description, technologies[], url? }]
}

For skills, use whatever category names make sense (e.g. Frontend, Backend, Database, Tools, Deployment). Each key maps to an array of skill strings.`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      messages,
      resume,
    }: { messages: ChatMessage[]; resume?: Resume | null } = body;

    if (!messages?.length) {
      return NextResponse.json({ error: "Missing messages." }, { status: 400 });
    }
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OpenAI API key not configured." },
        { status: 500 },
      );
    }
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const isCreationMode = !resume;

    const systemPrompt = isCreationMode
      ? `You are a professional resume writer assistant. You write like a real human professional, not an AI. Every word must read as if a sharp human career coach wrote it — vary sentence structure, be direct, be specific, no corporate buzzwords, no AI-sounding patterns. The user has NO resume yet — help them build one from scratch through conversation.

As the user shares their background, ask clarifying questions if needed, then generate a complete, professional resume JSON.

When you have enough information to build a resume:
1. Generate a complete resume filling in all fields you know.
2. Use empty arrays [] for categories you have no data for.
3. Reply with an encouraging short message.

Always return a JSON object with two keys:
  "reply": your conversational response (ask questions, confirm, encourage)
  "resume": the full resume JSON if you have enough info to generate one, otherwise null

Resume schema:
${RESUME_SCHEMA}

Return ONLY valid JSON — no markdown, no explanation.`
      : `You are a professional resume editor assistant. You write like a real human professional, not an AI. Every word you write must read as if a sharp human career coach wrote it — vary sentence structure, be direct, be specific, absolutely no corporate buzzwords (leverage, passionate, driven, synergy, cutting-edge, committed to, best practices), no AI-sounding patterns. A recruiter must never suspect AI wrote this.

Do EXACTLY what the user asks. You can:
- Change any field: name, contact info, summary, skills, experience, education, projects
- Add new skills, change skill category names, restructure categories however the user wants
- Add, remove, or rewrite bullet points
- Change dates, titles, company names, locations
- Add or remove entire sections
- Rephrase, reorder, shorten, or expand anything
- If the user provides exact text, use it verbatim — do not paraphrase

Reply with a SHORT confirmation (1-2 sentences max), then return the full updated resume.

Always return a JSON object with two keys:
  "reply": your short response
  "resume": the full updated resume JSON

Current resume:
${JSON.stringify(resume, null, 2)}

Return ONLY valid JSON — no markdown, no explanation.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "system", content: systemPrompt }, ...messages],
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

    const parsed = JSON.parse(raw) as { reply: string; resume: Resume | null };
    return NextResponse.json({ reply: parsed.reply, resume: parsed.resume });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
