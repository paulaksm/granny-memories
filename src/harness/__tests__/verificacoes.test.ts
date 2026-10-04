// Portados de TestAtomos e TestRastreio em reference/python/test_harness.py.
import { beforeEach, describe, expect, test } from '@jest/globals';
import type { ArquivosEmMemoria } from '../arquivos';
import { validarAtomos } from '../atomos';
import { validarRastreio } from '../rastreio';
import type { Relatorio } from '../relatorio';
import { alterar, criarProjetoExemplo } from './fixtures';

const msgs = (rel: Relatorio) => rel.erros.map((e) => `${e.local}: ${e.msg}`).join(' | ');

let arq: ArquivosEmMemoria;
beforeEach(async () => {
  arq = await criarProjetoExemplo();
});

describe('atomos', () => {
  test('projeto válido', async () => {
    expect((await validarAtomos(arq)).erros).toEqual([]);
  });

  test('trecho que não existe na transcrição', async () => {
    await alterar(arq, 'notas/atoms/A-003.md', (t) => t.replace('erro de planilha', 'erro de cálculo'));
    expect(msgs(await validarAtomos(arq))).toContain('trecho_literal não encontrado');
  });

  test('relacionado para átomo inexistente', async () => {
    await alterar(arq, 'notas/atoms/A-004.md', (t) => t.replace('A-003 (complementa)', 'A-099 (repete)'));
    expect(msgs(await validarAtomos(arq))).toContain('átomo inexistente');
  });

  test('relação inválida', async () => {
    await alterar(arq, 'notas/atoms/A-004.md', (t) => t.replace('(complementa)', '(parecido)'));
    expect(msgs(await validarAtomos(arq))).toContain('inválida');
  });

  test('campo obrigatório ausente', async () => {
    await alterar(arq, 'notas/atoms/A-001.md', (t) => t.replace(/resumo: .*\n/, ''));
    expect(msgs(await validarAtomos(arq))).toContain('resumo');
  });
});

describe('rastreio', () => {
  test('projeto válido', async () => {
    expect((await validarRastreio(arq)).erros).toEqual([]);
  });

  test('ID inexistente', async () => {
    await alterar(arq, 'livro/capitulos/C-02.md', (t) => t + '\nUm fato novo. <!-- A-099 -->\n');
    expect(msgs(await validarRastreio(arq))).toContain('A-099 citado mas não existe');
  });

  test('ID malformado', async () => {
    await alterar(arq, 'livro/capitulos/C-02.md', (t) => t + '\nOutro fato. <!-- A-4 -->\n');
    expect(msgs(await validarRastreio(arq))).toContain('malformado');
  });

  test('parágrafo sem átomo é aviso, ou erro no modo estrito', async () => {
    await alterar(arq, 'livro/capitulos/C-02.md', (t) => t + '\nUma frase sem origem.\n');
    const normal = await validarRastreio(arq);
    expect(normal.erros).toEqual([]);
    expect(normal.avisos.some((a) => a.msg.includes('sem átomo'))).toBe(true);
    expect(msgs(await validarRastreio(arq, true))).toContain('sem átomo');
  });

  test('átomo não usado vira aviso', async () => {
    await alterar(arq, 'livro/capitulos/C-02.md', (t) => t.replace(' <!-- A-004 -->', ''));
    expect((await validarRastreio(arq)).avisos.some((a) => a.msg.includes('A-004'))).toBe(true);
  });
});
