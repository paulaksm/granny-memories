// O modelo devolve conteúdo em JSON; aqui o código escreve os arquivos nos formatos
// de docs/prompts-agentes-ghostwriter.md (docs/harness-fatia.md, "Princípio").
import { lerParagrafos } from './transcricao';
import { lerCabecalho, normalizar, segundos } from './texto';

// ------------------------------------------------------------------ fonte
export type Localizacao = { audio: string; inicio: string; fim: string };

/**
 * Acha o trecho literal no clean e devolve as marcas do parágrafo onde começa e do
 * início do parágrafo seguinte ao último que ele ocupa (ou a duração do áudio).
 */
export function localizarTrecho(audio: string, clean: string, trecho: string): Localizacao | null {
  const [campos, corpo] = lerCabecalho(clean);
  const paragrafos = lerParagrafos(corpo).filter((p) => p.marca);
  const alvo = normalizar(trecho);
  if (!alvo) return null;
  const partes = paragrafos.map((p) => normalizar(p.texto));
  const inicios: number[] = [];
  let corrido = '';
  for (const parte of partes) {
    inicios.push(corrido.length ? corrido.length + 1 : 0);
    corrido = corrido.length ? `${corrido} ${parte}` : parte;
  }
  const pos = corrido.indexOf(alvo);
  if (pos === -1) return null;
  const fimPos = pos + alvo.length - 1;
  let primeiro = 0;
  let ultimo = 0;
  inicios.forEach((ini, i) => {
    if (ini <= pos) primeiro = i;
    if (ini <= fimPos) ultimo = i;
  });
  const inicio = paragrafos[primeiro].marca;
  let fim: string;
  if (ultimo + 1 < paragrafos.length) {
    fim = paragrafos[ultimo + 1].marca;
  } else {
    const duracao = campos['duração'] ?? campos.duracao;
    fim = duracao && /^\d{1,2}:\d{2}/.test(duracao) ? duracao : paragrafos[ultimo].marca;
  }
  if (segundos(fim) < segundos(inicio)) fim = inicio;
  return { audio, inicio, fim };
}

export const fonteTexto = (l: Localizacao) => `${l.audio} [${l.inicio}-${l.fim}]`;

// ------------------------------------------------------------------ átomos
export type AtomoModelo = {
  tipo: string;
  resumo: string;
  trecho_literal: string;
  pessoas?: string[];
  datas_locais_numeros?: string[];
  relacionado?: { indice: number; relacao: string }[];
};

export type AtomoGerado = { id: string; conteudo: string };
export type Descartado = { indice: number; motivo: string };

const umaLinha = (t: string) => t.replace(/\s+/g, ' ').trim();
const idAtomo = (n: number) => `A-${String(n).padStart(3, '0')}`;

/**
 * Numera a partir de `proximo`, calcula fonte e confiança, converte relações de
 * índice para ID. Átomos cujo trecho não está no clean são descartados.
 */
export function atomosParaArquivos(
  audio: string,
  clean: string,
  atomos: AtomoModelo[],
  proximo: number,
): { gerados: AtomoGerado[]; descartados: Descartado[] } {
  const descartados: Descartado[] = [];
  const ids = new Map<number, string>();
  const validos: { indice: number; atomo: AtomoModelo; loc: Localizacao }[] = [];
  atomos.forEach((atomo, indice) => {
    const loc = localizarTrecho(audio, clean, atomo.trecho_literal ?? '');
    if (!loc) {
      descartados.push({ indice, motivo: 'trecho_literal não encontrado na transcrição limpa' });
      return;
    }
    ids.set(indice, idAtomo(proximo + validos.length));
    validos.push({ indice, atomo, loc });
  });

  const gerados = validos.map(({ indice, atomo, loc }) => {
    const id = ids.get(indice)!;
    const literal = umaLinha(atomo.trecho_literal);
    const relacionado = (atomo.relacionado ?? [])
      .filter((r) => ids.has(r.indice) && r.indice !== indice)
      .map((r) => `${ids.get(r.indice)} (${r.relacao})`)
      .join(', ');
    const conteudo =
      '---\n' +
      `id: ${id}\n` +
      `fonte: ${fonteTexto(loc)}\n` +
      `tipo: ${umaLinha(atomo.tipo).toLowerCase()}\n` +
      `resumo: ${umaLinha(atomo.resumo)}\n` +
      `trecho_literal: ${literal}\n` +
      `pessoas: ${(atomo.pessoas ?? []).map(umaLinha).join(', ')}\n` +
      `datas_locais_numeros: ${(atomo.datas_locais_numeros ?? []).map(umaLinha).join(', ')}\n` +
      `confianca_transcricao: ${literal.includes('[?') ? 'baixa' : 'alta'}\n` +
      `relacionado: ${relacionado}\n` +
      '---\n';
    return { id, conteudo };
  });
  return { gerados, descartados };
}

// ------------------------------------------------------------------ guia de voz
export type Marcador = ' ' | 'x' | '-';
export type Traco = {
  marcador: Marcador;
  nome: string;
  traco: string;
  evidencia: string;
  fonte: string;
  ocorrencias: number;
};
export type Exemplo = { trecho: string; fonte: string };

