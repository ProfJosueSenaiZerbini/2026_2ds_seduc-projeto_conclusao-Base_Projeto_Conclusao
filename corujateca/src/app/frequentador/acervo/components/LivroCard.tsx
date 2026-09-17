type LivroCardProps = {
  livro: {
    id_livro: number;
    titulo_livro: string;
    autor_livro: string;
    genero_livro: string;
    imgcapa_livro: string | null;
  };
};

const coresGenero: Record<string, string> = {
  romance: "var(--color-romance)",

  religião: "var(--color-religion-mythology)",
  religiao: "var(--color-religion-mythology)",
  mitologia: "var(--color-religion-mythology)",
  "religião e mitologia": "var(--color-religion-mythology)",
  "religiao e mitologia": "var(--color-religion-mythology)",

  "ficção científica": "var(--color-science-fiction)",
  "ficcao cientifica": "var(--color-science-fiction)",

  "arte e cultura": "var(--color-art-culture)",

  fantasia: "var(--color-fantasy)",

  biografias: "var(--color-biographies-memoirs)",
  memórias: "var(--color-biographies-memoirs)",
  memorias: "var(--color-biographies-memoirs)",

  thriller: "var(--color-thriller-mystery)",
  mistério: "var(--color-thriller-mystery)",
  misterio: "var(--color-thriller-mystery)",

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
    <article className="w-full max-w-36">

      {/* Capa do livro */}
      <div className="w-full aspect-[3/4] rounded-lg overflow-hidden bg-[var(--color-brand-400)]">
        {livro.imgcapa_livro ? (
          <img
            src={livro.imgcapa_livro}
            alt={`Capa do livro ${livro.titulo_livro}`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-sm text-center text-[var(--color-text-primary)] px-2">
              Sem capa
            </span>
          </div>
        )}
      </div>

      {/* Gênero */}
      <div className="mt-2">
        <span
          style={{
            backgroundColor: corGenero,
          }}
          className="
            inline-block
            text-[var(--color-text-primary)]
            rounded-full
            px-4
            py-1.5
            text-[10px]
            font-bold
            uppercase
            leading-none
          "
        >
          {livro.genero_livro}
        </span>
      </div>

      {/* Título */}
      <h3
        className="
          text-sm
          font-bold
          leading-tight
          mt-2
          line-clamp-2
          text-[var(--color-text-primary)]
        "
      >
        {livro.titulo_livro}
      </h3>

      {/* Autor */}
      <p
        className="
          text-sm
          mt-1
          leading-tight
          line-clamp-2
          text-[var(--color-text-primary)]
        "
      >
        {livro.autor_livro}
      </p>

    </article>
  );
}