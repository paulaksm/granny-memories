// Runner determinístico da fatia (docs/harness-fatia.md, "Runner"). Sem agente
// orquestrador: cada etapa lê arquivos, chama o modelo com esquema, grava arquivos
// pelo código e roda a verificação. Uma nova tentativa por verificação que falha.
import type { Arquivos } from './arquivos';
import { validarAtomos } from './atomos';
import { ESQUEMA_ANALISTA, ESQUEMA_EXTRATOR, ESQUEMA_LIMPEZA, ESQUEMA_REDATOR } from './esquemas';
import { calcularEstatisticas, estatisticasComoTexto } from './estilo';
import { verificarLimpeza } from './limpeza';
import { type ModeloLocal, TEMPERATURAS } from './modelo';
import { ARQUIVOS, carregarAtomos, PASTAS } from './projeto';
import { ANALISTA_VOZ, EXTRATOR, LIMPEZA, REDATOR, sistema } from './prompts';
import { validarRastreio } from './rastreio';
import { Relatorio } from './relatorio';
import {
  type AtomoModelo,
  atomosParaArquivos,
  type CapituloModelo,
  capituloParaArquivos,
  type Exemplo,
  guiaDeVoz,
  guiaParaRedator,
  linhaPergunta,
  localizarTrecho,
  type Traco,
} from './serializar';
import { lerCabecalho } from './texto';
import {
  lerParagrafos,
  listarDuvidas,
  paragrafosDoScribe,
  paragrafosParaTexto,
  type RespostaScribe,
} from './transcricao';

export type Etapa = 'transcrever' | 'limpar' | 'extrair' | 'perfil' | 'redigir';
export type Status = 'pendente' | 'rodando' | 'ok' | 'falhou';
export type Estado = Record<string, Partial<Record<Etapa, { status: Status; msg?: string }>>>;

export type Progresso = (etapa: Etapa, fracao: number) => void;

const ESCOPO_LIVRO = 'livro';

export class Runner {
  constructor(
    private arq: Arquivos,
    private modelo: ModeloLocal,
    private onProgresso: Progresso = () => {},
  ) {}

  // ---------------------------------------------------------------- estado
  async estado(): Promise<Estado> {
    if (!(await this.arq.existe(ARQUIVOS.estado))) return {};
    return JSON.parse(await this.arq.ler(ARQUIVOS.estado)) as Estado;
  }

  private async marcar(escopo: string, etapa: Etapa, status: Status, msg?: string) {
    const e = await this.estado();
    e[escopo] = { ...e[escopo], [etapa]: { status, ...(msg ? { msg } : {}) } };
    await this.arq.escrever(ARQUIVOS.estado, JSON.stringify(e, null, 2));
  }

  private async rodar(escopo: string, etapa: Etapa, fn: () => Promise<Relatorio>): Promise<Relatorio> {
    await this.marcar(escopo, etapa, 'rodando');
    try {
      const rel = await fn();
      await this.marcar(escopo, etapa, rel.ok ? 'ok' : 'falhou', rel.ok ? undefined : rel.errosComoTexto());
      return rel;
    } catch (e) {
      await this.marcar(escopo, etapa, 'falhou', String(e));
      throw e;
    }
  }

  // ---------------------------------------------------------------- 2. transcrever
  /** Grava a resposta original (imutável), o .txt bruto e a cópia revisável. */
  async transcrever(audio: string, transcrever: () => Promise<RespostaScribe>, duracao?: string) {
    return this.rodar(audio, 'transcrever', async () => {
      const rel = new Relatorio('transcrever');
      const rawJson = `${PASTAS.raw}/${audio}.json`;
      if (await this.arq.existe(rawJson)) {
        rel.info(audio, 'transcrição original já existe; não foi refeita');
        return rel;
      }
      const resposta = await transcrever();
      const texto = paragrafosParaTexto(paragrafosDoScribe(resposta));
      await this.arq.escrever(rawJson, JSON.stringify(resposta));
      await this.arq.escrever(`${PASTAS.raw}/${audio}.txt`, texto);
      await this.arq.escrever(`${PASTAS.revisada}/${audio}.txt`, texto);
      if (duracao) await this.arq.escrever(`${PASTAS.raw}/${audio}.duracao`, duracao);
      rel.info(audio, `${listarDuvidas(texto).length} palavra(s) duvidosa(s)`);
      return rel;
    });
  }

