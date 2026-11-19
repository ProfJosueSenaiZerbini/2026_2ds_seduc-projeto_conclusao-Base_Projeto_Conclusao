"use client";

import Image from "next/image";
import { LogOut, Settings } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { clearSession } from "@/lib/auth";

type ProfileMenuProps = {
  nomeUsuario: string;
};

export default function ProfileMenu({ nomeUsuario }: ProfileMenuProps) {
  const [aberto, setAberto] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!aberto) return;

    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setAberto(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setAberto(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [aberto]);

  async function handleLogout() {
    setAberto(false);
    clearSession();
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  function handleConfiguracoes() {
    setAberto(false);
    router.push("/configuracoes");
  }

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setAberto((anterior) => !anterior)}
        aria-label="Abrir menu do perfil"
        aria-haspopup="menu"
        aria-expanded={aberto}
        className="group flex items-center gap-2 rounded-full p-1 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-300)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--brand-800)]"
      >
        <span className="flex shrink-0 rounded-full border-2 border-[var(--surface)] p-0.5 transition-colors duration-200 group-hover:border-[var(--brand-300)]">
          <Image
            className="size-9 rounded-full object-cover sm:size-10"
            src="/images/pfp.png"
            alt=""
            width={40}
            height={40}
          />
        </span>
      </button>

      {aberto && (
        <>
          {/* Backdrop apenas para telas muito pequenas, para fechar ao clicar fora facilmente */}
          <div
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm sm:hidden"
            onClick={() => setAberto(false)}
          />

          <div
            role="menu"
            aria-label="Menu do perfil"
            className="
              /* Mobile (320x360 até 640px): Vira um card fixado embaixo ou centralizado com margens seguras */
              fixed bottom-4 left-4 right-4 z-50 mx-auto w-auto max-w-[calc(100vw-2rem)]
              
              /* Desktop (sm em diante): Volta a ser o dropdown original */
              sm:absolute sm:bottom-auto sm:left-auto sm:right-0 sm:top-full sm:mt-3 sm:w-72
              
              overflow-visible rounded-xl border border-stone-200/80 bg-[var(--surface)] text-stone-700 shadow-xl shadow-black/10 
              animate-in fade-in slide-in-from-bottom-2 sm:slide-in-from-top-1 duration-150 
              
              /* Seta indicadora: Escondida no mobile, visível no desktop */
              before:hidden sm:before:block before:absolute before:-top-2 before:right-4 before:z-[-1] before:size-4 before:rotate-45 before:border-l before:border-t before:border-stone-200/80 before:bg-[var(--surface)] before:content-['']
            "
          >
            <div className="relative z-10 bg-[var(--surface)] rounded-xl overflow-hidden">
              <div className="border-b border-stone-100 px-4 py-3 sm:py-4">
                <p
                  className="truncate text-sm font-semibold text-[var(--text-primary)]"
                  title={nomeUsuario}
                >
                  {nomeUsuario}
                </p>
                <p className="mt-0.5 sm:mt-1 text-xs text-[var(--text-muted)]">
                  Minha conta
                </p>
              </div>

              <div className="p-1.5">
                <button
                  type="button"
                  role="menuitem"
                  onClick={handleConfiguracoes}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 sm:py-3 text-left text-sm transition-colors hover:bg-[var(--surface-hover)]/45 focus-visible:bg-[var(--surface-hover)] focus-visible:outline-none text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:cursor-pointer"
                >
                  <Settings size={18} className="shrink-0" aria-hidden="true" />
                  <span>Configurações de perfil</span>
                </button>

                <button
                  type="button"
                  role="menuitem"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 sm:py-3 text-left text-sm transition-colors hover:bg-[var(--color-horror)]/15 focus-visible:bg-[var(--status-danger)] focus-visible:outline-none text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:cursor-pointer"
                >
                  <LogOut size={18} className="shrink-0" aria-hidden="true" />
                  <span>Sair da conta</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
