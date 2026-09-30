import { NextResponse } from "next/server";
import { clearAdminSession } from "@/backend/neon-auth";

export async function POST() {
  try {
    await clearAdminSession();
  } catch {
    // The client can still be redirected even if the session is already gone.
  }

  return NextResponse.json({ ok: true });
}