import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { decodeSession, SESSION_COOKIE } from "@/lib/auth";

export default async function FrequentadorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const sessionCookie = (await cookies()).get(SESSION_COOKIE)?.value;
  const session = sessionCookie ? decodeSession(sessionCookie) : null;

  if (session?.role !== "frequentador") {
    redirect("/login?error=acesso-negado");
  }

  return <>{children}</>;
}
