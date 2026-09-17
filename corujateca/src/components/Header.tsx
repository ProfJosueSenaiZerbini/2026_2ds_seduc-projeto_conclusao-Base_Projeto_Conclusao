"use client";

import Image from "next/image";
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
    <header className="flex h-32 items-center justify-between bg-[var(--brand-800)] px-6">
      <Image
        src="/images/logo_corujateca.png"
        alt="Corujateca: Logo do projeto."
        width={140}
        height={140}
        className="ml-9"
      />

      <ProfileMenu nomeUsuario={nomeUsuario} />
    </header>
  );
}
