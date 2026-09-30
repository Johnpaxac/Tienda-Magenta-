import { NextResponse } from "next/server";
import { createAdminSession, verifyPassword } from "@/backend/neon-auth";
import {
  clearLoginFailures,
  getClientAddress,
  isLoginBlocked,
  registerLoginFailure,
} from "@/backend/login-rate-limit";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { email?: string; password?: string } | null;
  const email = body?.email?.trim().toLowerCase();
  const password = body?.password;

  if (!email || !password) {
    return NextResponse.json({ error: "Completá email y contraseña." }, { status: 400 });
  }

  const attemptKey = `${getClientAddress(request)}:${email}`;
  const blockedFor = isLoginBlocked(attemptKey);

  if (blockedFor > 0) {
    return NextResponse.json(
      { error: "Demasiados intentos. Probá nuevamente más tarde." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(blockedFor / 1000)) } },
    );
  }

  try {
    const { sql } = await import("@/backend/neon");
    const [admin] = await sql`
      select email, name, password_hash
      from admin_users
      where email = ${email}
    `;

    if (!admin || !(await verifyPassword(password, String(admin.password_hash)))) {
      registerLoginFailure(attemptKey);
      return NextResponse.json({ error: "Credenciales inválidas." }, { status: 401 });
    }

    await createAdminSession({ email: String(admin.email), name: String(admin.name) });
    clearLoginFailures(attemptKey);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Neon no está configurado." }, { status: 500 });
  }
}