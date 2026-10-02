"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [notice, setNotice] = useState("Ingresá con la cuenta de administrador.");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setEmail("");
    setPassword("");
    setNotice("Ingresá con la cuenta de administrador.");
    setLoading(false);
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const result = (await response.json()) as { error?: string };

    if (!response.ok) {
      setNotice(result.error ?? "No se pudo iniciar sesión.");
      setLoading(false);
      return;
    }

    router.push("/admin/panel");
  }

  return (
    <main className="soft-scrollbar relative flex-1 overflow-hidden text-[#5b0c3d]">
      <div className="absolute inset-0 -z-10 opacity-75">
        <div className="absolute left-[-5rem] top-[-4rem] h-72 w-72 rounded-full bg-[#f6a3d0] blur-3xl" />
        <div className="absolute right-[-3rem] top-40 h-64 w-64 rounded-full bg-[#ffdeec] blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-[#d41478]/20 blur-3xl" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#d41478]/30 to-transparent" />
      </div>

      <section className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-between gap-8 px-4 py-6 lg:px-8 lg:py-8">
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full">
            <h1 className="heading-font text-center text-6xl leading-[0.85] text-[#d41478] sm:text-7xl lg:text-[7rem]">
              Magenta
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-center text-sm leading-7 text-[#7d345a] sm:text-base lg:text-lg">
              Iniciá sesión para entrar al catálogo.
            </p>

            <div className="glass mx-auto mt-8 rounded-[2.25rem] p-5 shadow-[0_24px_90px_rgba(146,18,88,0.1)] lg:p-7">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[0.7rem] font-bold uppercase tracking-[0.3em] text-[#a4547b]">
                    Acceso
                  </p>
                  <h2 className="heading-font text-3xl text-[#d41478]">Ingresar como administrador</h2>
                </div>
              </div>

              <form className="mt-5 space-y-3" onSubmit={handleSubmit}>
                <label className="block">
                  <span className="mb-2 block text-xs font-bold uppercase tracking-[0.22em] text-[#a4547b]">
                    Email
                  </span>
                  <input
                    type="email"
                    name="username"
                    autoComplete="off"
                    spellCheck={false}
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="w-full rounded-2xl border border-[#d41478]/15 bg-white/80 px-4 py-3 text-sm outline-none"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-xs font-bold uppercase tracking-[0.22em] text-[#a4547b]">
                    Contraseña
                  </span>
                  <input
                    type="password"
                    name="password"
                    autoComplete="new-password"
                    spellCheck={false}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="w-full rounded-2xl border border-[#d41478]/15 bg-white/80 px-4 py-3 text-sm outline-none"
                  />
                </label>

                <button
                  type="submit"
                  className="w-full rounded-full bg-[#d41478] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#b20b5f]"
                >
                  {loading ? "Ingresando..." : "Entrar al panel admin"}
                </button>
              </form>

              <div className="mt-4 rounded-2xl bg-white/75 p-4 text-sm text-[#7b4d68]">
                <p className="font-semibold text-[#b20b5f]">Acceso privado</p>
                <p className="mt-1">El catálogo público está disponible sin iniciar sesión.</p>
              </div>
            </div>
          </div>
        </div>

      </section>
    </main>
  );
}
