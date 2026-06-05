import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { awaitAllCallbacks } from "@langchain/core/callbacks/promises";

const GEMINI_MODELS = ["gemini-2.5-flash", "gemini-3.1-flash-lite", "gemini-3.5-flash"] as const;

export interface GeminiCallParams {
  apiKey: string;
  systemInstruction: string;
  userPrompt: string;
  maxOutputTokens?: number;
  temperature?: number;
}

/**
 * Walk GEMINI_MODELS in priority order using LangChain's ChatGoogleGenerativeAI.
 * Each `model.invoke()` call is automatically traced by LangSmith when
 * LANGCHAIN_TRACING_V2 and LANGCHAIN_API_KEY are set in the environment.
 * Returns null if every model fails — caller provides the user-facing error.
 */
export async function callGemini(params: GeminiCallParams): Promise<string | null> {
  const {
    apiKey,
    systemInstruction,
    userPrompt,
    maxOutputTokens = 2048,
    temperature = 0.85,
  } = params;

  for (const modelName of GEMINI_MODELS) {
    try {
      const model = new ChatGoogleGenerativeAI({
        model: modelName,
        apiKey,
        maxOutputTokens,
        temperature,
      });

      const response = await model.invoke([
        new SystemMessage(systemInstruction),
        new HumanMessage(userPrompt),
      ]);

      const raw = response.content;
      const text = typeof raw === "string" ? raw.trim() : "";

      if (!text) {
        console.warn(`[Gemini] Model ${modelName} returned empty content, trying next fallback...`);
        continue;
      }

      // Flush LangSmith background callbacks before the serverless function exits
      await awaitAllCallbacks();
      return text;
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      console.warn(`[Gemini] Model ${modelName} failed (${reason}), trying next fallback...`);
    }
  }

  await awaitAllCallbacks();
  return null;
}

// Test pre-commit hooks for presentation purposes only — not exported from this module.
