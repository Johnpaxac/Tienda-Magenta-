import { NextResponse } from "next/server";
import { getAdminUser, createSupabaseServerClient } from "@/backend/supabase/server";

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.from("products").select("*").order("featured", { ascending: false }).order("name");

    if (error) {
      return NextResponse.json({ error: "No se pudieron cargar los productos." }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Supabase no está configurado." }, { status: 500 });
  }
}

async function requireAdmin() {
  return getAdminUser();
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  const body = await request.json();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("products").insert(body).select().single();
  return error ? NextResponse.json({ error: error.message }, { status: 400 }) : NextResponse.json(data);
}

export async function PATCH(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  const { id, ...changes } = await request.json();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("products").update(changes).eq("id", id).select().single();
  return error ? NextResponse.json({ error: error.message }, { status: 400 }) : NextResponse.json(data);
}

export async function DELETE(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  const { id } = await request.json();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("products").delete().eq("id", id);
  return error ? NextResponse.json({ error: error.message }, { status: 400 }) : NextResponse.json({ ok: true });
}