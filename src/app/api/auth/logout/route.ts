import { type NextRequest, NextResponse } from "next/server";
import { revokeDbSession, COOKIE_NAME } from "@/lib/server-session";

export async function POST(req: NextRequest): Promise<NextResponse> {
  const token = req.cookies.get(COOKIE_NAME)?.value;

  const res = NextResponse.json({ ok: true });
  // Clear the cookie unconditionally — even if DB revocation fails
  res.cookies.set(COOKIE_NAME, "", { httpOnly: true, maxAge: 0, path: "/" });

  if (token) {
    try {
      await revokeDbSession(token);
    } catch {
      // Best-effort: cookie is already cleared; session will expire naturally
    }
  }

  return res;
}
