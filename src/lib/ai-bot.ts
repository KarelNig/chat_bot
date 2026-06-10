import type { AiModelId } from "@/types/ai-model";

interface ChatApiResponse {
  text?: string;
  error?: string;
}

export interface ModelResponse {
  text: string;
  /** True when the response is an error message, not an AI-generated reply. */
  isError: boolean;
}

const RANDOM_RESPONSES = [
  "That is a great point! I completely agree with your perspective.",
  "Interesting! Could you tell me a bit more about that?",
  "I see what you mean. Here is how I would approach this situation.",
  "Thanks for sharing — that gives me a lot to think about.",
  "Absolutely! I was just thinking the same thing.",
  "I understand. Let me help you work through this.",
  "Good question! The answer really depends on a few factors.",
  "That makes total sense. Have you considered the alternative?",
  "I appreciate your patience — let me gather my thoughts on this.",
  "Fascinating! I had not thought of it from that angle before.",
  "You raise an excellent point. Here is my take on it.",
  "Let me think about that for a moment... Yes, I agree completely.",
] as const;

/** Returns a random canned response from the pool (used in tests / offline mode). */
export function getRandomResponse(): string {
  return RANDOM_RESPONSES[Math.floor(Math.random() * RANDOM_RESPONSES.length)];
}

/** Returns a random integer delay between 1000 ms and 5000 ms. */
export function getRandomDelay(): number {
  return Math.floor(Math.random() * 4001) + 1000;
}

/** Awaitable sleep utility. */
export function sleep(ms: number): Promise<void> {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * Send the user's message to the server-side /api/chat Route Handler.
 * Always resolves — returns a ModelResponse with isError=true on any failure
 * so callers can distinguish real AI replies from error strings.
 */
export async function getModelResponse(prompt: string, modelId: AiModelId): Promise<ModelResponse> {
  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, modelId }),
    });
    const data = (await res.json()) as ChatApiResponse;
    if (data.text) return { text: data.text, isError: false };
    return {
      text: data.error ?? "The AI returned an unexpected response. Please try again.",
      isError: true,
    };
  } catch {
    return {
      text: "Could not reach the AI service. Check your connection and try again.",
      isError: true,
    };
  }
}
