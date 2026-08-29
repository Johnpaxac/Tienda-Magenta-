import { NextResponse } from "next/server";
import { getAdminUser, createSupabaseServerClient } from "@/backend/supabase/server";

function normalizeProduct(product: Record<string, unknown>) {
  return {
    ...product,
    soldOut: Boolean(product.soldOut ?? product.sold_out ?? false),
  };
}

function resolveSoldOutValue(input: Record<string, unknown>) {
  return Boolean(input.soldOut ?? input.sold_out ?? false);
}

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.from("products").select("*").order("featured", { ascending: false }).order("name");

    if (error) {
      return NextResponse.json({ error: "No se pudieron cargar los productos." }, { status: 500 });
    }

    return NextResponse.json((data ?? []).map((product) => normalizeProduct(product as Record<string, unknown>)));
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
  const { soldOut, sold_out, ...payload } = body;
  const soldOutValue = resolveSoldOutValue({ soldOut, sold_out });

  const runInsert = async (withSoldOut: boolean) =>
    supabase
      .from("products")
      .insert(
        withSoldOut
          ? {
              ...payload,
              sold_out: soldOutValue,
            }
          : payload,
      )
      .select()
      .single();

  let response = await runInsert(true);

  if (response.error && /sold_out|column .*does not exist/i.test(response.error.message)) {
    response = await runInsert(false);
  }

  return response.error
    ? NextResponse.json({ error: response.error.message }, { status: 400 })
    : NextResponse.json(normalizeProduct(response.data as Record<string, unknown>));
}

export async function PATCH(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  const body = await request.json();
  const { id, soldOut, sold_out, ...changes } = body;
  const supabase = await createSupabaseServerClient();
  const soldOutValue = resolveSoldOutValue({ soldOut, sold_out });

  const runUpdate = async (withSoldOut: boolean) =>
    supabase
      .from("products")
      .update(
        withSoldOut
          ? {
              ...changes,
              sold_out: soldOutValue,
            }
          : changes,
      )
      .eq("id", id)
      .select()
      .single();

  let response = await runUpdate(true);

  if (response.error && /sold_out|column .*does not exist/i.test(response.error.message)) {
    response = await runUpdate(false);
  }

  return response.error
    ? NextResponse.json({ error: response.error.message }, { status: 400 })
    : NextResponse.json(normalizeProduct(response.data as Record<string, unknown>));
}

export async function DELETE(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  const { id } = await request.json();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("products").delete().eq("id", id);
  return error ? NextResponse.json({ error: error.message }, { status: 400 }) : NextResponse.json({ ok: true });
}