import { NextResponse } from "next/server";
import { getAdminUser } from "@/backend/neon-auth";

export async function GET() {
  try {
    const user = await getAdminUser();
    return NextResponse.json(user ? { name: user.name, email: user.email, role: "admin", provider: "email" } : null);
  } catch {
    return NextResponse.json(null);
  }
}