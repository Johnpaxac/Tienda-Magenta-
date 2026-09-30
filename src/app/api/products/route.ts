import { NextResponse } from "next/server";
import { getAdminUser } from "@/backend/neon-auth";
import { sql } from "@/backend/neon";

function normalizeProduct(product: Record<string, unknown>) {
  const stockQuantity = Number(product.stock_quantity ?? product.stockQuantity ?? 0);

  return {
    ...product,
    price: Number(product.price),
    stockQuantity,
    soldOut: stockQuantity === 0 || Boolean(product.soldOut ?? product.sold_out ?? false),
  };
}

function resolveStockValue(input: Record<string, unknown>) {
  return Math.max(0, Number(input.stockQuantity ?? input.stock_quantity ?? 0));
}

export async function GET() {
  try {
    const data = await sql`
      select id, name, description, price, category, image, featured, sold_out, stock_quantity
      from products
      order by featured desc, name asc
    `;

    return NextResponse.json(data.map((product) => normalizeProduct(product as Record<string, unknown>)));
  } catch {
    return NextResponse.json({ error: "Neon no está configurado o no responde." }, { status: 500 });
  }
}

async function requireAdmin() {
  return getAdminUser();
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  const payload = await request.json();
  const stockValue = resolveStockValue(payload);
  const soldOutValue = stockValue === 0;

  try {
    const [product] = await sql`
      insert into products (name, description, price, category, image, featured, sold_out, stock_quantity)
      values (${payload.name}, ${payload.description}, ${Number(payload.price)}, ${payload.category}, ${payload.image ?? ""}, ${Boolean(payload.featured)}, ${soldOutValue}, ${stockValue})
      returning id, name, description, price, category, image, featured, sold_out, stock_quantity
    `;

    return NextResponse.json(normalizeProduct(product as Record<string, unknown>));
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo crear el producto.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  const body = await request.json();
  const { id, ...changes } = body;
  const stockValue = resolveStockValue(changes);
  const soldOutValue = stockValue === 0;

  try {
    const [product] = await sql`
      update products
      set name = ${changes.name},
          description = ${changes.description},
          price = ${Number(changes.price)},
          category = ${changes.category},
          image = ${changes.image ?? ""},
          featured = ${Boolean(changes.featured)},
            sold_out = ${soldOutValue},
            stock_quantity = ${stockValue}
      where id = ${Number(id)}
          returning id, name, description, price, category, image, featured, sold_out, stock_quantity
    `;

    if (!product) return NextResponse.json({ error: "Producto no encontrado." }, { status: 404 });
    return NextResponse.json(normalizeProduct(product as Record<string, unknown>));
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo actualizar el producto.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  const { id } = await request.json();

  try {
    await sql`delete from products where id = ${Number(id)}`;
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo eliminar el producto.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}