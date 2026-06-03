-- Persist the AI agent role with every bot message so the "via …" badge
-- survives page reloads. Values match the AiModelId union in src/types/ai-model.ts
-- (general | code_optimizer | text_editor | creative_bot | data_analyst).
-- Run this once in the Supabase SQL Editor (Dashboard → SQL Editor → New query).

ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS model_persona TEXT NULL;