  // ---------------------------------------------------------------- 3. limpar
  async limpar(audio: string) {
    return this.rodar(audio, 'limpar', async () => {
      const rel = new Relatorio('limpeza');
      const revisado = await this.arq.ler(`${PASTAS.revisada}/${audio}.txt`);
      const paragrafos = lerParagrafos(revisado);
      const limpos: string[] = [];
      for (const [i, p] of paragrafos.entries()) {
        this.onProgresso('limpar', i / paragrafos.length);
        let limpo = await this.limparParagrafo(p.texto);
        let verif = verificarLimpeza(audio, [p.texto], [limpo]);
        if (!verif.ok) {
          limpo = await this.limparParagrafo(p.texto, verif.errosComoTexto());
          verif = verificarLimpeza(audio, [p.texto], [limpo]);
        }
        if (!verif.ok) {
          // Na dúvida, fica a fala como foi dita: nada inventado entra no texto.
          rel.aviso(`${audio} §${i + 1}`, `limpeza recusada (${verif.erros[0].msg}); mantido o texto revisado`);
          limpo = p.texto;
        }
        verif.avisos.forEach((a) => rel.aviso(a.local, a.msg));
        limpos.push(limpo);
      }
      const duvidas = listarDuvidas(revisado).length;
      const total = (revisado.match(/[\p{L}]+/gu) ?? []).length || 1;
      const qualidade = duvidas / total > 0.08 ? 'baixa' : duvidas / total > 0.03 ? 'média' : 'boa';
      const duracaoArq = `${PASTAS.raw}/${audio}.duracao`;
      const duracao = (await this.arq.existe(duracaoArq)) ? await this.arq.ler(duracaoArq) : '';
      const corpo = paragrafos.map((p, i) => `[${p.marca}] ${limpos[i]}`).join('\n\n');
      await this.arq.escrever(
        `${PASTAS.clean}/${audio}.md`,
        `---\narquivo: ${audio}\n${duracao ? `duração: ${duracao}\n` : ''}` +
          `qualidade: ${qualidade} (${duvidas} palavra(s) duvidosa(s))\n---\n${corpo}\n`,
      );
      return rel;
    });
  }

  private async limparParagrafo(texto: string, erros?: string): Promise<string> {
    const r = (await this.modelo.gerar({
      sistema: sistema(LIMPEZA),
      usuario: erros ? `${texto}\n\nA tentativa anterior foi recusada:\n${erros}` : texto,
      esquema: ESQUEMA_LIMPEZA,
      maxTokens: Math.max(256, texto.length),
      temperatura: TEMPERATURAS.limpeza,
    })) as { texto: string };
    return (r.texto ?? '').replace(/\s+/g, ' ').trim();
  }

  // ---------------------------------------------------------------- 4. extrair
  async extrair(audio: string) {
    return this.rodar(audio, 'extrair', async () => {
      const clean = await this.arq.ler(`${PASTAS.clean}/${audio}.md`);
      const corpo = lerCabecalho(clean)[1];
      const proximo = (await this.maiorIdAtomo()) + 1;

      let melhor = atomosParaArquivos(audio, clean, await this.pedirAtomos(corpo), proximo);
      if (melhor.descartados.length || melhor.gerados.length === 0) {
        const feedback =
          melhor.gerados.length === 0
            ? 'Nenhum átomo válido. Copie trechos exatos da transcrição.'
            : `${melhor.descartados.length} átomo(s) com trecho_literal que não existe na transcrição. ` +
              'Copie os trechos exatamente como estão, sem mudar palavras.';
        const segunda = atomosParaArquivos(audio, clean, await this.pedirAtomos(corpo, feedback), proximo);
        if (segunda.gerados.length > melhor.gerados.length) melhor = segunda;
      }
      for (const g of melhor.gerados) await this.arq.escrever(`${PASTAS.atomos}/${g.id}.md`, g.conteudo);

      const rel = await validarAtomos(this.arq);
      for (const d of melhor.descartados) rel.aviso(audio, `ideia ${d.indice + 1} descartada: ${d.motivo}`);
      if (melhor.gerados.length === 0) rel.erro(audio, 'nenhuma ideia extraída');
      return rel;
    });
  }

