// O runner de ponta a ponta com Scribe e modelo falsos (dados sintéticos).
import { describe, expect, test } from '@jest/globals';
import { ArquivosEmMemoria } from '../arquivos';
import type { ModeloLocal, Pedido } from '../modelo';
import { ANALISTA_VOZ, EXTRATOR, LIMPEZA, REDATOR } from '../prompts';
import { Runner } from '../runner';
import { lerTracos, marcarTraco } from '../serializar';
import { corrigirDuvida } from '../transcricao';

const palavra = (text: string, start: number, logprob = -0.05) => [
  { text, start, end: start + 0.4, type: 'word', logprob },
  { text: ' ', type: 'spacing' },
];

const SCRIBE = {
  words: [
    ...palavra('Toda', 3.0),
    ...palavra('sexta-feira', 3.4),
    ...palavra('a', 3.8),
    ...palavra('casa', 4.0),
    ...palavra('cheirava', 4.4),
    ...palavra('a', 4.8),
    ...palavra('laranja.', 5.0),
    ...palavra('Era', 5.4),
    ...palavra('dia', 5.8),
    ...palavra('de', 6.0),
    ...palavra('bolo.', 6.2),
    ...palavra('Hum,', 14.0),
    ...palavra('a', 14.4),
    ...palavra('Mirtes', 14.8, -2.5),
    ...palavra('cortava', 15.2),
    ...palavra('o', 15.6),
    ...palavra('primeiro', 15.8),
    ...palavra('pedaço.', 16.2),
  ],
};

class ModeloFalso implements ModeloLocal {
  pedidos: Pedido[] = [];
  async carregar() {}
  async liberar() {}
  async gerar(p: Pedido): Promise<unknown> {
    this.pedidos.push(p);
    if (p.sistema.endsWith(LIMPEZA)) {
      const texto = p.usuario.split('\n\n')[0];
      // Primeira tentativa troca uma palavra; a verificação recusa e o runner mantém o texto.
      if (texto.startsWith('Toda')) return { texto: texto.replace('casa', 'residência') };
      return { texto: texto.replace(/^Hum, /, '') };
    }
    if (p.sistema.endsWith(EXTRATOR)) {
      return {
        atomos: [
          { tipo: 'história', resumo: 'Sexta era dia de bolo', trecho_literal: 'Toda sexta-feira a casa cheirava a laranja. Era dia de bolo.', pessoas: [], datas_locais_numeros: ['sexta-feira'], relacionado: [] },
          { tipo: 'fato', resumo: 'Lourdes cortava o primeiro pedaço', trecho_literal: 'a Lourdes cortava o primeiro pedaço.', pessoas: ['Lourdes'], datas_locais_numeros: [], relacionado: [{ indice: 0, relacao: 'complementa' }] },
        ],
      };
    }
    if (p.sistema.endsWith(ANALISTA_VOZ)) {
      return {
        tracos: [
          { nome: 'Ritmo', traco: 'Frases curtas.', evidencia_literal: 'Era dia de bolo.', ocorrencias: 2 },
          { nome: 'Abertura', traco: 'Começa por uma cena.', evidencia_literal: 'Isso não está no áudio.', ocorrencias: 1 },
        ],
      };
    }
    if (p.sistema.endsWith(REDATOR)) {
      return {
        titulo: 'O bolo de laranja',
        paragrafos: [
          { texto: 'Toda sexta-feira a casa cheirava a laranja. Era dia de bolo.', atomos: ['A-001'] },
          { texto: 'A Lourdes cortava o primeiro pedaço.', atomos: ['A-002'] },
        ],
        notas: ['Mantive a ordem do áudio.'],
        perguntas: [{ texto: 'Quem era a Lourdes?', origem: ['A-002'], tipo: 'confirmação' }],
      };
    }
    throw new Error('pedido inesperado');
  }
}

describe('runner', () => {
  test('do áudio ao capítulo, com correção, voz aprovada e rastreio', async () => {
    const arq = new ArquivosEmMemoria();
    const modelo = new ModeloFalso();
    const runner = new Runner(arq, modelo);

    expect((await runner.transcrever('audio-01', async () => SCRIBE, '00:20')).ok).toBe(true);
    const raw = await arq.ler('transcricoes/raw/audio-01.txt');
    expect(raw).toContain('[?Mirtes]');

    // A autora corrige a palavra duvidosa; o bruto não muda.
    const revisada = await arq.ler('transcricoes/revisada/audio-01.txt');
    await arq.escrever('transcricoes/revisada/audio-01.txt', corrigirDuvida(revisada, 0, 'Lourdes'));
    expect(await arq.ler('transcricoes/raw/audio-01.txt')).toBe(raw);

    const limpeza = await runner.limpar('audio-01');
    expect(limpeza.avisos.some((a) => a.msg.includes('mantido o texto revisado'))).toBe(true);
    const clean = await arq.ler('transcricoes/clean/audio-01.md');
    expect(clean).toContain('a casa cheirava');
    expect(clean).toContain('[00:14] a Lourdes cortava');

    expect((await runner.extrair('audio-01')).erros).toEqual([]);
    expect((await runner.perfil(['audio-01'])).ok).toBe(true);

    // Traço sem evidência real foi descartado; redigir exige a decisão da autora.
    let guia = await arq.ler('voz/guia-de-voz.md');
    expect(lerTracos(guia).map((t) => t.nome)).toEqual(['Ritmo']);
    expect((await runner.redigir()).ok).toBe(false);

    guia = marcarTraco(guia, 0, 'x');
    await arq.escrever('voz/guia-de-voz.md', guia);
    const rastreio = await runner.redigir();
    expect(rastreio.erros).toEqual([]);

    const pedidoRedator = modelo.pedidos.filter((p) => p.sistema.endsWith(REDATOR)).pop()!;
    expect(pedidoRedator.usuario).toContain('Frases curtas.');
    expect(await arq.ler('livro/capitulos/C-01.md')).toContain('<!-- A-002 -->');
    expect(await arq.ler('controle/perguntas.md')).toContain('pergunta: Quem era a Lourdes?');

    const estado = await runner.estado();
    expect(estado['audio-01'].extrair?.status).toBe('ok');
    expect(estado.livro.redigir?.status).toBe('ok');
  });
});
