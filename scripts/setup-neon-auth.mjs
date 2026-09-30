import { neon } from "@neondatabase/serverless";
import { randomBytes, scryptSync } from "node:crypto";
import fs from "node:fs";
import readline from "node:readline/promises";

const envFile = fs.readFileSync(".env.local", "utf8");
const databaseUrl = process.env.DATABASE_URL ?? envFile.match(/^DATABASE_URL="?([^"\r\n]+)"?$/m)?.[1];
const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();

if (!databaseUrl || !email) {
  throw new Error("Usá DATABASE_URL y ADMIN_EMAIL al ejecutar este script.");
}

const terminal = readline.createInterface({ input: process.stdin, output: process.stdout });
const password = await terminal.question("Contraseña nueva del administrador: ");
terminal.close();

if (password.length < 10) {
  throw new Error("La contraseña debe tener al menos 10 caracteres.");
}

const salt = randomBytes(16).toString("hex");
const hash = `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
const sql = neon(databaseUrl);

await sql.query("create table if not exists admin_users (email text primary key, name text not null, password_hash text not null, created_at timestamptz not null default now())");
await sql.query("create table if not exists auth_sessions (token_hash text primary key, admin_email text not null references admin_users(email) on delete cascade, expires_at timestamptz not null, created_at timestamptz not null default now())");
await sql.query("create index if not exists auth_sessions_expires_at_idx on auth_sessions (expires_at)");
await sql.query("insert into admin_users (email, name, password_hash) values ($1, $2, $3) on conflict (email) do update set password_hash = excluded.password_hash, name = excluded.name", [email, email, hash]);
console.log(`Administrador Neon configurado: ${email}`);
