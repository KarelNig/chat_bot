import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import type { Database } from "@/types/database";
import { createDbSession, COOKIE_NAME, sessionCookieOptions } from "@/lib/server-session";

// Server-side only — password is hashed here before being written to the database
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

interface RegisterBody {
  username?: string;
  password?: string;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json({ error: "Service unavailable." }, { status: 503 });
  }

  let body: RegisterBody;
  try {
    body = (await req.json()) as RegisterBody;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const username = (body.username ?? "").trim();
  const password = body.password ?? "";

  if (!username || username.length < 3) {
    return NextResponse.json({ error: "Username must be at least 3 characters." }, { status: 400 });
  }
  if (!password || password.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
  }

  const db = createClient<Database>(supabaseUrl, supabaseAnonKey);

  // Uniqueness check
  const { data: existing } = await db
    .from("profiles")
    .select("id")
    .ilike("username", username)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: "Username already taken." }, { status: 409 });
  }

  // Hash password with bcrypt (cost factor 12 — secure and fast enough for serverless)
  const hashedPassword = await bcrypt.hash(password, 12);
  const newId = crypto.randomUUID();

  const { error } = await db.from("profiles").insert({
    id: newId,
    username,
    password: hashedPassword,
  });

  if (error) {
    return NextResponse.json(
      { error: "Failed to create account. Please try again." },
      { status: 500 },
    );
  }

  // Create a server-side session immediately after registration.
  // Null if the table isn't ready — profile was created, login will still work.
  const rawToken = await createDbSession(newId);

  const res = NextResponse.json(
    { id: newId, username, cookieSet: rawToken !== null },
    { status: 201 },
  );
  if (rawToken) {
    res.cookies.set(COOKIE_NAME, rawToken, sessionCookieOptions());
  }
  return res;
}
