"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

const campoClasse =
  "w-full min-w-0 rounded-[var(--radius-input)] border border-[var(--border-default)] bg-[var(--surface)] px-3 py-3 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-muted)] focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] disabled:cursor-not-allowed disabled:opacity-60";

const botaoPrimario =
  "inline-flex min-h-11 w-full min-w-0 items-center justify-center gap-2 rounded-[var(--radius-button)] bg-[var(--button-primary)] px-4 py-2.5 text-sm font-semibold text-[var(--text-inverse)] transition hover:bg-[var(--button-primary-hover)] focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)] disabled:cursor-not-allowed disabled:opacity-50";

type Frequentador = {
  id_freq: number;
  nome_freq: string;
};

type ExemplarDisponivel = {
  id_exemplar: number;
  livro: { titulo_livro: string };
};

export default function CreateEmprestimoForm({
  frequentadores,
  exemplaresDisponiveis,
}: {
  frequentadores: Frequentador[];
  exemplaresDisponiveis: ExemplarDisponivel[];
}) {
  const router = useRouter();
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErro(null);
    setEnviando(true);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const frequentador = String(formData.get("fk_frequentador_id_freq") ?? "");
    const exemplar = String(formData.get("fk_exemplar_id_exemplar") ?? "");
    const senha = String(formData.get("senha") ?? "").trim();
    const prazoDias = String(formData.get("prazo_dias") ?? "");

    if (!frequentador) {
      setErro("Selecione o frequentador.");
      setEnviando(false);
      return;
    }

    if (!exemplar) {
      setErro("Selecione o exemplar.");
      setEnviando(false);
      return;
    }

    if (!senha) {
      setErro("Informe a senha do frequentador.");
      setEnviando(false);
      return;
    }

    if (!prazoDias) {
      setErro("Informe a quantidade de dias do empréstimo.");
      setEnviando(false);
      return;
    }

    try {
      const response = await fetch("/api/emprestimos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fk_frequentador_id_freq: frequentador,
          fk_exemplar_id_exemplar: exemplar,
          prazo_dias: prazoDias,
          senha,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        setErro(data?.error ?? "Erro ao criar empréstimo.");
        return;
      }

      form.reset();
      router.refresh();
    } catch {
      setErro("Não foi possível conectar ao servidor.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <section className="mb-6 min-w-0 rounded-[var(--radius-card)] border border-[var(--border-default)] bg-[var(--surface)] p-4 shadow-[var(--shadow-card)] sm:p-6">
      <h2 className="text-lg font-bold sm:text-xl">Criar empréstimo</h2>
      <p className="mt-1 mb-5 text-sm leading-relaxed text-[var(--text-secondary)]">
        Cada frequentador pode manter até 2 empréstimos ativos por vez.
      </p>

      {erro && (
        <p
          role="alert"
          className="mb-4 rounded-md border-none bg-[var(--status-danger)]/5 p-3 text-sm text-[var(--status-danger)]"
        >
          {erro}
        </p>
      )}

      <form onSubmit={handleSubmit} className="grid min-w-0 gap-4 sm:grid-cols-2">
        <div className="min-w-0">
          <label
            htmlFor="frequentador-emprestimo"
            className="mb-1.5 block text-sm font-semibold"
          >
            Frequentador
          </label>
          <select
            id="frequentador-emprestimo"
            name="fk_frequentador_id_freq"
            defaultValue=""
            className={campoClasse}
            required
          >
            <option value="" disabled>
              Selecione o frequentador
            </option>
            {frequentadores.map((frequentador) => (
              <option key={frequentador.id_freq} value={frequentador.id_freq}>
                {frequentador.nome_freq}
              </option>
            ))}
          </select>
        </div>

        <div className="min-w-0">
          <label
            htmlFor="exemplar-emprestimo"
            className="mb-1.5 block text-sm font-semibold"
          >
            Exemplar
          </label>
          <select
            id="exemplar-emprestimo"
            name="fk_exemplar_id_exemplar"
            defaultValue=""
            className={campoClasse}
            required
          >
            <option value="" disabled>
              Selecione o exemplar
            </option>
            {exemplaresDisponiveis.map((exemplar) => (
              <option key={exemplar.id_exemplar} value={exemplar.id_exemplar}>
                {exemplar.livro.titulo_livro}
              </option>
            ))}
          </select>
        </div>

        <div className="min-w-0">
          <label
            htmlFor="prazo-emprestimo"
            className="mb-1.5 block text-sm font-semibold"
          >
            Prazo do empréstimo
          </label>
          <select
            id="prazo-emprestimo"
            name="prazo_dias"
            defaultValue=""
            className={campoClasse}
            required
          >
            <option value="" disabled>
              Selecione o prazo
            </option>
            <option value="7">7 dias</option>
            <option value="15">15 dias</option>
            <option value="30">30 dias</option>
          </select>
        </div>

        <div className="min-w-0">
          <label
            htmlFor="senha-frequentador"
            className="mb-1.5 block text-sm font-semibold"
          >
            Senha do frequentador
          </label>
          <input
            id="senha-frequentador"
            type="password"
            name="senha"
            placeholder="Informe a senha"
            autoComplete="current-password"
            required
            className={campoClasse}
          />
        </div>

        <div className="border-t border-[var(--border-default)] pt-4 sm:col-span-2">
          <button type="submit" disabled={enviando} className={botaoPrimario}>
            {enviando ? "Criando..." : "Criar empréstimo"}
          </button>
        </div>
      </form>
    </section>
  );
}
