-- Server-side session management.
-- Run once in Supabase SQL Editor (Dashboard → SQL Editor → New query).

CREATE TABLE IF NOT EXISTS public.user_sessions (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  token_hash   TEXT        NOT NULL UNIQUE,  -- SHA-256 hex of the raw bearer token
  expires_at   TIMESTAMPTZ NOT NULL,
  revoked_at   TIMESTAMPTZ,                  -- NULL = active; set on explicit logout
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_token_hash ON public.user_sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id    ON public.user_sessions(user_id);

-- Enforce RLS: only the service-role key (server) bypasses this; anon/authenticated
-- roles receive no direct access to session rows.
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Deny all access for any non-service role.
CREATE POLICY "no_direct_access" ON public.user_sessions
  AS RESTRICTIVE
  USING (false);
