import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export const COOKIE_NAME = "zc_sid";

// Use service-role key to bypass RLS on user_sessions; fall back to anon key.
// Set SUPABASE_SERVICE_ROLE_KEY in your server environment (never expose to client).
function getDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  return createClient<Database>(url, key);
}

async function hashToken(rawToken: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(rawToken));
  return Buffer.from(buf).toString("hex");
}

// PostgreSQL error code 42P01 = "undefined_table"
function isTableMissingError(err: { code?: string; message?: string }): boolean {
  return err.code === "42P01" || Boolean(err.message?.includes("does not exist"));
}

/**
 * Mint a new 32-byte random token, store its SHA-256 hash in the DB, and return
 * the raw token. Returns null if the user_sessions table isn't ready yet — callers
 * should proceed without the HttpOnly cookie rather than returning a 500.
 */
export async function createDbSession(userId: string): Promise<string | null> {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const rawToken = Buffer.from(bytes).toString("base64url");

  const hash = await hashToken(rawToken);
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();

  const { error } = await getDb().from("user_sessions").insert({
    user_id: userId,
    token_hash: hash,
    expires_at: expiresAt,
  });

  if (error) {
    if (isTableMissingError(error)) {
      console.warn("[server-session] user_sessions table not found — run the migration.");
    } else {
      console.error("[server-session] Session insert failed:", error.message);
    }
    return null;
  }

  return rawToken;
}

/** Three-state result so callers can distinguish a bad token from a missing table. */
export type DbSessionResult =
  | { status: "valid"; userId: string }
  | { status: "invalid" }
  | { status: "table_missing" };

/**
 * Validate a raw token from the session cookie.
 * Returns "table_missing" when the migration hasn't been run — the caller should
 * degrade gracefully instead of treating it as an authentication failure.
 */
export async function validateDbSession(rawToken: string): Promise<DbSessionResult> {
  const hash = await hashToken(rawToken);
  const db = getDb();

  const { data, error } = await db
    .from("user_sessions")
    .select("user_id, expires_at")
    .eq("token_hash", hash)
    .is("revoked_at", null)
    .maybeSingle();

  if (error) {
    if (isTableMissingError(error)) return { status: "table_missing" };
    return { status: "invalid" };
  }

  if (!data) return { status: "invalid" };

  if (new Date(data.expires_at) < new Date()) {
    void db.from("user_sessions").delete().eq("token_hash", hash);
    return { status: "invalid" };
  }

  return { status: "valid", userId: data.user_id };
}

/**
 * Revoke a session by setting revoked_at — prevents any further use of the token.
 */
export async function revokeDbSession(rawToken: string): Promise<void> {
  const hash = await hashToken(rawToken);
  await getDb()
    .from("user_sessions")
    .update({ revoked_at: new Date().toISOString() })
    .eq("token_hash", hash);
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    path: "/",
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
  };
}
