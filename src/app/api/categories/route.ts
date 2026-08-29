import { NextResponse } from "next/server";
import { getAdminUser, createSupabaseServerClient } from "@/backend/supabase/server";

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("categories")
      .select("name,image")
      .order("name");

    if (error) {
      return NextResponse.json([], { status: 200 });
    }

    return NextResponse.json(data ?? []);
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(request: Request) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  try {
    const body = await request.json();
    const name = String(body?.name ?? "").trim();

    if (!name) {
      return NextResponse.json({ error: "Falta el nombre de la categoría." }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("categories")
      .upsert({ name, image: String(body?.image ?? "") }, { onConflict: "name" })
      .select("name,image")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ name: data.name, image: data.image ?? "" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo guardar la categoría.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