const LINHA_TRACO =
  /^- \[( |x|-)\] nome: (.*?) \| traço: (.*?) \| evidência: "(.*?)" \| fonte: (.*?) \| ocorrências: (\d+)\s*$/;

export function linhaTraco(t: Traco): string {
  const limpar = (s: string) => umaLinha(s).replace(/\|/g, '/');
  return (
    `- [${t.marcador}] nome: ${limpar(t.nome)} | traço: ${limpar(t.traco)} | ` +
    `evidência: "${limpar(t.evidencia).replace(/"/g, "'")}" | fonte: ${t.fonte} | ocorrências: ${t.ocorrencias}`
  );
}

export function guiaDeVoz(audios: string[], estatisticas: string[], exemplos: Exemplo[], tracos: Traco[]): string {
  const status = tracos.length && tracos.every((t) => t.marcador !== ' ') ? 'aprovado' : 'rascunho';
  return (
    `---\nstatus: ${status}\naudios: ${audios.join(', ')}\n---\n` +
    '# Guia de voz\n\n' +
    '## Estatísticas\n\n' +
    estatisticas.map((e) => `- ${e}`).join('\n') +
    '\n\n## Exemplos\n\n' +
    exemplos.map((e) => `- "${umaLinha(e.trecho)}" | fonte: ${e.fonte}`).join('\n') +
    '\n\n## Traços\n\n' +
    tracos.map(linhaTraco).join('\n') +
    '\n'
  );
}

export function lerTracos(guia: string): Traco[] {
  return guia
    .split('\n')
    .map((l) => LINHA_TRACO.exec(l))
    .filter((m): m is RegExpExecArray => m !== null)
    .map((m) => ({
      marcador: m[1] as Marcador,
      nome: m[2],
      traco: m[3],
      evidencia: m[4],
      fonte: m[5],
      ocorrencias: Number(m[6]),
    }));
}

/** Marca o traço `indice` e atualiza o status do guia. */
export function marcarTraco(guia: string, indice: number, marcador: Marcador): string {
  let n = -1;
  const linhas = guia.split('\n').map((l) => {
    if (!LINHA_TRACO.test(l)) return l;
    n += 1;
    return n === indice ? l.replace(/^- \[( |x|-)\]/, `- [${marcador}]`) : l;
  });
  let texto = linhas.join('\n');
  const tracos = lerTracos(texto);
  const status = tracos.length && tracos.every((t) => t.marcador !== ' ') ? 'aprovado' : 'rascunho';
  texto = texto.replace(/^status: .*$/m, `status: ${status}`);
  return texto;
}

/** O que o redator recebe: estatísticas, exemplos e só os traços [x]. */
export function guiaParaRedator(guia: string): string {
  return guia
    .split('\n')
    .filter((l) => !LINHA_TRACO.test(l) || l.startsWith('- [x]'))
    .join('\n');
}

// ------------------------------------------------------------------ capítulo
export type Pergunta = { texto: string; origem: string[]; tipo: string };
export type CapituloModelo = {
  titulo: string;
  paragrafos: { texto: string; atomos: string[] }[];
  notas?: string[];
  perguntas?: Pergunta[];
};

export function linhaPergunta(p: Pergunta, marcador = ' '): string {
  return `- [${marcador}] pergunta: ${umaLinha(p.texto)} | origem: ${p.origem.join(', ')} | tipo: ${p.tipo}`;
}

/**
 * C-NN.md só com o texto (para o `rastreio` não ler notas e perguntas como parágrafos);
 * as notas vão para C-NN.notas.md e as perguntas para controle/perguntas.md.
 * Relações "contradiz" sem pergunta correspondente ganham uma pergunta.
 */
export function capituloParaArquivos(
  cap: CapituloModelo,
  contradicoes: [string, string][],
): { capitulo: string; notas: string; perguntas: Pergunta[] } {
  const corpo = cap.paragrafos
    .map((p) => {
      const texto = p.texto.trim().replace(/<!--[\s\S]*?-->/g, '');
      const ids = [...new Set(p.atomos.map((a) => a.trim()).filter(Boolean))];
      return ids.length ? `${texto} <!-- ${ids.join(', ')} -->` : texto;
    })
    .filter(Boolean)
    .join('\n\n');
  const capitulo = `---\ntitulo: ${umaLinha(cap.titulo)}\nstatus: rascunho\n---\n${corpo}\n`;

  const perguntas = [...(cap.perguntas ?? [])].filter((p) => p.texto?.trim());
  for (const [a, b] of contradicoes) {
    const coberta = perguntas.some(
      (p) => p.tipo === 'contradição' && p.origem.includes(a) && p.origem.includes(b),
    );
    if (!coberta) {
      perguntas.push({
        texto: `Os trechos ${a} e ${b} parecem dizer coisas diferentes. Qual é o certo?`,
        origem: [a, b],
        tipo: 'contradição',
      });
    }
  }
  const notas = (cap.notas ?? []).slice(0, 5).map((n) => `- ${umaLinha(n)}`).join('\n');
  return { capitulo, notas: notas ? `${notas}\n` : '', perguntas };
}

