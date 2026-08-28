import { NextResponse } from "next/server";
import { type AuthSession } from "@/back/auth";

type GoogleTokenInfo = {
  aud?: string;
  email?: string;
  email_verified?: string | boolean;
  name?: string;
  picture?: string;
  sub?: string;
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { credential?: string } | null;
  const credential = body?.credential?.trim();
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  if (!clientId) {
    return NextResponse.json(
      { error: "Falta configurar NEXT_PUBLIC_GOOGLE_CLIENT_ID." },
      { status: 500 },
    );
  }

  if (!credential) {
    return NextResponse.json({ error: "Falta el token de Google." }, { status: 400 });
  }

  const tokenResponse = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`,
  );

  if (!tokenResponse.ok) {
    return NextResponse.json({ error: "Google rechazó el inicio de sesión." }, { status: 401 });
  }

  const tokenInfo = (await tokenResponse.json()) as GoogleTokenInfo;

  if (tokenInfo.aud !== clientId || !tokenInfo.email || !tokenInfo.sub) {
    return NextResponse.json({ error: "El token de Google no es válido." }, { status: 401 });
  }

  const emailVerified = tokenInfo.email_verified === true || tokenInfo.email_verified === "true";

  if (!emailVerified) {
    return NextResponse.json({ error: "Tu cuenta de Google no está verificada." }, { status: 401 });
  }

  const session: AuthSession = {
    name: tokenInfo.name ?? tokenInfo.email,
    email: tokenInfo.email,
    role: "user",
    provider: "google",
  };

  return NextResponse.json(session);
}