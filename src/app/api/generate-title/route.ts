import { type NextRequest, NextResponse } from "next/server";
import { callGemini } from "@/lib/gemini";

const SYSTEM_INSTRUCTION =
  "You are a thread title generator. Analyze the following initial user message and return ONLY a crisp, clean chat title consisting of 2 to 4 descriptive words. Do not use quotation marks, markdown, or punctuation. Reply only with the title.";

export async function POST(req: NextRequest): Promise<NextResponse> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "API key not configured." }, { status: 503 });
  }

  let prompt: string;
  try {
    const body = (await req.json()) as { prompt?: string };
    prompt = body.prompt?.trim() ?? "";
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!prompt) {
    return NextResponse.json({ error: "Empty prompt." }, { status: 400 });
  }

  const raw = await callGemini({
    apiKey,
    systemInstruction: SYSTEM_INSTRUCTION,
    userPrompt: prompt,
    maxOutputTokens: 20,
    temperature: 0.3,
  });

  if (!raw) {
    return NextResponse.json(
      { error: "All AI engines are currently busy. Please try again in a few moments." },
      { status: 503 },
    );
  }

  // Strip any stray leading/trailing quotes the model might add despite instructions
  const title = raw.replace(/^["'""]+|["'""]+$/g, "").trim();
  return NextResponse.json({ title });
}
