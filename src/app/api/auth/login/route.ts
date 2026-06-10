import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import type { Database } from "@/types/database";
import { createDbSession, COOKIE_NAME, sessionCookieOptions } from "@/lib/server-session";

// Server-side only — password hash is fetched and verified here, never forwarded to the client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

interface LoginBody {
  username?: string;
  password?: string;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json({ error: "Service unavailable." }, { status: 503 });
  }

  let body: LoginBody;
  try {
    body = (await req.json()) as LoginBody;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const username = (body.username ?? "").trim();
  const password = body.password ?? "";

  if (!username || !password) {
    return NextResponse.json({ error: "Username and password are required." }, { status: 400 });
  }

  const db = createClient<Database>(supabaseUrl, supabaseAnonKey);

  // Fetch profile including the stored password — server-side only, never forwarded to client
  const { data: profile, error } = await db
    .from("profiles")
    .select("id, username, password, avatar_url")
    .ilike("username", username)
    .maybeSingle();

  if (error || !profile) {
    return NextResponse.json({ error: "Invalid username or password." }, { status: 401 });
  }

  const stored = profile.password ?? "";
  const isBcrypt = stored.startsWith("$2b$") || stored.startsWith("$2a$");

  let valid = false;
  if (isBcrypt) {
    valid = await bcrypt.compare(password, stored);
  } else {
    // Legacy plaintext comparison (transition — existing rows not yet migrated)
    valid = stored === password;
    if (valid) {
      // Silently migrate to bcrypt on first successful plaintext login
      const hash = await bcrypt.hash(password, 12);
      await db.from("profiles").update({ password: hash }).eq("id", profile.id);
    }
  }

  if (!valid) {
    return NextResponse.json({ error: "Invalid username or password." }, { status: 401 });
  }

  // Create a server-side session: store only the SHA-256 hash; send raw token in HttpOnly cookie.
  // Returns null if the user_sessions table isn't ready — credentials were still valid so we
  // return 200 without the cookie rather than failing the entire login.
  const rawToken = await createDbSession(profile.id);

  const res = NextResponse.json({
    id: profile.id,
    username: profile.username,
    avatarUrl: profile.avatar_url,
    cookieSet: rawToken !== null,
  });
  if (rawToken) {
    res.cookies.set(COOKIE_NAME, rawToken, sessionCookieOptions());
  }
  return res;
}
