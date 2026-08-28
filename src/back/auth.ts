export type AuthRole = "user" | "admin";

export type AuthProvider = "email";

export type AuthSession = {
  name: string;
  email: string;
  role: AuthRole;
  provider: AuthProvider;
};

export type StoredAccount = {
  name: string;
  email: string;
  password?: string;
  role: AuthRole;
  provider: AuthProvider;
};

export const SESSION_STORAGE_KEY = "magenta-session";
export const ACCOUNTS_STORAGE_KEY = "magenta-accounts";

export const DEMO_ACCOUNTS: StoredAccount[] = [
  {
    name: "Administradora",
    email: "admin@magenta.com",
    password: "magenta123",
    role: "admin",
    provider: "email",
  },
  {
    name: "Clienta demo",
    email: "cliente@magenta.com",
    password: "magenta123",
    role: "user",
    provider: "email",
  },
];