  private async pedirAtomos(corpo: string, feedback?: string): Promise<AtomoModelo[]> {
    const r = (await this.modelo.gerar({
      sistema: sistema(EXTRATOR),
      usuario: feedback ? `${corpo}\n\n${feedback}` : corpo,
      esquema: ESQUEMA_EXTRATOR,
      maxTokens: 3072,
      temperatura: TEMPERATURAS.extrator,
    })) as { atomos: AtomoModelo[] };
    return r.atomos ?? [];
  }

  private async maiorIdAtomo(): Promise<number> {
    const nums = (await this.arq.listar(PASTAS.atomos))
      .map((n) => /^A-(\d+)\.md$/.exec(n)?.[1])
      .filter((n): n is string => !!n)
      .map(Number);
    return nums.length ? Math.max(...nums) : 0;
  }

  // ---------------------------------------------------------------- 5. perfil de voz
  async perfil(audios: string[]) {
    return this.rodar(ESCOPO_LIVRO, 'perfil', async () => {
      const rel = new Relatorio('perfil');
      const cleans: Record<string, string> = {};
      for (const a of audios) cleans[a] = await this.arq.ler(`${PASTAS.clean}/${a}.md`);
      const corpos = audios.map((a) => lerCabecalho(cleans[a])[1]);
      const estatisticas = estatisticasComoTexto(calcularEstatisticas(corpos));
      const exemplos = await this.escolherExemplos();

      const entrada =
        `ESTATÍSTICAS\n${estatisticas.map((e) => `- ${e}`).join('\n')}\n\n` +
        audios.map((a, i) => `TRANSCRIÇÃO ${a}\n${corpos[i]}`).join('\n\n').slice(0, 12000);
      let tracos = this.validarTracos(await this.pedirTracos(entrada), cleans);
      if (tracos.length === 0) {
        tracos = this.validarTracos(
          await this.pedirTracos(`${entrada}\n\nA evidência precisa ser um trecho exato da transcrição.`),
          cleans,
        );
      }
      if (tracos.length === 0) rel.erro('voz', 'nenhum traço com evidência encontrada na transcrição');
      await this.arq.escrever(ARQUIVOS.guiaVoz, guiaDeVoz(audios, estatisticas, exemplos, tracos));
      return rel;
    });
  }

  private async pedirTracos(entrada: string) {
    const r = (await this.modelo.gerar({
      sistema: sistema(ANALISTA_VOZ),
      usuario: entrada,
      esquema: ESQUEMA_ANALISTA,
      maxTokens: 1024,
      temperatura: TEMPERATURAS.analista,
    })) as { tracos: { nome: string; traco: string; evidencia_literal: string; ocorrencias: number }[] };
    return r.tracos ?? [];
  }

  private validarTracos(
    brutos: { nome: string; traco: string; evidencia_literal: string; ocorrencias: number }[],
    cleans: Record<string, string>,
  ): Traco[] {
    const tracos: Traco[] = [];
    for (const t of brutos.slice(0, 3)) {
      for (const [audio, clean] of Object.entries(cleans)) {
        const loc = localizarTrecho(audio, clean, t.evidencia_literal);
        if (loc) {
          tracos.push({
            marcador: ' ',
            nome: t.nome,
            traco: t.traco,
            evidencia: t.evidencia_literal,
            fonte: `${audio} [${loc.inicio}]`,
            ocorrencias: t.ocorrencias,
          });
          break;
        }
      }
    }
    return tracos;
  }

