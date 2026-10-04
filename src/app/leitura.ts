// Leitura dos arquivos do harness para as telas (e as poucas escritas que a autora faz:
// corrigir palavra, decidir traço). As telas nunca escrevem o formato à mão.
import { ARQUIVOS, carregarAtomos, PASTAS } from '../harness/projeto';
import { lerTracos, marcarTraco, type Marcador, type Traco } from '../harness/serializar';
import { comentarios, ID_ATOMO, lerCabecalho, segundos } from '../harness/texto';
import { corrigirDuvida, lerParagrafos } from '../harness/transcricao';
import { arquivosProjeto as arq } from './loja';

// ------------------------------------------------------------------ transcrição
export type Trecho = { texto: string; duvida?: { indice: number; palavra: string } };
export type ParagrafoTela = { marca: string; trechos: Trecho[] };

export async function lerTranscricao(audioId: string): Promise<ParagrafoTela[] | null> {
  const caminho = `${PASTAS.revisada}/${audioId}.txt`;
  if (!(await arq.existe(caminho))) return null;
  let indice = 0;
  return lerParagrafos(await arq.ler(caminho)).map((p) => {
    const trechos: Trecho[] = [];
    let resto = p.texto;
    for (const m of p.texto.matchAll(/\[\?([^\]]*)\]/g)) {
      const pos = resto.indexOf(m[0]);
      if (pos > 0) trechos.push({ texto: resto.slice(0, pos) });
      trechos.push({ texto: m[1], duvida: { indice: indice++, palavra: m[1] } });
      resto = resto.slice(pos + m[0].length);
    }
    if (resto) trechos.push({ texto: resto });
    return { marca: p.marca, trechos };
  });
}

/** A correção vai para a cópia revisada; o bruto em transcricoes/raw nunca muda. */
export async function corrigirPalavra(audioId: string, indice: number, palavra: string) {
  const caminho = `${PASTAS.revisada}/${audioId}.txt`;
  await arq.escrever(caminho, corrigirDuvida(await arq.ler(caminho), indice, palavra));
}

export async function audioLimpo(audioId: string) {
  return arq.existe(`${PASTAS.clean}/${audioId}.md`);
}

// ------------------------------------------------------------------ voz
export async function lerVoz(): Promise<{ tracos: Traco[]; audios: string[] } | null> {
  if (!(await arq.existe(ARQUIVOS.guiaVoz))) return null;
  const guia = await arq.ler(ARQUIVOS.guiaVoz);
  const audios = (lerCabecalho(guia)[0].audios ?? '').split(',').map((a) => a.trim()).filter(Boolean);
  return { tracos: lerTracos(guia), audios };
}

export async function decidirTraco(indice: number, marcador: Marcador) {
  await arq.escrever(ARQUIVOS.guiaVoz, marcarTraco(await arq.ler(ARQUIVOS.guiaVoz), indice, marcador));
}

// ------------------------------------------------------------------ ideias
export type Ideia = {
  id: string;
  tipo: string;
  resumo: string;
  original: string;
  audio: string;
  inicio: string;
};

export async function lerIdeias(audios?: string[]): Promise<Ideia[]> {
  const atomos = await carregarAtomos(arq);
  return Object.entries(atomos)
    .map(([id, a]) => {
      const m = /^(audio-\d+)\s*\[([\d:]+)-/.exec(a.fonte ?? '');
      return {
        id,
        tipo: a.tipo ?? '',
        resumo: a.resumo ?? '',
        original: a.trecho_literal ?? '',
        audio: m?.[1] ?? '',
        inicio: m?.[2] ?? '00:00',
      };
    })
    .filter((i) => !audios || audios.includes(i.audio))
    .sort((a, b) =>
      audios ? audios.indexOf(a.audio) - audios.indexOf(b.audio) || a.id.localeCompare(b.id) : a.id.localeCompare(b.id),
    );
}

// ------------------------------------------------------------------ capítulo
export type Passagem = { texto: string; atomos: string[] };
export type Pergunta = { texto: string; origem: string[]; tipo: string; aberta: boolean };
export type CapituloTela = { titulo: string; status: string; passagens: Passagem[]; perguntas: Pergunta[] };

export async function lerCapitulo(capituloId: string): Promise<CapituloTela | null> {
  const caminho = `${PASTAS.capitulos}/${capituloId}.md`;
  if (!(await arq.existe(caminho))) return null;
  const [campos, corpo] = lerCabecalho(await arq.ler(caminho));
  const passagens = corpo
    .split(/\n\s*\n/)
    .map((b) => ({
      texto: b.replace(/<!--[\s\S]*?-->/g, '').trim(),
      atomos: [...new Set(comentarios(b).join(' ').match(ID_ATOMO) ?? [])],
    }))
    .filter((p) => p.texto && !p.texto.startsWith('#'));

  const idsDoCapitulo = new Set(passagens.flatMap((p) => p.atomos));
  let perguntas: Pergunta[] = [];
  if (await arq.existe(ARQUIVOS.perguntas)) {
    perguntas = (await arq.ler(ARQUIVOS.perguntas))
      .split('\n')
      .map((l) => /^- \[( |x|~)\] pergunta: (.*?) \| origem: (.*?) \| tipo: (\S+)/.exec(l))
      .filter((m): m is RegExpExecArray => !!m)
      .map((m) => ({
        texto: m[2],
        origem: m[3].split(',').map((s) => s.trim()).filter(Boolean),
        tipo: m[4],
        aberta: m[1] === ' ',
      }))
      .filter((p) => p.origem.length === 0 || p.origem.some((o) => idsDoCapitulo.has(o)));
  }
  return { titulo: campos.titulo ?? '', status: campos.status ?? 'rascunho', passagens, perguntas };
}

export const segundosDe = (marca: string) => segundos(marca);
