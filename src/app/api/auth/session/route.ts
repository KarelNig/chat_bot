import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { validateDbSession, COOKIE_NAME } from "@/lib/server-session";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export async function GET(req: NextRequest): Promise<NextResponse> {
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: "Service unavailable." }, { status: 503 });
  }

  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json({ error: "No session." }, { status: 401 });
  }

  const result = await validateDbSession(token);

  if (result.status === "table_missing") {
    // Migration not yet applied — don't treat this as an auth failure.
    // The client should fall back to its cached localStorage data.
    return NextResponse.json(
      { error: "Session table not configured.", tableMissing: true },
      { status: 503 },
    );
  }

  if (result.status === "invalid") {
    const res = NextResponse.json({ error: "Invalid or expired session." }, { status: 401 });
    res.cookies.set(COOKIE_NAME, "", { httpOnly: true, maxAge: 0, path: "/" });
    return res;
  }

  const db = createClient<Database>(supabaseUrl, supabaseKey);
  const { data: profile } = await db
    .from("profiles")
    .select("id, username, avatar_url")
    .eq("id", result.userId)
    .maybeSingle();

  if (!profile) {
    return NextResponse.json({ error: "User not found." }, { status: 401 });
  }

  return NextResponse.json({
    id: profile.id,
    username: profile.username,
    avatarUrl: profile.avatar_url,
  });
}
