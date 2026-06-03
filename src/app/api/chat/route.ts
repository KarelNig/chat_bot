import { type NextRequest, NextResponse } from "next/server";
import type { AiModelId } from "@/types/ai-model";
import { callGemini } from "@/lib/gemini";

const SYSTEM_INSTRUCTIONS: Record<AiModelId, string> = {
  general:
    "You are a helpful, balanced General Assistant powered by Google Gemini. Provide clear, accurate, and well-structured answers to any queries.",
  code_optimizer:
    "You are an elite Code Optimizer powered by Google Gemini. Respond ONLY with high-quality Markdown code blocks, optimization logs, and clear architectural fixes.",
  text_editor:
    "You are an expert Text Editor and copywriter powered by Google Gemini. Fix grammar, improve style, and provide concise summaries of text.",
  creative_bot:
    "You are a witty, creative AI agent powered by Google Gemini. Brainstorm ideas, use casual humor, and think outside the box.",
  data_analyst:
    "You are a rigorous Data Analyst powered by Google Gemini. Format your responses using clean Markdown tables, structured lists, and strict mathematical logic.",
};

interface RequestBody {
  prompt: string;
  modelId: AiModelId;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("[chat/route] GEMINI_API_KEY is not set");
    return NextResponse.json(
      { error: "AI service is not configured. Contact the administrator." },
      { status: 503 },
    );
  }

  let body: RequestBody;
  try {
    body = (await req.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { prompt, modelId } = body;
  if (!prompt.trim()) {
    return NextResponse.json({ error: "Missing prompt." }, { status: 400 });
  }

  const systemInstruction = SYSTEM_INSTRUCTIONS[modelId];
  if (!systemInstruction) {
    return NextResponse.json({ error: `Unknown modelId: ${modelId}` }, { status: 400 });
  }

  const text = await callGemini({
    apiKey,
    systemInstruction,
    userPrompt: prompt.trim(),
    maxOutputTokens: 512,
    temperature: 0.85,
  });

  if (!text) {
    return NextResponse.json(
      { error: "All AI engines are currently busy. Please try again in a few moments." },
      { status: 503 },
    );
  }

  return NextResponse.json({ text });
}
