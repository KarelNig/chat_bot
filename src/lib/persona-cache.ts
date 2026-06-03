const KEY_PREFIX = "cma_";

/** Persist agent role for a message across page reloads (current browser only). */
export function savePersona(messageId: string, modelId: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY_PREFIX + messageId, modelId);
  } catch {
    // private mode / quota — silently skip
  }
}

/** Returns the stored agent role for a message id, or null if not found. */
export function loadPersona(messageId: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(KEY_PREFIX + messageId);
  } catch {
    return null;
  }
}
