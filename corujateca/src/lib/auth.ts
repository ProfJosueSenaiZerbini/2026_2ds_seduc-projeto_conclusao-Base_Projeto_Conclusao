export type UserRole = "bibliotecario" | "frequentador";

export type UserSession = {
  id: number;
  nome: string;
  role: UserRole;
};

export const SESSION_STORAGE_KEY = "corujateca_session";
export const SESSION_COOKIE = "corujateca_session";

export function encodeSession(session: UserSession): string {
  return Buffer.from(JSON.stringify(session), "utf8").toString("base64");
}

export function decodeSession(value: string): UserSession | null {
  try {
    const payload = JSON.parse(Buffer.from(value, "base64").toString("utf8"));

    if (
      typeof payload?.id === "number" &&
      typeof payload?.nome === "string" &&
      (payload?.role === "bibliotecario" || payload?.role === "frequentador")
    ) {
      return payload as UserSession;
    }
  } catch {
    return null;
  }

  return null;
}

export function getSession(): UserSession | null {
  if (typeof window === "undefined") {
    return null;
  }

  const stored = window.sessionStorage.getItem(SESSION_STORAGE_KEY);

  if (!stored) {
    return null;
  }

  return decodeSession(stored);
}

export function saveSession(session: UserSession): void {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(SESSION_STORAGE_KEY, encodeSession(session));
}

export function clearSession(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
}
