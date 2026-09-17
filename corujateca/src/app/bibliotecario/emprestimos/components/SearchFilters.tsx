"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { ChevronDown } from "lucide-react";

export default function SearchFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Inicializa o estado local com o que já está na URL (bom para F5/Reload)
  const [status, setStatus] = useState(searchParams.get("status") ?? "");
  const [nome, setNome] = useState(searchParams.get("nome") ?? "");
  const [data, setData] = useState(searchParams.get("data") ?? "");
  
  // ADICIONADO: Estados para gerenciar as duas novas datas independentes
  const [dataEmprestimo, setDataEmprestimo] = useState(searchParams.get("dataEmprestimo") ?? "");
  const [dataExpiracao, setDataExpiracao] = useState(searchParams.get("dataExpiracao") ?? "");

  function handleBuscar() {
    const params = new URLSearchParams(searchParams.toString());

    // Atualiza ou remove o parâmetro 'nome'
    if (nome.trim()) {
      params.set("nome", nome.trim());
    } else {
      params.delete("nome");
    }

    // Atualiza ou remove o parâmetro 'data' (Nome do Livro)
    if (data) {
      params.set("data", data);
    } else {
      params.delete("data");
    }

    // ADICIONADO: Atualiza ou remove o parâmetro 'dataEmprestimo'
    if (dataEmprestimo) {
      params.set("dataEmprestimo", dataEmprestimo);
    } else {
      params.delete("dataEmprestimo");
    }

    // ADICIONADO: Atualiza ou remove o parâmetro 'dataExpiracao'
    if (dataExpiracao) {
      params.set("dataExpiracao", dataExpiracao);
    } else {
      params.delete("dataExpiracao");
    }

    // Atualiza ou remove o parâmetro 'status'
    if (status) {
      params.set("status", status);
    } else {
      params.delete("status");
    }

    // Reseta a paginação ao aplicar um novo filtro
    params.delete("page");

    // Executa a transição de rota de forma suave
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  return (
    <div className="flex flex-col gap-3 relative">
      {/* Input de nome */}
      <input
        type="text"
        placeholder="Buscar por nome..."
        value={nome}
        onChange={(e) => setNome(e.target.value)}
        className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-2 text-brand-600 outline-none focus:ring-2 focus:ring-brand-500"
      />

      {/* Input de data antiga reaproveitada como Nome do livro conforme regras anteriores */}
      <input
        type="text"
        placeholder="Buscar por nome do livro..."
        value={data}
        onChange={(e) => setData(e.target.value)}
        className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-2 text-brand-600 outline-none focus:ring-2 focus:ring-brand-500"
      />

      {/* Filtros lado a lado modificados para comportar as duas datas e o status */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        
        {/* ADICIONADO: Filtro por data de Empréstimo */}
        <input
          type="text"
          placeholder="Por data (Empréstimo)"
          value={dataEmprestimo}
          onChange={(e) => setDataEmprestimo(e.target.value)}
          onFocus={(e) => (e.target.type = "date")}
          onBlur={(e) => {
            if (!e.target.value) {
              e.target.type = "text";
            }
          }}
          className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-2 text-brand-600 outline-none focus:ring-2 focus:ring-brand-500"
        />

        {/* ADICIONADO: Filtro por data de Expiração */}
        <input
          type="text"
          placeholder="Por data (Expiração)"
          value={dataExpiracao}
          onChange={(e) => setDataExpiracao(e.target.value)}
          onFocus={(e) => (e.target.type = "date")}
          onBlur={(e) => {
            if (!e.target.value) {
              e.target.type = "text";
            }
          }}
          className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-2 text-brand-600 outline-none focus:ring-2 focus:ring-brand-500"
        />

        {/* Filtro por status (Mantido idêntico com as strings corrigidas das regras anteriores) */}
        <div className="relative flex items-center">
          <ChevronDown
            aria-hidden="true"
            className="pointer-events-none absolute right-4 h-4 w-4 text-brand-600/70"
          />

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className={`w-full appearance-none rounded-2xl border border-gray-300 bg-white px-4 pr-10 py-2 outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer ${
              status === "" ? "text-brand-600/50" : "text-brand-600"
            }`}
          >
            <option value="">Por Status</option>
            <option value="Em andamento">Em andamento</option>
            <option value="Atrasado">Atrasado</option>
            <option value="Devolvido no prazo">Devolvido no prazo</option>
            <option value="Devolvido com atraso">Devolvido com atraso</option>
          </select>
        </div>
      </div>

      {/* Botão de busca */}
      <button
        type="button"
        disabled={isPending}
        onClick={handleBuscar}
        className="rounded-xl bg-brand-500 px-4 py-2.5 text-white hover:bg-brand-600 disabled:opacity-50 transition-opacity"
      >
        {isPending ? "Buscando..." : "Buscar Empréstimos"}
      </button>
    </div>
  );
}
