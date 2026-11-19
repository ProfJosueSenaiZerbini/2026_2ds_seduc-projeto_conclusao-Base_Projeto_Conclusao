"use client";

import { useEffect, useState } from "react";
import { getSession } from "@/lib/auth";
import ProfileMenu from "./ProfileMenu";

export default function Header() {
  const [nomeUsuario, setNomeUsuario] = useState("Visitante");

  useEffect(() => {
    const session = getSession();
    if (session?.nome) {
      setNomeUsuario(session.nome);
    }
  }, []);

  return (
    <header className="flex h-20 items-center justify-end bg-[var(--brand-800)] px-6">
      <ProfileMenu nomeUsuario={nomeUsuario} />
    </header>
  );
}
