export const AI_MODEL_IDS = ["gpt", "gemini", "claude", "deepseek"] as const;

export type AiModelId = (typeof AI_MODEL_IDS)[number];

export type AgentIconKey = "gpt" | "gemini" | "claude" | "deepseek";

export interface AiModelConfig {
  id: AiModelId;
  name: string;
  tagline: string;
  iconKey: AgentIconKey;
  iconColor: string;
  badgeClass: string;
}

export const AI_MODELS: readonly AiModelConfig[] = [
  {
    id: "gpt",
    name: "GPT",
    tagline: "Industry standard",
    iconKey: "gpt",
    iconColor: "#10a37f",
    badgeClass: "bg-emerald-50 border-emerald-200 text-emerald-700",
  },
  {
    id: "gemini",
    name: "Gemini",
    tagline: "High-speed Flash",
    iconKey: "gemini",
    iconColor: "#4285F4",
    badgeClass: "bg-blue-50 border-blue-200 text-blue-700",
  },
  {
    id: "claude",
    name: "Claude",
    tagline: "Advanced logic",
    iconKey: "claude",
    iconColor: "#cc785c",
    badgeClass: "bg-orange-50 border-orange-200 text-orange-700",
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    tagline: "Cost-efficient reasoning",
    iconKey: "deepseek",
    iconColor: "#6366f1",
    badgeClass: "bg-indigo-50 border-indigo-200 text-indigo-700",
  },
] as const;

export const DEFAULT_MODEL_ID: AiModelId = "gemini";

export function getModelConfig(id: string): AiModelConfig {
  return AI_MODELS.find((m) => m.id === id) ?? AI_MODELS[1];
}
