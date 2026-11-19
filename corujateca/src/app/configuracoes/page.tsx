"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { getSession } from "@/lib/auth";

export default function Configuracoes() {
  const router = useRouter();

  useEffect(() => {
    const session = getSession();

    if (!session) {
      router.replace("/login");
      return;
    }

    if (session.role === "frequentador") {
      router.replace("/configuracoes/frequentador");
      return;
    }

    if (session.role === "bibliotecario") {
      router.replace("/configuracoes/bibliotecario");
      return;
    }
  }, [router]);

  return null;
}
