import { NextResponse } from "next/server";

export async function POST(request: Request) {
  void request;
  return NextResponse.json(
    { error: "El acceso de Google no está habilitado. Ingresá como administrador." },
    { status: 403 },
  );
}