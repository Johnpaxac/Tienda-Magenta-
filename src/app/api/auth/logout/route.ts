import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/backend/supabase/server";

export async function POST() {
  try {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  } catch {
    // The client can still be redirected even if the session is already gone.
  }

  return NextResponse.json({ ok: true });
}