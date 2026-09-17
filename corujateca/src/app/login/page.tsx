"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import LoginForm from "@/components/LoginForm";
import { getSession } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    const session = getSession();

    if (session) {
      router.replace(session.role === "bibliotecario" ? "/bibliotecario/home" : "/frequentador/home");
    }
  }, [router]);

  return <LoginForm />;
}