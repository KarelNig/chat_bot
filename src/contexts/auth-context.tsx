"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import type { Session } from "@/types/auth";
import {
  getSession,
  saveSession,
  clearSession,
  getSessionMode,
  setSessionMode,
} from "@/lib/session";
import { CURRENT_USER_ID } from "@/types/chat";
import { isSupabaseConfigured } from "@/lib/supabase";

interface AuthContextValue {
  user: Session | null;
  isAuthLoading: boolean;
  login: (username: string, password: string) => Promise<string | null>;
  register: (username: string, password: string) => Promise<string | null>;
  logout: () => void;
  updateUserAvatar: (url: string | null) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface ApiAuthResponse {
  id?: string;
  username?: string;
  avatarUrl?: string | null;
  error?: string;
  cookieSet?: boolean;
}

export function AuthProvider({ children }: { children: ReactNode }): React.JSX.Element {
  // null on both SSR and first client render → no hydration mismatch
  const [user, setUser] = useState<Session | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // Runs only on the client after hydration
  useEffect(() => {
    if (!isSupabaseConfigured) {
      const saved = getSession();
      if (!saved) {
        const mock: Session = { id: CURRENT_USER_ID, username: "Samurai Meow" };
        saveSession(mock);
        setSessionMode("local");
        setUser(mock);
      } else {
        setUser(saved);
      }
      setIsAuthLoading(false);
      return;
    }

    const saved = getSession();
    const mode = getSessionMode();

    // Nothing in localStorage — not logged in.
    if (!saved) {
      setIsAuthLoading(false);
      return;
    }

    // Login succeeded but no cookie was issued (table not ready at login time).
    // Skip the server check — user stays logged in until explicit logout or
    // a fresh login after the migration is applied.
    if (mode === "local") {
      setUser(saved);
      setIsAuthLoading(false);
      return;
    }

    // Cookie-based session — validate server-side on every page load.
    fetch("/api/auth/session")
      .then(async (res) => {
        if (res.ok) {
          const data = (await res.json()) as ApiAuthResponse;
          if (data.id) {
            const session: Session = {
              id: data.id,
              username: data.username ?? "",
              avatarUrl: data.avatarUrl,
            };
            saveSession(session);
            setUser(session);
            return;
          }
        }
        if (res.status === 503) {
          // Table became unavailable since last login — degrade to local mode.
          setSessionMode("local");
          setUser(saved);
          return;
        }
        // 401 — session explicitly invalidated (revoked, expired, or replayed).
        clearSession();
        setUser(null);
      })
      .catch(() => {
        // Network error — optimistic fallback.
        setUser(saved);
      })
      .finally(() => {
        setIsAuthLoading(false);
      });
  }, []);

  const login = async (username: string, password: string): Promise<string | null> => {
    const trimmed = username.trim();
    if (!trimmed) return "Username cannot be empty.";
    if (!password) return "Password cannot be empty.";

    if (!isSupabaseConfigured) {
      const session: Session = { id: CURRENT_USER_ID, username: trimmed };
      saveSession(session);
      setSessionMode("local");
      setUser(session);
      return null;
    }

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Password travels over HTTPS to the server — never stored client-side
        body: JSON.stringify({ username: trimmed, password }),
      });
      const data = (await res.json()) as ApiAuthResponse;
      if (!res.ok || !data.id) {
        return data.error ?? "Invalid username or password.";
      }
      const session: Session = {
        id: data.id,
        username: data.username ?? trimmed,
        avatarUrl: data.avatarUrl,
      };
      saveSession(session);
      setSessionMode(data.cookieSet ? "cookie" : "local");
      setUser(session);
      return null;
    } catch {
      return "Could not connect to server. Please try again.";
    }
  };

  const register = async (username: string, password: string): Promise<string | null> => {
    const trimmed = username.trim();
    if (!trimmed) return "Username cannot be empty.";
    if (trimmed.length < 3) return "Username must be at least 3 characters.";
    if (!password) return "Password cannot be empty.";
    if (password.length < 6) return "Password must be at least 6 characters.";

    if (!isSupabaseConfigured) {
      const session: Session = { id: CURRENT_USER_ID, username: trimmed };
      saveSession(session);
      setSessionMode("local");
      setUser(session);
      return null;
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Password travels over HTTPS to the server — hashed before DB write
        body: JSON.stringify({ username: trimmed, password }),
      });
      const data = (await res.json()) as ApiAuthResponse;
      if (!res.ok || !data.id) {
        return data.error ?? "Failed to create account. Please try again.";
      }
      const session: Session = {
        id: data.id,
        username: data.username ?? trimmed,
      };
      saveSession(session);
      setSessionMode(data.cookieSet ? "cookie" : "local");
      setUser(session);
      return null;
    } catch {
      return "Could not connect to server. Please try again.";
    }
  };

  const logout = (): void => {
    // Clear local state synchronously for instant UI response
    clearSession();
    setUser(null);
    // Revoke the server-side session and clear the HttpOnly cookie
    if (isSupabaseConfigured) {
      void fetch("/api/auth/logout", { method: "POST" });
    }
  };

  const updateUserAvatar = (url: string | null): void => {
    if (!user) return;
    const updated: Session = { ...user, avatarUrl: url };
    saveSession(updated);
    setUser(updated);
  };

  return (
    <AuthContext.Provider
      value={{ user, isAuthLoading, login, register, logout, updateUserAvatar }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
