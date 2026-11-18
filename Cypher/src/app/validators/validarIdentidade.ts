export const identificadoresReservados = new Set([
  "admin", "administrador", "equipe", "login", "logout", "register", "profile", "settings",
  "api", "support", "suporte", "cypher", "central", "search", "works", "beats", "events", "notificacoes",
]);

export function normalizarIdentificador(valor: string): string {
  return `@${valor.trim().replace(/^@/, "").toLowerCase()}`;
}

export function validarIdentificador(valor: string): string | null {
  const slug = normalizarIdentificador(valor).slice(1);
  if (!/^[a-z0-9_.]{3,24}$/.test(slug)) return "Use de 3 a 24 letras, números, ponto ou sublinhado no identificador.";
  if (identificadoresReservados.has(slug)) return "Este identificador é reservado. Escolha outro.";
  return null;
}

export function dataAtualCadastro(): string {
  const partes = new Intl.DateTimeFormat("en-CA",{timeZone:"America/Sao_Paulo",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(new Date());
  const valor = (tipo: string) => partes.find(parte => parte.type === tipo)?.value;
  return `${valor("year")}-${valor("month")}-${valor("day")}`;
}

export function validarNascimento(valor: string, hoje = dataAtualCadastro()): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) return "Informe uma data de nascimento válida.";
  const data = new Date(`${valor}T12:00:00Z`);
  if (Number.isNaN(data.getTime()) || data.toISOString().slice(0,10) !== valor || valor.startsWith("0000") || valor > hoje) return "A data de nascimento deve existir e não pode estar no futuro.";
  return null;
}

export function idadeNaData(nascimento: string, hoje = dataAtualCadastro()): number {
  const [ano,mes,dia] = nascimento.split("-").map(Number);
  const [anoAtual,mesAtual,diaAtual] = hoje.split("-").map(Number);
  return anoAtual - ano - Number(mesAtual < mes || (mesAtual === mes && diaAtual < dia));
}

export function nomePublico(nomeInformado: string, vulgo: string, usarVulgo: boolean): string {
  return usarVulgo ? vulgo.trim() : nomeInformado.trim();
}

export function iniciaisPublicas(nome: string): string {
  return nome.trim().split(/\s+/).slice(0,2).map(parte => parte[0] ?? "").join("").toLocaleUpperCase("pt-BR");
}

export function validarDadosIdentidade(dados: {nomeInformado:string;vulgo:string;usarVulgo:boolean;nascimento:string;tratamento?:string;generoPersonalizado?:string}): string | null {
  if (dados.nomeInformado.trim().length < 2 || dados.nomeInformado.trim().length > 80) return "Informe um nome entre 2 e 80 caracteres.";
  if (dados.vulgo.length > 80 || (dados.usarVulgo && dados.vulgo.trim().length < 2)) return "Para usar o vulgo publicamente, informe um vulgo entre 2 e 80 caracteres.";
  if (dados.tratamento && !["masculino","feminino","outro"].includes(dados.tratamento)) return "Escolha uma opção válida de gênero.";
  if (dados.tratamento === "outro" && (dados.generoPersonalizado?.trim().length ?? 0) > 80) return "Descreva seu gênero em até 80 caracteres.";
  const erroNascimento = validarNascimento(dados.nascimento);
  if (erroNascimento) return erroNascimento;
  if (idadeNaData(dados.nascimento) < 18) return "Você precisa ter 18 anos ou mais para criar uma conta.";
  return null;
}
