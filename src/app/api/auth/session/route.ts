import { NextResponse } from "next/server";
import { getAdminUser } from "@/backend/supabase/server";

export async function GET() {
  try {
    const user = await getAdminUser();
    return NextResponse.json(user ? { name: user.user_metadata?.name ?? user.email, email: user.email, role: "admin", provider: "email" } : null);
  } catch {
    return NextResponse.json(null);
  }
}