// Testes das peças novas da fatia (docs/harness-fatia.md). Dados sintéticos.
import { describe, expect, test } from '@jest/globals';
import { ArquivosEmMemoria } from '../arquivos';
import { validarAtomos } from '../atomos';
import { calcularEstatisticas } from '../estilo';
import { verificarLimpeza } from '../limpeza';
import { validarRastreio } from '../rastreio';
import {
  atomosParaArquivos,
  capituloParaArquivos,
  guiaDeVoz,
  guiaParaRedator,
  lerTracos,
  localizarTrecho,
  marcarTraco,
} from '../serializar';
import {
  corrigirDuvida,
  listarDuvidas,
  paragrafosDoScribe,
  paragrafosParaTexto,
} from '../transcricao';

const CLEAN =
  '---\narquivo: audio-01.m4a\nduração: 00:42\nqualidade: boa\n---\n' +
  '[00:03] Toda sexta-feira a casa cheirava a laranja. Era dia de bolo.\n\n' +
  '[00:14] Eu ficava na porta da cozinha esperando a forma sair do forno.\n\n' +
  '[00:30] Aprendi mais cozinhando junto do que em qualquer livro.\n';

describe('transcrição', () => {
  const resposta = {
    words: [
      { text: 'Toda', start: 0.2, end: 0.5, type: 'word', logprob: -0.01 },
      { text: ' ', type: 'spacing' },
      { text: 'sexta.', start: 0.5, end: 0.9, type: 'word', logprob: -0.02 },
      { text: ' ', type: 'spacing' },
      { text: 'Mirtes', start: 3.0, end: 3.4, type: 'word', logprob: -2.3 },
      { text: ' ', type: 'spacing' },
      { text: 'cortava.', start: 3.4, end: 3.9, type: 'word', logprob: -0.1 },
    ],
  };

  test('pausa abre parágrafo e baixa confiança vira [?]', () => {
    const texto = paragrafosParaTexto(paragrafosDoScribe(resposta));
    expect(texto).toBe('[00:00] Toda sexta.\n\n[00:03] [?Mirtes] cortava.\n');
  });

  test('correção troca só a marca escolhida', () => {
    const texto = '[00:00] A [?Mirtes] e a [?Lurdes] cortavam.\n';
    expect(listarDuvidas(texto).map((d) => d.palavra)).toEqual(['Mirtes', 'Lurdes']);
    expect(corrigirDuvida(texto, 1, 'Lourdes')).toBe('[00:00] A [?Mirtes] e a Lourdes cortavam.\n');
  });
});

describe('limpeza', () => {
  test('tirar hesitação passa', () => {
    const rel = verificarLimpeza('audio-01', ['é... Toda sexta, né, a casa cheirava'], ['Toda sexta, né, a casa cheirava']);
    expect(rel.erros).toEqual([]);
  });

  test('palavra nova é erro', () => {
    const rel = verificarLimpeza('audio-01', ['a casa cheirava a laranja'], ['a residência cheirava a laranja']);
    expect(rel.erros[0].msg).toContain('residência');
  });

  test('parágrafo encolhido é aviso e contagem diferente é erro', () => {
    const longo = 'toda sexta feira a casa inteira cheirava a laranja porque era dia de bolo';
    expect(verificarLimpeza('audio-01', [longo], ['era dia de bolo']).avisos).toHaveLength(1);
    expect(verificarLimpeza('audio-01', [longo, longo], [longo]).ok).toBe(false);
  });
});

describe('átomos gerados por código', () => {
  test('fonte calculada atravessa parágrafos', () => {
    const loc = localizarTrecho('audio-01', CLEAN, 'Era dia de bolo. Eu ficava na porta');
    expect(loc).toEqual({ audio: 'audio-01', inicio: '00:03', fim: '00:30' });
  });

  test('saída passa no `atomos` e trecho inexistente é descartado', async () => {
    const { gerados, descartados } = atomosParaArquivos(
      'audio-01',
      CLEAN,
      [
        { tipo: 'História', resumo: 'Sexta era dia de bolo de laranja', trecho_literal: 'Toda sexta-feira a casa cheirava a laranja. Era dia de bolo.' },
        { tipo: 'fato', resumo: 'Inventado', trecho_literal: 'Isso ela nunca disse.' },
        { tipo: 'opinião', resumo: 'Aprendeu cozinhando', trecho_literal: 'Aprendi mais cozinhando junto do que em qualquer livro.', relacionado: [{ indice: 0, relacao: 'complementa' }] },
      ],
      1,
    );
    expect(descartados.map((d) => d.indice)).toEqual([1]);
    expect(gerados.map((g) => g.id)).toEqual(['A-001', 'A-002']);
    expect(gerados[1].conteudo).toContain('relacionado: A-001 (complementa)');
    expect(gerados[1].conteudo).toContain('fonte: audio-01 [00:30-00:42]');

    const arq = new ArquivosEmMemoria();
    await arq.escrever('transcricoes/clean/audio-01.md', CLEAN);
    for (const g of gerados) await arq.escrever(`notas/atoms/${g.id}.md`, g.conteudo);
    expect((await validarAtomos(arq)).erros).toEqual([]);
  });
});

