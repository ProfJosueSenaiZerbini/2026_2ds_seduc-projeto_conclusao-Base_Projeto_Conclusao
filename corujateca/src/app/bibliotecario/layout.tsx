import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { decodeSession, SESSION_COOKIE } from "@/lib/auth";
import Header from "@/components/Header";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

export default async function BibliotecarioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const sessionCookie = (await cookies()).get(SESSION_COOKIE)?.value;
  const session = sessionCookie ? decodeSession(sessionCookie) : null;

  if (session?.role !== "bibliotecario") {
    redirect("/login?error=acesso-negado");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex flex-1 items-stretch">
        <Nav />

        <div className="flex min-w-0 flex-1 flex-col">
          <Header />

          <main className="min-w-0 flex-1 p-4 sm:p-6 md:p-10">{children}</main>
        </div>
      </div>

      <Footer />
    </div>
  );
}
