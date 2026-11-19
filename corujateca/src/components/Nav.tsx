"use client";

import { useEffect, useState } from "react";

import { getSession, UserSession } from "@/lib/auth";

import NavBibliotecario from "./NavBibliotecario";
import NavFrequentador from "./NavFrequentador";

export default function Nav() {
  const [session, setSession] = useState<UserSession | null>(null);

  useEffect(() => {
    setSession(getSession());
  }, []);

  if (session?.role === "frequentador") {
    return <NavFrequentador />;
  }

  if (session?.role === "bibliotecario") {
    return <NavBibliotecario />;
  }

  return null;
}