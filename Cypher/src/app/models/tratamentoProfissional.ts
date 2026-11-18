// A chave é a categoria do catálogo. Apenas o rótulo apresentado varia.
const formas: Record<string, readonly [string, string]> = {
  "Compositor(a)": ["Compositora", "Composição"],
  "Produtor(a)": ["Produtora", "Produção musical"],
  "Freestyleiro": ["Freestyleira", "Freestyle"],
  "B-boy / B-girl": ["B-girl", "Breaking"],
  "Dançarino(a)": ["Dançarina", "Dança"],
  "Coreógrafo(a)": ["Coreógrafa", "Coreografia"],
  "Grafiteiro(a)": ["Grafiteira", "Grafite"],
  "Ilustrador(a)": ["Ilustradora", "Ilustração"],
  "Designer gráfico": ["Designer gráfica", "Design gráfico"],
  "Fotógrafo(a)": ["Fotógrafa", "Fotografia"],
  "Editor(a) de vídeo": ["Editora de vídeo", "Edição de vídeo"],
  "Engenheiro(a) de áudio": ["Engenheira de áudio", "Engenharia de áudio"],
  "Mixador(a)": ["Mixadora", "Mixagem"],
  "Masterizador(a)": ["Masterizadora", "Masterização"],
  "Empresário(a)": ["Empresária", "Gestão de carreiras"],
  "Produtor(a) cultural": ["Produtora cultural", "Produção cultural"],
  "Organizador(a) de eventos": ["Organizadora de eventos", "Organização de eventos"],
  "Criador(a) de conteúdo": ["Criadora de conteúdo", "Criação de conteúdo"],
};

export function rotuloProfissional(categoria: string, tratamento?: string): string {
  if (tratamento === "masculino") {
    return categoria === "B-boy / B-girl" ? "B-boy" : categoria.replace(/\(a\)/g, "");
  }
  return formas[categoria]?.[tratamento === "feminino" ? 0 : 1] ?? categoria;
}
