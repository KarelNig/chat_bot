export const AI_MODEL_IDS = [
  "general",
  "code_optimizer",
  "text_editor",
  "creative_bot",
  "data_analyst",
] as const;

export type AiModelId = (typeof AI_MODEL_IDS)[number];

export type AgentIconKey = "bot" | "code" | "text" | "creative" | "chart";

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
    id: "general",
    name: "General Assistant",
    tagline: "Helpful & balanced",
    iconKey: "bot",
    iconColor: "#4f46e5",
    badgeClass: "bg-indigo-50 border-indigo-200 text-indigo-700",
  },
  {
    id: "code_optimizer",
    name: "Code Optimizer",
    tagline: "Elite code quality",
    iconKey: "code",
    iconColor: "#059669",
    badgeClass: "bg-emerald-50 border-emerald-200 text-emerald-700",
  },
  {
    id: "text_editor",
    name: "Text Editor",
    tagline: "Grammar & style",
    iconKey: "text",
    iconColor: "#d97706",
    badgeClass: "bg-amber-50 border-amber-200 text-amber-700",
  },
  {
    id: "creative_bot",
    name: "Creative Bot",
    tagline: "Witty & imaginative",
    iconKey: "creative",
    iconColor: "#db2777",
    badgeClass: "bg-pink-50 border-pink-200 text-pink-700",
  },
  {
    id: "data_analyst",
    name: "Data Analyst",
    tagline: "Tables & logic",
    iconKey: "chart",
    iconColor: "#0891b2",
    badgeClass: "bg-cyan-50 border-cyan-200 text-cyan-700",
  },
] as const;

export const DEFAULT_MODEL_ID: AiModelId = "general";

export function getModelConfig(id: AiModelId): AiModelConfig {
  const config = AI_MODELS.find((m) => m.id === id);
  if (config === undefined) throw new Error(`Unknown model id: ${id}`);
  return config;
}
