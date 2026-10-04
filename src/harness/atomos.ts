// Verificação `atomos`, portada de validar_atomos em reference/python/harness.py.
import type { Arquivos } from './arquivos';
import { PASTAS } from './projeto';
import { Relatorio } from './relatorio';
import { FONTE, ID_ATOMO, lerCabecalho, normalizar, segundos } from './texto';

export const TIPOS_ATOMO = ['história', 'argumento', 'opinião', 'fato', 'citação', 'descrição'];
export const RELACOES = ['repete', 'complementa', 'contradiz'];
const OBRIGATORIOS_ATOMO = ['id', 'fonte', 'tipo', 'resumo', 'trecho_literal'];

export async function validarAtomos(arq: Arquivos): Promise<Relatorio> {
  const rel = new Relatorio('atomos');
  const arquivos = (await arq.listar(PASTAS.atomos)).filter((n) => /^A-.*\.md$/.test(n));
  if (arquivos.length === 0) {
    rel.aviso(PASTAS.atomos, 'nenhum átomo encontrado');
    return rel;
  }
  const limpas: Record<string, string> = {};
  for (const nome of await arq.listar(PASTAS.clean)) {
    if (/^audio-.*\.md$/.test(nome)) {
      limpas[nome.slice(0, -3)] = normalizar(await arq.ler(`${PASTAS.clean}/${nome}`));
    }
  }
  const camposPorId: Record<string, Record<string, string>> = {};
  const vistos: Record<string, string> = {};

  for (const nome of arquivos) {
    const [campos] = lerCabecalho(await arq.ler(`${PASTAS.atomos}/${nome}`));
    const stem = nome.slice(0, -3);
    camposPorId[stem] = campos;
    const local = nome;
    for (const c of OBRIGATORIOS_ATOMO) {
      if (!campos[c]) rel.erro(local, `campo obrigatório ausente ou vazio: ${c}`);
    }
    const aid = campos.id ?? '';
    if (aid && aid !== stem) rel.erro(local, `id '${aid}' diferente do nome do arquivo`);
    if (aid) {
      if (aid in vistos) rel.erro(local, `id duplicado (já usado em ${vistos[aid]})`);
      vistos[aid] = nome;
    }
    const tipo = (campos.tipo ?? '').toLowerCase();
    if (tipo && !TIPOS_ATOMO.includes(tipo)) {
      rel.erro(local, `tipo '${tipo}' inválido; use um de ${[...TIPOS_ATOMO].sort().join(', ')}`);
    }
    const conf = (campos.confianca_transcricao ?? '').toLowerCase();
    if (conf && conf !== 'alta' && conf !== 'baixa') {
      rel.erro(local, 'confianca_transcricao deve ser alta ou baixa');
    }

    const fonte = campos.fonte ?? '';
    const literal = campos.trecho_literal ?? '';
    const m = fonte ? FONTE.exec(fonte) : null;
    if (fonte && !m) rel.erro(local, "fonte fora do formato 'audio-NN [mm:ss-mm:ss]'");
    if (m) {
      const audio = m[1];
      if (!(audio in limpas)) {
        rel.erro(local, `transcrição limpa de ${audio} não encontrada`);
      } else if (literal && !limpas[audio].includes(normalizar(literal))) {
        rel.erro(local, `trecho_literal não encontrado em ${audio}`);
      }
      if (segundos(m[2]) > segundos(m[3])) rel.erro(local, 'marca de início maior que a de fim');
    }
    if (literal.includes('[?') && conf !== 'baixa') {
      rel.aviso(local, "trecho com [?] mas confianca_transcricao não é 'baixa'");
    }
  }

  let contradicoes = 0;
  for (const [aid, campos] of Object.entries(camposPorId)) {
    const bruto = (campos.relacionado ?? '').trim();
    if (bruto === '' || bruto === '[]' || bruto === 'nenhum') continue;
    const pares = [...bruto.matchAll(/(A-\d{3,})\s*\(\s*([^)]+?)\s*\)/g)].map((p) => [p[1], p[2]]);
    if (pares.length !== (bruto.match(ID_ATOMO) ?? []).length) {
      rel.erro(`${aid}.md`, "relacionado fora do formato 'A-002 (repete), A-005 (contradiz)'");
    }
    for (const [outro, relacao] of pares) {
      if (!RELACOES.includes(relacao.toLowerCase())) {
        rel.erro(`${aid}.md`, `relação '${relacao}' inválida; use ${[...RELACOES].sort().join(', ')}`);
      }
      if (outro === aid) {
        rel.erro(`${aid}.md`, 'átomo relacionado a si mesmo');
      } else if (!(outro in camposPorId)) {
        rel.erro(`${aid}.md`, `relacionado aponta para átomo inexistente: ${outro}`);
      }
      if (relacao.toLowerCase() === 'contradiz') contradicoes += 1;
    }
  }
  if (contradicoes) {
    rel.info('relacionado', `${contradicoes} relação(ões) 'contradiz' registrada(s); devem virar perguntas`);
  }

  const numeros = Object.keys(camposPorId)
    .filter((i) => /^A-\d+$/.test(i))
    .map((i) => Number(i.split('-')[1]))
    .sort((a, b) => a - b);
  if (numeros.length) {
    const presentes = new Set(numeros);
    const faltando: string[] = [];
    for (let n = 1; n <= numeros[numeros.length - 1]; n++) {
      if (!presentes.has(n)) faltando.push(`A-${String(n).padStart(3, '0')}`);
    }
    if (faltando.length) {
      rel.aviso(PASTAS.atomos, `IDs ausentes na sequência: ${faltando.slice(0, 10).join(', ')}`);
    }
  }
  rel.info(PASTAS.atomos, `${arquivos.length} átomo(s) verificados`);
  return rel;
}
