import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import { sql } from "@/backend/neon";

const scrypt = promisify(scryptCallback);
const sessionCookieName = "magenta_admin_session";
const sessionDurationMs = 7 * 24 * 60 * 60 * 1000;

type AdminRecord = {
  email: string;
  name: string;
};

function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = (await scrypt(password, salt, 64)) as Buffer;
  return `${salt}:${derivedKey.toString("hex")}`;
}

export async function verifyPassword(password: string, storedHash: string) {
  const [salt, keyHex] = storedHash.split(":");
  if (!salt || !keyHex) return false;

  const expectedKey = Buffer.from(keyHex, "hex");
  const actualKey = (await scrypt(password, salt, expectedKey.length)) as Buffer;
  return expectedKey.length === actualKey.length && timingSafeEqual(expectedKey, actualKey);
}

export async function createAdminSession(admin: AdminRecord) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + sessionDurationMs);

  await sql`
    insert into auth_sessions (token_hash, admin_email, expires_at)
    values (${hashSessionToken(token)}, ${admin.email}, ${expiresAt.toISOString()})
  `;

  const cookieStore = await cookies();
  cookieStore.set(sessionCookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt,
    path: "/",
  });
}

export async function getAdminUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(sessionCookieName)?.value;
  if (!token) return null;

  const [admin] = await sql`
    select a.email, a.name
    from auth_sessions s
    join admin_users a on a.email = s.admin_email
    where s.token_hash = ${hashSessionToken(token)}
      and s.expires_at > now()
  `;

  return (admin as AdminRecord | undefined) ?? null;
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(sessionCookieName)?.value;

  if (token) {
    await sql`delete from auth_sessions where token_hash = ${hashSessionToken(token)}`;
  }

  cookieStore.delete(sessionCookieName);
}

export { sessionCookieName };
