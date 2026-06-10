import type { Session } from "@/types/auth";

const KEY = "zc_session";

function isSession(val: unknown): val is Session {
  return (
    typeof val === "object" &&
    val !== null &&
    "id" in val &&
    "username" in val &&
    typeof (val as Record<string, unknown>).id === "string" &&
    typeof (val as Record<string, unknown>).username === "string"
  );
}

// localStorage holds only non-sensitive display data (id, username, avatarUrl).
// The authoritative session credential lives in the server-side HttpOnly cookie.
export function getSession(): Session | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(KEY);
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isSession(parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveSession(session: Session): void {
  // Store only the fields defined in Session — no tokens or expiry timestamps.
  const safe: Session = {
    id: session.id,
    username: session.username,
    avatarUrl: session.avatarUrl,
  };
  localStorage.setItem(KEY, JSON.stringify(safe));
}

export function clearSession(): void {
  localStorage.removeItem(KEY);
  localStorage.removeItem(MODE_KEY);
}

const MODE_KEY = "zc_session_mode";

/** "cookie" = HttpOnly cookie was set at login. "local" = table unavailable, localStorage only. */
export type SessionMode = "cookie" | "local";

export function getSessionMode(): SessionMode | null {
  if (typeof window === "undefined") return null;
  const val = localStorage.getItem(MODE_KEY);
  if (val === "cookie" || val === "local") return val;
  return null;
}

export function setSessionMode(mode: SessionMode): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(MODE_KEY, mode);
}
