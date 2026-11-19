import Image from "next/image";

type LivroCardProps = {
  livro: {
    id_livro: number;
    titulo_livro: string;
    autor_livro: string;
    genero_livro: string;
    imgcapa_livro: string | null;
    possui_exemplar_disponivel?: boolean;
  };
};

const coresGenero: Record<string, string> = {
  romance: "var(--color-romance)",

  religião: "var(--color-religion-mythology)",
  religiao: "var(--color-religion-mythology)",
  mitologia: "var(--color-religion-mythology)",
  "religião e mitologia": "var(--color-religion-mythology)",
  "religiao e mitologia": "var(--color-religion-mythology)",

  "ficção": "var(--color-fiction)",
  "ficcao": "var(--color-fiction)",

  "arte e cultura": "var(--color-art-culture)",

  fantasia: "var(--color-fantasy)",

  biografias: "var(--color-biographies-memoirs)",
  memórias: "var(--color-biographies-memoirs)",
  memorias: "var(--color-biographies-memoirs)",
  "biografias e memórias": "var(--color-biographies-memoirs)",

  thriller: "var(--color-thriller-mystery)",
  mistério: "var(--color-thriller-mystery)",
  "thriller e mistério": "var(--color-thriller-mystery)",

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

export default function LivroCard({ livro }: LivroCardProps) {
  const corGenero =
    coresGenero[livro.genero_livro.toLowerCase()] ??
    "var(--color-brand-500)";

  return (
    <article className="h-full min-w-0 overflow-hidden rounded-lg border border-[var(--border-default)] bg-[var(--surface)] shadow-[var(--shadow-card)] transition-colors hover:border-[var(--border-strong)]">
      <div className="relative aspect-[3/4] w-full bg-[var(--surface-warm)]">
        <Image
          src={
            livro.imgcapa_livro ||
            "/images/placeholder_capaNaoCatalogada.png"
          }
          alt={
            livro.imgcapa_livro
              ? `Capa do livro ${livro.titulo_livro}`
              : "Capa não disponível"
          }
          fill
          sizes="(max-width: 640px) 42vw, 190px"
          unoptimized
          className="object-cover"
        />
      </div>

      <div className="flex min-h-40 flex-col p-3 sm:p-4">
        <span
          style={{ backgroundColor: corGenero }}
          className="inline-flex w-fit max-w-full items-center truncate rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase leading-tight text-[var(--text-primary)]"
        >
          {livro.genero_livro}
        </span>

        <h3 className="mt-2 line-clamp-2 text-sm font-bold leading-snug text-[var(--text-primary)] sm:text-base">
          {livro.titulo_livro}
        </h3>

        <p className="mt-1 line-clamp-2 text-sm leading-snug text-[var(--text-secondary)]">
          {livro.autor_livro}
        </p>

        {livro.possui_exemplar_disponivel === false && (
          <p className="mt-3 rounded-md bg-[var(--status-danger)] px-2 py-2 text-center text-xs font-semibold text-white">
            Sem exemplares disponíveis
          </p>
        )}
      </div>
    </article>
  );
}