  /** De 3 a 5 trechos de ideias já validadas, priorizando histórias e citações. */
  private async escolherExemplos(): Promise<Exemplo[]> {
    const atomos = Object.values(await carregarAtomos(this.arq));
    const peso = (t: string) => (t === 'história' ? 0 : t === 'citação' ? 1 : 2);
    return atomos
      .filter((a) => (a.trecho_literal ?? '').length >= 40 && (a.trecho_literal ?? '').length <= 400)
      .sort((a, b) => peso(a.tipo) - peso(b.tipo))
      .slice(0, 5)
      .map((a) => ({ trecho: a.trecho_literal, fonte: (a.fonte ?? '').replace(/-[\d:]+\]$/, ']') }));
  }

  // ---------------------------------------------------------------- 6. redigir
  /** `audios`, na ordem do capítulo; sem a lista, usa todas as ideias. */
  async redigir(capitulo = 'C-01', audios?: string[]) {
    return this.rodar(ESCOPO_LIVRO, 'redigir', async () => {
      const guia = await this.arq.ler(ARQUIVOS.guiaVoz);
      if (!guia.includes('status: aprovado')) {
        const rel = new Relatorio('rastreio');
        rel.erro('voz', 'a autora ainda não decidiu todos os traços de voz');
        return rel;
      }
      const todos = await carregarAtomos(this.arq);
      const audioDe = (id: string) => (todos[id].fonte ?? '').split(' ')[0];
      const ordem = (id: string) => (audios ? audios.indexOf(audioDe(id)) : 0);
      const ids = Object.keys(todos)
        .filter((id) => !audios || audios.includes(audioDe(id)))
        .sort((a, b) => ordem(a) - ordem(b) || a.localeCompare(b));
      const atomos = Object.fromEntries(ids.map((id) => [id, todos[id]]));
      if (ids.length === 0) {
        const rel = new Relatorio('rastreio');
        rel.erro(capitulo, 'nenhuma ideia nos áudios deste capítulo');
        return rel;
      }
      const outline = `${capitulo}: um capítulo com todas as ideias abaixo (${ids.join(', ')}).`;
      const textoAtomos = ids
        .map((id) => {
          const a = atomos[id];
          return `${id} | ${a.tipo} | ${a.fonte}\ntrecho: ${a.trecho_literal}`;
        })
        .join('\n\n');
      const contradicoes: [string, string][] = [];
      for (const [id, a] of Object.entries(atomos)) {
        for (const m of (a.relacionado ?? '').matchAll(/(A-\d{3,})\s*\(\s*contradiz\s*\)/g)) {
          if (id < m[1]) contradicoes.push([id, m[1]]);
        }
      }
      const entrada =
        `OUTLINE\n${outline}\n\nGUIA DE VOZ\n${guiaParaRedator(guia)}\n\nÁTOMOS\n${textoAtomos}\n\n` +
        'CAPÍTULO ANTERIOR\n(nenhum)\n\nDECISÕES\n(nenhuma)';

      let rel = await this.escreverCapitulo(capitulo, entrada, contradicoes);
      if (!rel.ok) {
        rel = await this.escreverCapitulo(
          capitulo,
          `${entrada}\n\nA tentativa anterior foi recusada:\n${rel.errosComoTexto()}`,
          contradicoes,
        );
      }
      return rel;
    });
  }

  private async escreverCapitulo(capitulo: string, entrada: string, contradicoes: [string, string][]) {
    const cap = (await this.modelo.gerar({
      sistema: sistema(REDATOR),
      usuario: entrada,
      esquema: ESQUEMA_REDATOR,
      maxTokens: 2048,
      temperatura: TEMPERATURAS.redator,
    })) as CapituloModelo;
    const { capitulo: texto, notas, perguntas } = capituloParaArquivos(cap, contradicoes);
    await this.arq.escrever(`${PASTAS.capitulos}/${capitulo}.md`, texto);
    await this.arq.escrever(`${PASTAS.capitulos}/${capitulo}.notas.md`, notas);
    await this.arq.escrever(ARQUIVOS.perguntas, perguntas.map((p) => linhaPergunta(p)).join('\n') + '\n');
    return validarRastreio(this.arq);
  }
}
