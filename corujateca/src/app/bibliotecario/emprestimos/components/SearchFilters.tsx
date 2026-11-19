"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { ChevronDown, Search } from "lucide-react";

const campoClasse =
  "w-full min-w-0 rounded-[var(--radius-input)] border border-[var(--border-default)] bg-[var(--surface)] px-3 py-3 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-muted)] focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] disabled:cursor-not-allowed disabled:opacity-60 sm:px-4";

const botaoPrimario =
  "inline-flex min-h-11 min-w-0 hover:cursor-pointer items-center justify-center gap-2 rounded-[var(--radius-button)] bg-[var(--button-primary)] px-3 py-2.5 text-sm font-semibold text-[var(--text-inverse)] transition hover:bg-[var(--button-primary-hover)] focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)] disabled:cursor-not-allowed disabled:opacity-50 min-[375px]:px-4";

const botaoSecundario =
  "inline-flex min-h-11 min-w-0 hover:cursor-pointer items-center justify-center gap-2 rounded-[var(--radius-button)] border-2 border-[var(--border-default)] bg-[var(--surface)] px-2 py-2.5 text-sm font-semibold text-[var(--text-primary)] transition hover:bg-[var(--surface-hover)] focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)] disabled:cursor-not-allowed disabled:opacity-50 min-[375px]:px-3";
export default function SearchFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [status, setStatus] = useState(searchParams.get("status") ?? "");
  const [nome, setNome] = useState(searchParams.get("nome") ?? "");
  const [nomeLivro, setNomeLivro] = useState(searchParams.get("data") ?? "");
  const [data, setData] = useState(searchParams.get("dataFiltro") ?? "");

  function handleBuscar() {
    const params = new URLSearchParams(searchParams.toString());

    if (nome.trim()) {
      params.set("nome", nome.trim());
    } else {
      params.delete("nome");
    }

    // O parâmetro "data" continua reservado para o nome do livro.
    if (nomeLivro.trim()) {
      params.set("data", nomeLivro.trim());
    } else {
      params.delete("data");
    }

    // Um único campo de data para início OU término do empréstimo.
    if (data) {
      params.set("dataFiltro", data);
    } else {
      params.delete("dataFiltro");
    }

    // Remove os parâmetros antigos das duas datas.
    params.delete("dataEmprestimo");
    params.delete("dataExpiracao");

    if (status) {
      params.set("status", status);
    } else {
      params.delete("status");
    }

    params.delete("page");

    startTransition(() => {
      const query = params.toString();
      router.push(query ? `${pathname}?${query}` : pathname);
    });
  }

  function handleLimparFiltros() {
    setStatus("");
    setNome("");
    setNomeLivro("");
    setData("");

    startTransition(() => {
      router.push(pathname);
    });
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        handleBuscar();
      }}
      className="min-w-0 space-y-4"
    >
      <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="min-w-0">
          <label
            htmlFor="filtro-frequentador"
            className="mb-1.5 block text-sm font-semibold"
          >
            Nome do frequentador
          </label>
          <div className="flex min-w-0 items-center rounded-[var(--radius-input)] border border-[var(--border-default)] bg-[var(--surface)]">
            <Search
              size={18}
              aria-hidden="true"
              className="ml-3 shrink-0 text-[var(--text-muted)]"
            />
            <input
              id="filtro-frequentador"
              type="search"
              placeholder="Digite o nome do frequentador..."
              value={nome}
              onChange={(event) => setNome(event.target.value)}
              className="min-w-0 flex-1 bg-transparent px-3 py-3 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)] sm:px-4"
            />
          </div>
        </div>

        <div className="min-w-0">
          <label
            htmlFor="filtro-livro"
            className="mb-1.5 block text-sm font-semibold"
          >
            Título do livro
          </label>
          <div className="flex min-w-0 items-center rounded-[var(--radius-input)] border border-[var(--border-default)] bg-[var(--surface)]">
            <Search
              size={18}
              aria-hidden="true"
              className="ml-3 shrink-0 text-[var(--text-muted)]"
            />
            <input
              id="filtro-livro"
              type="search"
              placeholder="Digite o título do livro..."
              value={nomeLivro}
              onChange={(event) => setNomeLivro(event.target.value)}
              className="min-w-0 flex-1 bg-transparent px-3 py-3 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)] sm:px-4"
            />
          </div>
        </div>

        <div className="min-w-0">
          <label
            htmlFor="filtro-data-emprestimo"
            className="mb-1.5 block text-sm font-semibold"
          >
            Data de início ou devolução
          </label>
          <input
            id="filtro-data-emprestimo"
            type="date"
            title="Busca pela data de início ou devolução prevista"
            value={data}
            onChange={(event) => setData(event.target.value)}
            className={campoClasse}
          />
        </div>

        <div className="min-w-0">
          <label
            htmlFor="filtro-status-emprestimo"
            className="mb-1.5 block text-sm font-semibold"
          >
            Status
          </label>
          <div className="relative min-w-0">
            <ChevronDown
              aria-hidden="true"
              className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]"
            />
            <select
              id="filtro-status-emprestimo"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className={`${campoClasse} cursor-pointer appearance-none pr-10`}
            >
              <option value="">Todos os status</option>
              <option value="Em andamento">Em andamento</option>
              <option value="Atrasado">Atrasado</option>
              <option value="Devolvido no prazo">Devolvido no prazo</option>
              <option value="Devolvido com atraso">Devolvido com atraso</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex min-w-0 gap-2">
        <button
          type="submit"
          disabled={isPending}
          className={`${botaoPrimario} flex-[8]`}
        >
          <Search size={17} aria-hidden="true" />
          {isPending ? "Buscando..." : "Pesquisar"}
        </button>

        <button
          type="button"
          disabled={isPending}
          onClick={handleLimparFiltros}
          className={`${botaoSecundario} flex-[2] whitespace-normal px-1 text-center leading-tight`}
        >
          Limpar filtros
        </button>
      </div>
    </form>
  );
}
