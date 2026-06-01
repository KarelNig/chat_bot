import type { Session } from "@/types/auth";

const KEY = "zc_session";

function isSession(val: unknown): val is Session {
  return (
    typeof val === "object" &&
    val !== null &&
    "id" in val &&
    "username" in val &&
    typeof val.id === "string" &&
    typeof val.username === "string"
  );
}

export function getSession(): Session | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(KEY);
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    return isSession(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function saveSession(session: Session): void {
  localStorage.setItem(KEY, JSON.stringify(session));
}

export function clearSession(): void {
  localStorage.removeItem(KEY);
}
