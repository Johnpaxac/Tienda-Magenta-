export type AuthRole = "admin";

export type AuthProvider = "email";

export type AuthSession = {
  name: string;
  email: string;
  role: AuthRole;
  provider: AuthProvider;
};