describe('capítulo gerado por código', () => {
  test('saída passa no `rastreio` e contradição vira pergunta', async () => {
    const arq = new ArquivosEmMemoria();
    const { gerados } = atomosParaArquivos(
      'audio-01',
      CLEAN,
      [{ tipo: 'história', resumo: 'Bolo', trecho_literal: 'Era dia de bolo.' }],
      1,
    );
    await arq.escrever('notas/atoms/A-001.md', gerados[0].conteudo);
    const { capitulo, perguntas } = capituloParaArquivos(
      {
        titulo: 'O bolo de laranja',
        paragrafos: [
          { texto: 'Toda sexta era dia de bolo.', atomos: ['A-001'] },
          { texto: 'E então veio a tarde.', atomos: [] },
        ],
        notas: ['Juntei os dois trechos da sexta-feira.'],
        perguntas: [{ texto: 'Quem cortava o primeiro pedaço?', origem: ['A-001'], tipo: 'lacuna' }],
      },
      [['A-001', 'A-002']],
    );
    await arq.escrever('livro/capitulos/C-01.md', capitulo);
    const rel = await validarRastreio(arq);
    expect(rel.erros).toEqual([]);
    expect(rel.avisos.some((a) => a.msg.includes('sem átomo'))).toBe(true);
    expect(perguntas.map((p) => p.tipo)).toEqual(['lacuna', 'contradição']);
  });
});

describe('guia de voz', () => {
  const guia = guiaDeVoz(
    ['audio-01'],
    ['palavras: 30'],
    [{ trecho: 'Era dia de bolo.', fonte: 'audio-01 [00:03]' }],
    [
      { marcador: ' ', nome: 'Ritmo', traco: 'Frases curtas', evidencia: 'Era dia de bolo.', fonte: 'audio-01 [00:03]', ocorrencias: 4 },
      { marcador: ' ', nome: 'Abertura', traco: 'Começa por uma cena', evidencia: 'Toda sexta-feira', fonte: 'audio-01 [00:03]', ocorrencias: 1 },
    ],
  );

  test('nasce rascunho e só fica aprovado quando todos os traços foram decididos', () => {
    expect(guia).toContain('status: rascunho');
    const um = marcarTraco(guia, 0, 'x');
    expect(um).toContain('status: rascunho');
    const dois = marcarTraco(um, 1, '-');
    expect(dois).toContain('status: aprovado');
    expect(lerTracos(dois).map((t) => t.marcador)).toEqual(['x', '-']);
  });

  test('o redator recebe só os traços aprovados', () => {
    const final = marcarTraco(marcarTraco(guia, 0, 'x'), 1, '-');
    const paraRedator = guiaParaRedator(final);
    expect(paraRedator).toContain('Frases curtas');
    expect(paraRedator).not.toContain('Começa por uma cena');
    expect(guiaParaRedator(guia)).not.toContain('Frases curtas');
  });
});

describe('estatísticas de estilo', () => {
  test('conta frases, oralidade, pessoa e expressões', () => {
    const e = calcularEstatisticas([
      '[00:00] Olha, a gente ia na feira, né. A gente ia cedo. A gente ia sempre. Eu gostava, né.',
    ]);
    expect(e.frases).toBe(4);
    expect(e.oralidade).toEqual([['né', 2], ['olha', 1]]);
    expect(e.pessoa).toEqual([['eu', 1], ['a gente', 3], ['nós', 0]]);
    expect(e.expressoes.map(([t]) => t)).toContain('gente ia');
  });
});
