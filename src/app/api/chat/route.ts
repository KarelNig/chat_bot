import { type NextRequest, NextResponse } from "next/server";
import type { AiModelId } from "@/types/ai-model";
import { callGemini } from "@/lib/gemini";
import { ChatOpenAI } from "@langchain/openai";
import { ChatAnthropic } from "@langchain/anthropic";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { awaitAllCallbacks } from "@langchain/core/callbacks/promises";

const CONCISE_SUFFIX =
  " Keep your response highly concise, direct, and to the point. Avoid long intros or unnecessary verbosity. Ensure your output is comprehensive yet optimized to generate within 2-3 seconds maximum.";

const SYSTEM_INSTRUCTION =
  "You are a helpful AI assistant. Provide clear, accurate, and well-structured answers to any queries." +
  CONCISE_SUFFIX;

interface RequestBody {
  prompt: string;
  modelId: AiModelId;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
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

  let text: string | null = null;

  if (modelId === "gemini") {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Gemini is not configured. Contact the administrator." },
        { status: 503 },
      );
    }
    text = await callGemini({
      apiKey,
      systemInstruction: SYSTEM_INSTRUCTION,
      userPrompt: prompt.trim(),
      maxOutputTokens: 2048,
      temperature: 0.85,
    });
  } else if (modelId === "gpt") {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "OpenAI GPT is not configured. Contact the administrator." },
        { status: 503 },
      );
    }
    try {
      const model = new ChatOpenAI({ model: "gpt-4o-mini", apiKey, temperature: 0.85 });
      const response = await model.invoke([
        new SystemMessage(SYSTEM_INSTRUCTION),
        new HumanMessage(prompt.trim()),
      ]);
      const raw = response.content;
      text = typeof raw === "string" ? raw.trim() : null;
    } catch (err) {
      console.error("[chat/route] GPT error:", err);
    } finally {
      await awaitAllCallbacks();
    }
  } else if (modelId === "claude") {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Anthropic Claude is not configured. Contact the administrator." },
        { status: 503 },
      );
    }
    try {
      const model = new ChatAnthropic({
        model: "claude-opus-4-5-20251101",
        apiKey,
        temperature: 0.85,
      });
      const response = await model.invoke([
        new SystemMessage(SYSTEM_INSTRUCTION),
        new HumanMessage(prompt.trim()),
      ]);
      const raw = response.content;
      text = typeof raw === "string" ? raw.trim() : null;
    } catch (err) {
      console.error("[chat/route] Claude error:", err);
    } finally {
      await awaitAllCallbacks();
    }
  } else {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "DeepSeek is not configured. Contact the administrator." },
        { status: 503 },
      );
    }
    try {
      const model = new ChatOpenAI({
        model: "deepseek-chat",
        apiKey,
        temperature: 0.85,
        configuration: { baseURL: "https://api.deepseek.com/v1" },
      });
      const response = await model.invoke([
        new SystemMessage(SYSTEM_INSTRUCTION),
        new HumanMessage(prompt.trim()),
      ]);
      const raw = response.content;
      text = typeof raw === "string" ? raw.trim() : null;
    } catch (err) {
      console.error("[chat/route] DeepSeek error:", err);
    } finally {
      await awaitAllCallbacks();
    }
  }

  if (!text) {
    return NextResponse.json(
      { error: "The AI engine is currently unavailable. Please try again in a few moments." },
      { status: 503 },
    );
  }

  return NextResponse.json({ text });
}
