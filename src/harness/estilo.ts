// Estatísticas de estilo calculadas por código para o perfil de voz mínimo
// (docs/harness-fatia.md, etapa 5). Nenhuma passa pelo modelo.

const PALAVRAS_VAZIAS = new Set(
  ('a o e é de da do das dos em no na nos nas um uma uns umas que se por para pra pro com ' +
    'como mas mais ao aos à às ou já não sim foi era ser ter tinha tem eu ela ele isso essa esse ' +
    'esta este aquilo lá me te lhe meu minha seu sua')
    .split(' '),
);
const ORALIDADE = ['né', 'aí', 'então', 'sabe', 'olha', 'tipo', 'assim', 'nossa', 'pois é'];
const PESSOAS = ['eu', 'a gente', 'nós'];

export type Estatisticas = {
  palavras: number;
  frases: number;
  mediaPorFrase: number;
  menorFrase: number;
  maiorFrase: number;
  expressoes: [string, number][];
  oralidade: [string, number][];
  pessoa: [string, number][];
  falasCitadas: number;
};

const tokens = (t: string) => t.toLowerCase().match(/[\p{L}\p{N}]+(?:-[\p{L}]+)*/gu) ?? [];

function contarExpressao(texto: string, expr: string): number {
  const re = new RegExp(`(?<![\\p{L}])${expr.replace(/ /g, '\\s+')}(?![\\p{L}])`, 'giu');
  return (texto.match(re) ?? []).length;
}

export function calcularEstatisticas(textos: string[]): Estatisticas {
  const corrido = textos
    .join('\n')
    .replace(/\[\d{1,2}:\d{2}(?::\d{2})?\]/g, ' ')
    .replace(/\[\?([^\]]*)\]/g, '$1');
  const frases = corrido
    .split(/[.!?…]+/)
    .map((f) => tokens(f).length)
    .filter((n) => n > 0);
  const todas = tokens(corrido);

  const contagem = new Map<string, number>();
  for (const n of [2, 3]) {
    for (let i = 0; i + n <= todas.length; i++) {
      const grupo = todas.slice(i, i + n);
      if (grupo.every((p) => PALAVRAS_VAZIAS.has(p))) continue;
      if (PALAVRAS_VAZIAS.has(grupo[0]) && PALAVRAS_VAZIAS.has(grupo[n - 1]) && n === 2) continue;
      const chave = grupo.join(' ');
      contagem.set(chave, (contagem.get(chave) ?? 0) + 1);
    }
  }
  const expressoes = [...contagem.entries()]
    .filter(([, c]) => c >= 3)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 8);

  const contar = (lista: string[]) =>
    lista
      .map((e): [string, number] => [e, contarExpressao(corrido, e)])
      .filter(([, c]) => c > 0)
      .sort((a, b) => b[1] - a[1]);
  const pessoa = PESSOAS.map((e): [string, number] => [e, contarExpressao(corrido, e)]);

  const falasCitadas =
    (corrido.match(/["“][^"”]{3,}["”]/g) ?? []).length +
    (corrido.match(/(?<![\p{L}])(disse|falou|falei|perguntou|respondeu)(?![\p{L}])/giu) ?? []).length;

  const soma = frases.reduce((a, b) => a + b, 0);
  return {
    palavras: todas.length,
    frases: frases.length,
    mediaPorFrase: frases.length ? Math.round((soma / frases.length) * 10) / 10 : 0,
    menorFrase: frases.length ? Math.min(...frases) : 0,
    maiorFrase: frases.length ? Math.max(...frases) : 0,
    expressoes,
    oralidade: contar(ORALIDADE),
    pessoa,
    falasCitadas,
  };
}

/** Linhas para a seção "Estatísticas" do guia de voz e para a entrada do analista. */
export function estatisticasComoTexto(e: Estatisticas): string[] {
  const lista = (l: [string, number][]) =>
    l.length ? l.map(([t, c]) => `"${t}" (${c})`).join(', ') : 'nenhuma';
  return [
    `palavras: ${e.palavras}`,
    `frases: ${e.frases}; palavras por frase: média ${e.mediaPorFrase} (de ${e.menorFrase} a ${e.maiorFrase})`,
    `expressões recorrentes: ${lista(e.expressoes)}`,
    `marcas de oralidade: ${lista(e.oralidade)}`,
    `pessoa gramatical: ${e.pessoa.map(([t, c]) => `"${t}" (${c})`).join(', ')}`,
    `falas citadas (aproximado): ${e.falasCitadas}`,
  ];
}
