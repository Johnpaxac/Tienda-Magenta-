"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ACCOUNTS_STORAGE_KEY,
  DEMO_ACCOUNTS,
  SESSION_STORAGE_KEY,
  type AuthSession,
  type StoredAccount,
} from "@/back/auth";

type Mode = "login" | "signup";

const EMPTY_FORM = {
  name: "",
  email: "",
  password: "",
};

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [loaded, setLoaded] = useState(false);
  const [accounts, setAccounts] = useState<StoredAccount[]>(DEMO_ACCOUNTS);
  const [form, setForm] = useState(EMPTY_FORM);
  const [notice, setNotice] = useState("Ingresá o creá tu cuenta para ver el catálogo.");

  useEffect(() => {
    try {
      const storedSession = localStorage.getItem(SESSION_STORAGE_KEY);
      const storedAccounts = localStorage.getItem(ACCOUNTS_STORAGE_KEY);

      queueMicrotask(() => {
        if (storedAccounts) {
          setAccounts(JSON.parse(storedAccounts));
        }

        if (storedSession) {
          const session = JSON.parse(storedSession) as AuthSession;
          router.replace(session.role === "admin" ? "/admin" : "/catalogo");
          return;
        }

        setLoaded(true);
      });
    } catch {
      queueMicrotask(() => setLoaded(true));
    }
  }, [router]);

  useEffect(() => {
    if (!loaded) {
      return;
    }

    localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
  }, [accounts, loaded]);

  function saveSession(account: StoredAccount) {
    const session: AuthSession = {
      name: account.name,
      email: account.email,
      role: account.role,
      provider: "email",
    };

    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    router.push(session.role === "admin" ? "/admin" : "/catalogo");
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const email = normalizeEmail(form.email);

    if (mode === "signup") {
      if (!form.name.trim() || !email || !form.password.trim()) {
        setNotice("Completá nombre, email y contraseña.");
        return;
      }

      if (accounts.some((account) => account.email === email)) {
        setNotice("Ese email ya está registrado. Probá iniciar sesión.");
        return;
      }

      const nextAccount: StoredAccount = {
        name: form.name.trim(),
        email,
        password: form.password,
        role: "user",
        provider: "email",
      };

      setAccounts((currentAccounts) => [...currentAccounts, nextAccount]);
      saveSession(nextAccount);
      return;
    }

    const matchedAccount = accounts.find(
      (account) => account.email === email && account.password === form.password,
    );

    if (!matchedAccount) {
      setNotice("Email o contraseña incorrectos.");
      return;
    }

    saveSession(matchedAccount);
  }

  function continueAsGuest() {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    router.push("/catalogo");
  }

  if (!loaded) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-7xl items-center justify-center px-4 py-10 text-[#5b0c3d]">
        <div className="glass rounded-[2rem] px-6 py-5 text-sm font-medium uppercase tracking-[0.25em] text-[#b20b5f]">
          Cargando Magenta...
        </div>
      </main>
    );
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
                  <h2 className="heading-font text-3xl text-[#d41478]">
                    {mode === "login" ? "Ingresar" : "Crear cuenta"}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setMode(mode === "login" ? "signup" : "login")}
                  className="rounded-full border border-[#d41478]/20 px-4 py-2 text-sm font-semibold text-[#b20b5f]"
                >
                  {mode === "login" ? "Crear cuenta" : "Ya tengo cuenta"}
                </button>
              </div>

              <div className="mt-4 rounded-2xl bg-[#ffd2e7] p-4 text-sm text-[#7f124d]">
                {notice}
              </div>

              <form className="mt-5 space-y-3" onSubmit={handleSubmit}>
                {mode === "signup" ? (
                  <label className="block">
                    <span className="mb-2 block text-xs font-bold uppercase tracking-[0.22em] text-[#a4547b]">
                      Nombre
                    </span>
                    <input
                      value={form.name}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, name: event.target.value }))
                      }
                      className="w-full rounded-2xl border border-[#d41478]/15 bg-white/80 px-4 py-3 text-sm outline-none"
                    />
                  </label>
                ) : null}

                <label className="block">
                  <span className="mb-2 block text-xs font-bold uppercase tracking-[0.22em] text-[#a4547b]">
                    Email
                  </span>
                  <input
                    value={form.email}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, email: event.target.value }))
                    }
                    className="w-full rounded-2xl border border-[#d41478]/15 bg-white/80 px-4 py-3 text-sm outline-none"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-xs font-bold uppercase tracking-[0.22em] text-[#a4547b]">
                    Contraseña
                  </span>
                  <input
                    type="password"
                    value={form.password}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, password: event.target.value }))
                    }
                    className="w-full rounded-2xl border border-[#d41478]/15 bg-white/80 px-4 py-3 text-sm outline-none"
                  />
                </label>

                <button
                  type="submit"
                  className="w-full rounded-full bg-[#d41478] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#b20b5f]"
                >
                  {mode === "login" ? "Entrar al catálogo" : "Crear cuenta y entrar"}
                </button>
              </form>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={continueAsGuest}
                  className="rounded-full border border-[#d41478]/20 px-5 py-3 text-sm font-semibold text-[#b20b5f] transition hover:bg-white"
                >
                  Continuar como invitado
                </button>
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className="rounded-full border border-[#d41478]/20 px-5 py-3 text-sm font-semibold text-[#b20b5f] transition hover:bg-white"
                >
                  Ir a login
                </button>
              </div>

              <div className="mt-4 rounded-2xl bg-white/75 p-4 text-sm text-[#7b4d68]">
                <p className="font-semibold text-[#b20b5f]">Acceso</p>
                <p className="mt-1">Ingresá con email y contraseña, o entrá como invitado.</p>
              </div>
            </div>
          </div>
        </div>

        <footer className="glass rounded-[1.75rem] px-5 py-4 text-center text-sm text-[#7b4d68]">
          Datos de contacto y pie de página pendientes. Acá después van tus enlaces, redes o texto final.
        </footer>

      </section>
    </main>
  );
}
