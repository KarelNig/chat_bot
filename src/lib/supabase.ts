import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured) {
  // Only warn at runtime, not during SSR/build to keep build output clean
  if (typeof window !== "undefined") {
    console.warn(
      "[zimran-chat] Supabase env vars not set — running in local-only mode.\n" +
        "Copy .env.local.example to .env.local and fill in your project credentials.",
    );
  }
}

// Inferred as SupabaseClient<Database> | null
export const supabase = isSupabaseConfigured
  ? createClient<Database>(supabaseUrl, supabaseAnonKey)
  : null;
