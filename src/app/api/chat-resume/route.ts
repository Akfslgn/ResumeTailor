import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { Resume } from "@/types/resume";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

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

    const isCreationMode = !resume;

    const systemPrompt = isCreationMode
      ? `You are a professional resume writer assistant. The user has NO resume yet — help them build one from scratch through conversation.

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
      : `You are a professional resume editor assistant helping the user refine their existing resume through conversation.

When the user asks for changes:
1. Apply the changes to the resume JSON.
2. Reply with a SHORT, friendly confirmation (1-2 sentences max).
3. Return the full updated resume.

Rules:
- NEVER invent new experiences, companies, degrees, or skills not already in the resume.
- You CAN rephrase, reorder, shorten, expand, or restructure existing content.
- You CAN add skills the user explicitly tells you to add.

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
