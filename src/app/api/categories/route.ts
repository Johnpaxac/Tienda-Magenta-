import { NextResponse } from "next/server";
import { getAdminUser } from "@/backend/neon-auth";
import { sql } from "@/backend/neon";

export async function GET() {
  try {
    const data = await sql`
      select name, image
      from categories
      order by name
    `;

    return NextResponse.json(data);
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

    const image = String(body?.image ?? "");
    const [category] = await sql`
      insert into categories (name, image)
      values (${name}, ${image})
      on conflict (name) do update set image = excluded.image
      returning name, image
    `;

    return NextResponse.json({ name: category.name, image: category.image ?? "" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo guardar la categoría.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "No autorizado." }, { status: 403 });

  try {
    const body = await request.json();
    const oldName = String(body?.oldName ?? "").trim();
    const name = String(body?.name ?? "").trim().replace(/\s+/g, " ");
    const image = String(body?.image ?? "");

    if (!oldName || !name) {
      return NextResponse.json({ error: "Falta el nombre de la categoría." }, { status: 400 });
    }

    if (oldName !== name) {
      const [existing] = await sql`select name from categories where name = ${name}`;
      if (existing) return NextResponse.json({ error: "Ya existe una categoría con ese nombre." }, { status: 409 });
    }

    const [category] = await sql`
      update categories
      set name = ${name}, image = ${image}
      where name = ${oldName}
      returning name, image
    `;

    if (!category) return NextResponse.json({ error: "Categoría no encontrada." }, { status: 404 });
    if (oldName !== name) {
      await sql`update products set category = ${name} where category = ${oldName}`;
    }

    return NextResponse.json({ name: category.name, image: category.image ?? "" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo editar la categoría.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "No autorizado." }, { status: 403 });

  try {
    const body = await request.json();
    const name = String(body?.name ?? "").trim();

    if (!name) return NextResponse.json({ error: "Falta el nombre de la categoría." }, { status: 400 });

    const [{ count }] = await sql`
      select count(*)::int as count
      from products
      where category = ${name}
    `;

    if (Number(count) > 0) {
      return NextResponse.json(
        { error: "No se puede borrar una categoría que todavía tiene productos." },
        { status: 409 },
      );
    }

    const result = await sql`delete from categories where name = ${name} returning name`;
    if (!result.length) return NextResponse.json({ error: "Categoría no encontrada." }, { status: 404 });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo eliminar la categoría.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
