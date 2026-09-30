import { neon } from "@neondatabase/serverless";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("Falta la variable DATABASE_URL.");
}

export const sql = neon(databaseUrl);
