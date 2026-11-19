"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { AlertCircle, ArrowLeft, LoaderCircle } from "lucide-react";

type Livro = {
  id_livro: number;
  titulo_livro?: string;
  titulo?: string;
  autor_livro?: string;
  autor?: string;
  genero_livro?: string;
  genero?: string;
  cor_genero?: string | null;
  editora_livro?: string;
  editora?: string;
  anopub_livro?: number;
  ano_publicacao?: number;
  ano?: number;
  copias_disponiveis?: number;
  qtd_copias?: number;
  copias?: number;
  status_livro?: string;
  status?: string;
  localizacao_livro?: string;
  localizacao?: string;
  sinopse_livro?: string;
  sinopse?: string;
  imgcapa_livro?: string | null;
  capa?: string | null;
};

type PageProps = {
  params: Promise<{ id: string }>;
};

const coresGenero: Record<string, string> = {
  romance: "var(--color-romance)",
  religião: "var(--color-religion-mythology)",
  religiao: "var(--color-religion-mythology)",
  mitologia: "var(--color-religion-mythology)",
  "religião e mitologia": "var(--color-religion-mythology)",
  "religiao e mitologia": "var(--color-religion-mythology)",
  ficção: "var(--color-fiction)",
  ficcao: "var(--color-fiction)",
  "arte e cultura": "var(--color-art-culture)",
  fantasia: "var(--color-fantasy)",
  biografias: "var(--color-biographies-memoirs)",
  memórias: "var(--color-biographies-memoirs)",
  memorias: "var(--color-biographies-memoirs)",
  "biografias e memórias": "var(--color-biographies-memoirs)",
  "biografias e memorias": "var(--color-biographies-memoirs)",
  thriller: "var(--color-thriller-mystery)",
  mistério: "var(--color-thriller-mystery)",
  misterio: "var(--color-thriller-mystery)",
  "thriller e mistério": "var(--color-thriller-mystery)",
  "thriller e misterio": "var(--color-thriller-mystery)",
  "quadrinhos e mangá": "var(--color-comics-manga)",
  "quadrinhos e manga": "var(--color-comics-manga)",
  terror: "var(--color-horror)",
  infantojuvenil: "var(--color-children-young-adult)",
  aventura: "var(--color-adventure)",
  "ciência e conhecimento": "var(--color-science-knowledge)",
  "ciencia e conhecimento": "var(--color-science-knowledge)",
  "poesia e crônicas": "var(--color-poetry-chronicles)",
  "poesia e cronicas": "var(--color-poetry-chronicles)",
  história: "var(--color-history)",
  historia: "var(--color-history)",
  "guia, manual e gastronomia": "var(--color-guide-manual-gastronomy)",
  política: "var(--color-politics)",
  politica: "var(--color-politics)",
  "autoajuda e desenvolvimento pessoal":
    "var(--color-selfHelp-personal-development)",
  economia: "var(--color-economy)",
  literatura: "var(--color-literature)",
};

export default function DetalhesLivroFrequentadorPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const id = resolvedParams?.id;

  const [livro, setLivro] = useState<Livro | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    async function carregarLivro() {
      if (!id) return;

      try {
        setCarregando(true);
        setErro("");

        const res = await fetch(`/api/livros/${id}`);
        if (!res.ok) {
          throw new Error("Erro ao buscar informações do livro.");
        }

        const dados = await res.json();
        const livroDados = dados.livro || dados;
        setLivro(livroDados);
      } catch (err) {
        console.error("Erro na requisição do livro:", err);
        setErro("Não foi possível carregar os dados deste livro.");
      } finally {
        setCarregando(false);
      }
    }

    carregarLivro();
  }, [id]);

  const titulo = livro?.titulo_livro || livro?.titulo;
  const autor = livro?.autor_livro || livro?.autor;
  const genero = livro?.genero_livro || livro?.genero;
  const editora = livro?.editora_livro || livro?.editora;
  const ano = livro?.anopub_livro || livro?.ano_publicacao || livro?.ano;
  const copiasTotais = livro?.qtd_copias ?? 0;
  const copiasDisponiveis = livro?.copias_disponiveis ?? 0;
  const status = livro?.status_livro || livro?.status;
  const localizacao = livro?.localizacao_livro || livro?.localizacao;
  const sinopse = livro?.sinopse_livro || livro?.sinopse;
  const capa = livro?.imgcapa_livro || livro?.capa;

  const generoChave = genero?.trim().toLowerCase() ?? "";
  const corGenero =
    livro?.cor_genero || coresGenero[generoChave] || "var(--color-brand-500)";

  return (
    <>
      <main className="mx-auto w-full max-w-5xl min-w-0">
        <div className="space-y-6 rounded-[var(--radius-card)] border border-[var(--border-default)] bg-[var(--surface)] p-4 text-[var(--text-primary)] shadow-[var(--shadow-card)] sm:p-6 lg:p-8">
          <div>
                  <Link
                    href="/frequentador/acervo"
                    className="inline-flex min-h-10 items-center gap-2 rounded-[var(--radius-button)] px-3 text-sm font-semibold text-[var(--brand-700)] transition hover:bg-[var(--surface-hover)] focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)]"
                  >
                    <ArrowLeft size={17} aria-hidden="true" />
                    Voltar ao acervo
                  </Link>
          </div>

                {carregando ? (
                  <div
                    className="space-y-4 py-10"
                    role="status"
                    aria-live="polite"
                  >
                    <LoaderCircle
                      size={28}
                      className="mx-auto animate-spin text-[var(--brand-500)]"
                      aria-hidden="true"
                    />
                    <p className="text-center text-sm text-[var(--text-muted)]">
                      Carregando informações do livro...
                    </p>
                  </div>
                ) : erro ? (
                  <div
                    role="alert"
                    className="flex items-start gap-3 rounded-[var(--radius-card)] bg-[var(--status-danger)]/10 p-4 text-sm font-medium text-[var(--status-danger)]"
                  >
                    <AlertCircle
                      size={20}
                      className="shrink-0"
                      aria-hidden="true"
                    />
                    <p>{erro}</p>
                  </div>
                ) : livro ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 items-start gap-8 md:grid-cols-12">
                      <div className="flex flex-col items-center gap-3 md:col-span-5">
                        <div className="flex aspect-[3/4] w-full items-center justify-center overflow-hidden rounded-[var(--radius-card)] border border-[var(--border-default)] bg-[var(--surface-warm)]">
                          {capa ? (
                            <img
                              src={capa}
                              alt={titulo || "Capa do livro"}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span className="font-medium text-[var(--text-muted)]">
                              Sem Capa
                            </span>
                          )}
                        </div>

                        <div className="w-full rounded-full bg-[var(--brand-400)] px-4 py-2 text-center text-xs font-semibold uppercase tracking-wide text-[var(--text-inverse)]">
                          {status || "Disponível"}
                        </div>
                      </div>

                      <div className="flex flex-col justify-between space-y-5 md:col-span-7">
                        <div>
                          <h1 className="mb-2 text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:text-3xl">
                            {titulo || "Título Indefinido"}
                          </h1>

                          {genero && (
                            <span
                              style={{ backgroundColor: corGenero }}
                              className="mb-4 inline-block rounded-full px-3 py-1.5 text-xs font-semibold uppercase leading-none text-[var(--text-primary)]"
                            >
                              {genero}
                            </span>
                          )}

                          <div className="space-y-2 rounded-[var(--radius-card)] bg-[var(--surface-hover)] p-4 text-sm text-[var(--text-secondary)] sm:text-base">
                            <p>
                              <span className="font-semibold">Autor:</span>{" "}
                              {autor || "Não informado"}
                            </p>
                            <p>
                              <span className="font-semibold">
                                Ano de publicação:
                              </span>{" "}
                              {ano || "Não informado"}
                            </p>
                            <p>
                              <span className="font-semibold">Editora:</span>{" "}
                              {editora || "Não informada"}
                            </p>
                            <p>
                              <span className="font-semibold">
                                Cópias totais:
                              </span>{" "}
                              {copiasTotais}
                            </p>

                            <p>
                              <span className="font-semibold">
                                Cópias disponíveis:
                              </span>{" "}
                              <span
                                className={
                                  copiasDisponiveis === 0
                                    ? "font-semibold text-[var(--status-danger)]"
                                    : "font-semibold text-[var(--status-success)]"
                                }
                              >
                                {copiasDisponiveis}
                                {copiasDisponiveis === 0
                                  ? " (Indisponível)"
                                  : ""}
                              </span>
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-[var(--radius-card)] border border-[var(--border-default)] bg-[var(--surface)] p-4 text-sm text-[var(--text-secondary)]">
                      <span className="font-semibold">Localização:</span>{" "}
                      {localizacao || "Não informada"}
                    </div>

                    <div className="space-y-2">
                      <h2 className="text-lg font-bold text-[var(--text-primary)] sm:text-xl">
                        Sinopse
                      </h2>
                      <p className="whitespace-pre-line rounded-[var(--radius-card)] bg-[var(--surface-hover)] p-4 text-sm leading-relaxed text-[var(--text-secondary)] sm:text-base">
                        {sinopse ||
                          "Nenhuma sinopse cadastrada para este livro."}
                      </p>
                    </div>
                  </div>
                ) : null}
        </div>
      </main>
    </>
  );
}
