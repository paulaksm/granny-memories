// Utilidades de texto portadas de reference/python/harness.py.

export const ID_ATOMO = /\bA-\d{3,}\b/g;
export const ID_ATOMO_CURTO = /\bA-\d{1,2}\b/g;
export const TIMESTAMP = /\[\d{1,2}:\d{2}(?::\d{2})?\]/g;
export const COMENTARIO = /<!--([\s\S]*?)-->/g;
export const FONTE =
  /^(audio-\d{2,})\s*\[(\d{1,2}:\d{2}(?::\d{2})?)\s*-\s*(\d{1,2}:\d{2}(?::\d{2})?)\]$/;

export function semAcentos(texto: string): string {
  return texto.normalize('NFD').replace(/\p{Mn}/gu, '');
}

/** Tira marcas de tempo, uniformiza aspas e espaços, para comparar trechos. */
export function normalizar(texto: string): string {
  let t = texto.replace(TIMESTAMP, ' ');
  const trocas: [string, string][] = [
    ['“', '"'],
    ['”', '"'],
    ['‘', "'"],
    ['’', "'"],
    ['…', '...'],
  ];
  for (const [velho, novo] of trocas) t = t.split(velho).join(novo);
  return t.replace(/\s+/g, ' ').trim();
}

/** Lê um cabeçalho simples '---' com linhas 'chave: valor' (continuação com recuo). */
export function lerCabecalho(texto: string): [Record<string, string>, string] {
  texto = texto.replace(/\r\n/g, '\n');
  if (!texto.startsWith('---\n')) return [{}, texto];
  const fim = texto.indexOf('\n---', 4);
  if (fim === -1) return [{}, texto];
  const campos: Record<string, string> = {};
  let chave: string | null = null;
  for (const linha of texto.slice(4, fim).split('\n')) {
    if (!linha.trim()) continue;
    if ((linha[0] === ' ' || linha[0] === '\t') && chave) {
      campos[chave] += ' ' + linha.trim();
    } else if (linha.includes(':')) {
      const i = linha.indexOf(':');
      chave = linha.slice(0, i).trim();
      campos[chave] = linha.slice(i + 1).trim();
    }
  }
  for (const [k, v] of Object.entries(campos)) {
    if (v.length >= 2 && v[0] === v[v.length - 1] && (v[0] === '"' || v[0] === "'")) {
      campos[k] = v.slice(1, -1);
    }
  }
  return [campos, texto.slice(fim + 4).replace(/^\n+/, '')];
}

export function comentarios(texto: string): string[] {
  return [...texto.matchAll(COMENTARIO)].map((m) => m[1]);
}

export function atomosEmTexto(texto: string): string[] {
  const ids = comentarios(texto).join(' ').match(ID_ATOMO) ?? [];
  return [...new Set(ids)].sort();
}

export function segundos(marca: string): number {
  const p = marca.split(':').map(Number);
  return p.length === 2 ? p[0] * 60 + p[1] : p[0] * 3600 + p[1] * 60 + p[2];
}

export function marcaTempo(seg: number): string {
  const s = Math.max(0, Math.floor(seg));
  const mm = String(Math.floor(s / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}
