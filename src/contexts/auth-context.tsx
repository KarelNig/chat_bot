"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import type { Session } from "@/types/auth";
import { getSession, saveSession, clearSession } from "@/lib/session";
import { CURRENT_USER_ID } from "@/types/chat";
import { isSupabaseConfigured } from "@/lib/supabase";
import { fetchProfileByUsername, createProfile } from "@/lib/supabase-api";

interface AuthContextValue {
  user: Session | null;
  isAuthLoading: boolean;
  login: (username: string) => Promise<string | null>;
  register: (username: string) => Promise<string | null>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }): React.JSX.Element {
  // null on both SSR and first client render → no hydration mismatch
  const [user, setUser] = useState<Session | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // Runs only on the client after hydration
  useEffect(() => {
    setUser(getSession());
    setIsAuthLoading(false);
  }, []);

  const login = async (username: string): Promise<string | null> => {
    const trimmed = username.trim();
    if (!trimmed) return "Username cannot be empty.";
    if (!isSupabaseConfigured) {
      const session: Session = { id: CURRENT_USER_ID, username: trimmed };
      saveSession(session);
      setUser(session);
      return null;
    }
    const profile = await fetchProfileByUsername(trimmed);
    if (!profile) return "User not found. Please register first.";
    saveSession(profile);
    setUser(profile);
    return null;
  };

  const register = async (username: string): Promise<string | null> => {
    const trimmed = username.trim();
    if (!trimmed) return "Username cannot be empty.";
    if (trimmed.length < 3) return "Username must be at least 3 characters.";
    if (!isSupabaseConfigured) {
      const session: Session = { id: CURRENT_USER_ID, username: trimmed };
      saveSession(session);
      setUser(session);
      return null;
    }
    const existing = await fetchProfileByUsername(trimmed);
    if (existing) return "Username already taken. Please choose another.";
    const newId = crypto.randomUUID();
    const profile = await createProfile(newId, trimmed);
    if (!profile) return "Failed to create account. Please try again.";
    saveSession(profile);
    setUser(profile);
    return null;
  };

  const logout = (): void => {
    clearSession();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
