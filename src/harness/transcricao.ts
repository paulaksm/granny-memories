// Resposta do Scribe v2 -> transcricoes/raw/audio-NN.txt (docs/harness-fatia.md, etapa 2),
// e a correção mínima das palavras duvidosas (RF3 mínimo).
import { marcaTempo } from './texto';

export type PalavraScribe = {
  text: string;
  start?: number;
  end?: number;
  type?: 'word' | 'spacing' | 'audio_event' | string;
  logprob?: number;
};

export type RespostaScribe = {
  language_code?: string;
  text?: string;
  words?: PalavraScribe[];
};

/** Pausa (s) que abre um parágrafo novo. */
export const PAUSA_PARAGRAFO = 1.5;
/** Palavras com logprob abaixo disto viram [?palavra] (probabilidade < ~37%). A calibrar. */
export const LIMIAR_DUVIDA = -1.0;
const PALAVRAS_POR_PARAGRAFO = 120;

export type Paragrafo = { inicio: number; texto: string };

export function paragrafosDoScribe(resp: RespostaScribe): Paragrafo[] {
  type Aberto = { inicio: number; partes: string[]; palavras: number };
  const paragrafos: Paragrafo[] = [];
  const abertos: Aberto[] = [];
  let fimAnterior: number | null = null;

  for (const p of resp.words ?? []) {
    const atual: Aberto | undefined = abertos[abertos.length - 1];
    if (p.type === 'spacing') {
      atual?.partes.push(' ');
      continue;
    }
    const inicio: number = p.start ?? fimAnterior ?? 0;
    const pausa = fimAnterior !== null && inicio - fimAnterior >= PAUSA_PARAGRAFO;
    const longo =
      atual !== undefined &&
      atual.palavras >= PALAVRAS_POR_PARAGRAFO &&
      /[.!?…]$/.test(atual.partes.join('').trim());
    let destino = atual;
    if (destino === undefined || pausa || longo) {
      destino = { inicio, partes: [], palavras: 0 };
      abertos.push(destino);
    }
    const duvidosa = p.type !== 'audio_event' && p.logprob !== undefined && p.logprob < LIMIAR_DUVIDA;
    destino.partes.push(duvidosa ? `[?${p.text}]` : p.text);
    destino.palavras += 1;
    fimAnterior = p.end ?? inicio;
  }

  for (const a of abertos) {
    const texto = a.partes.join('').replace(/\s+/g, ' ').trim();
    if (texto) paragrafos.push({ inicio: a.inicio, texto });
  }
  if (paragrafos.length === 0 && resp.text?.trim()) {
    paragrafos.push({ inicio: 0, texto: resp.text.trim() });
  }
  return paragrafos;
}

export function paragrafosParaTexto(paragrafos: Paragrafo[]): string {
  return paragrafos.map((p) => `[${marcaTempo(p.inicio)}] ${p.texto}`).join('\n\n') + '\n';
}

/** Lê "[mm:ss] texto" separados por linha em branco. */
export function lerParagrafos(texto: string): { marca: string; texto: string }[] {
  return texto
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter(Boolean)
    .map((b) => {
      const m = /^\[(\d{1,2}:\d{2}(?::\d{2})?)\]\s*([\s\S]*)$/.exec(b);
      return m ? { marca: m[1], texto: m[2].trim() } : { marca: '', texto: b };
    });
}

const DUVIDA = /\[\?([^\]]*)\]/g;

export type Duvida = { indice: number; palavra: string; paragrafo: number };

export function listarDuvidas(texto: string): Duvida[] {
  const duvidas: Duvida[] = [];
  lerParagrafos(texto).forEach((p, paragrafo) => {
    for (const m of p.texto.matchAll(DUVIDA)) {
      duvidas.push({ indice: duvidas.length, palavra: m[1], paragrafo });
    }
  });
  return duvidas;
}

/** Troca a n-ésima marca [?...] pela palavra corrigida. As outras marcas ficam. */
export function corrigirDuvida(texto: string, indice: number, correcao: string): string {
  let n = -1;
  return texto.replace(DUVIDA, (marca) => {
    n += 1;
    return n === indice ? correcao.trim() : marca;
  });
}
