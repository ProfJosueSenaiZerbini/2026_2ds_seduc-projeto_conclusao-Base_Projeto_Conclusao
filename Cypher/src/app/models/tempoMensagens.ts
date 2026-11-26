const fuso = "America/Sao_Paulo";
const diaLocal = new Intl.DateTimeFormat("en-CA", {
  timeZone: fuso,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
const horaLocal = new Intl.DateTimeFormat("pt-BR", {
  timeZone: fuso,
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});
const diaSemana = new Intl.DateTimeFormat("pt-BR", {
  timeZone: fuso,
  weekday: "long",
});
const dataCurta = new Intl.DateTimeFormat("pt-BR", {
  timeZone: fuso,
  day: "2-digit",
  month: "2-digit",
});
const dataCompleta = new Intl.DateTimeFormat("pt-BR", {
  timeZone: fuso,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

function instante(valor: string) {
  return new Date(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(valor)
    ? valor.replace(" ", "T") + "Z"
    : valor);
}

function chaveDia(data: Date) {
  return diaLocal.format(data);
}

function tempoDecorrido(data: Date, agora: Date) {
  const minutos = Math.max(0, Math.floor((agora.getTime() - data.getTime()) / 60000));
  if (minutos < 1) return "agora";
  if (minutos < 60) return `há ${minutos} min`;
  const horas = Math.floor(minutos / 60);
  return `há ${horas} ${horas === 1 ? "hora" : "horas"}`;
}

function rotuloDia(data: Date, agora: Date, conversa: boolean) {
  const hoje = chaveDia(agora);
  const dia = chaveDia(data);
  const distancia = Math.round((Date.parse(hoje + "T00:00:00Z") - Date.parse(dia + "T00:00:00Z")) / 86400000);
  if (distancia <= 0) {
    const minutos = Math.max(0, Math.floor((agora.getTime() - data.getTime()) / 60000));
    if (minutos >= 720) return "Hoje";
    const relativo = tempoDecorrido(data, agora);
    return conversa ? relativo : `Hoje · ${relativo}`;
  }
  if (distancia === 1) return "Ontem";
  if (distancia < 7) return diaSemana.format(data).replace(/-feira$/, "");
  return dia.startsWith(hoje.slice(0, 4)) ? dataCurta.format(data) : dataCompleta.format(data);
}

export function rotuloDataConversa(valor: string, agora = new Date()) {
  return rotuloDia(instante(valor), agora, true);
}

export function horaMensagem(valor: string) {
  return horaLocal.format(instante(valor));
}

export function agruparMensagensPorDia<T extends { criada_em: string }>(
  mensagens: T[],
  agora = new Date(),
) {
  const grupos: { dia: string; rotulo: string; mensagens: T[] }[] = [];
  for (const mensagem of mensagens) {
    const dia = chaveDia(instante(mensagem.criada_em));
    let grupo = grupos[grupos.length - 1];
    if (!grupo || grupo.dia !== dia) {
      grupo = { dia, rotulo: "", mensagens: [] };
      grupos.push(grupo);
    }
    grupo.mensagens.push(mensagem);
  }
  for (const grupo of grupos) {
    const ultimoInstante = instante(grupo.mensagens[grupo.mensagens.length - 1].criada_em);
    grupo.rotulo = rotuloDia(ultimoInstante, agora, false);
  }
  return grupos;
}
