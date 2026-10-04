// Estado do app (livros, capítulos, áudios, ordem) e o processamento longo
// (transcrever, ler a voz, escrever, baixar o modelo). Tudo no aparelho;
// só o áudio sai, para o Scribe. Persistido em projeto/controle/app.json.
import { DownloadTask, File, Paths } from 'expo-file-system';
import * as SecureStore from 'expo-secure-store';
import { useSyncExternalStore } from 'react';
import { ARQUIVOS, PASTAS } from '../harness/projeto';
import { Runner } from '../harness/runner';
import { marcaTempo } from '../harness/texto';
import type { RespostaScribe } from '../harness/transcricao';
import { ModeloLlama } from '../modelo/llama';
import { ErroScribe, transcrever } from '../servicos/scribe';
import { ArquivosExpo, arquivoDeAudio, caminhoNativo } from './arquivosExpo';

export type Livro = { id: string; titulo: string };
export type Capitulo = { id: string; livroId: string; titulo: string; audios: string[] };
export type Audio = {
  id: string;
  nome: string;
  arquivo: string;
  duracao: string;
  livroId: string | null;
};
export type Dados = { livros: Livro[]; capitulos: Capitulo[]; audios: Audio[]; seq: number };

export type Tarefa = {
  tipo: 'transcrever' | 'ler' | 'escrever' | 'baixar';
  alvo: string;
  fracao: number;
};

export type EstadoModelo = 'ausente' | 'baixando' | 'baixado';

export const CHAVE_ELEVENLABS = 'elevenlabs_api_key';
export const NOME_MODELO = 'gemma-4-E2B-it-Q4_K_M.gguf';
export const URL_MODELO = `https://huggingface.co/unsloth/gemma-4-E2B-it-GGUF/resolve/main/${NOME_MODELO}`;
export const TAMANHO_MODELO = '3,1 GB';

const DADOS_INICIAIS: Dados = {
  livros: [{ id: 'L-01', titulo: 'Meu livro' }],
  capitulos: [{ id: 'C-01', livroId: 'L-01', titulo: 'Capítulo 1', audios: [] }],
  audios: [],
  seq: 1,
};

const arq = new ArquivosExpo();
export const arquivosProjeto = arq;
const CAMINHO_DADOS = `${PASTAS.controle}/app.json`;
export const arquivoModelo = () => new File(Paths.document, NOME_MODELO);

type Estado = {
  pronto: boolean;
  dados: Dados;
  tarefa: Tarefa | null;
  semRede: string[];
  erro: string | null;
  modelo: EstadoModelo;
  progressoModelo: number;
  versao: number;
};

let estado: Estado = {
  pronto: false,
  dados: DADOS_INICIAIS,
  tarefa: null,
  semRede: [],
  erro: null,
  modelo: 'ausente',
  progressoModelo: 0,
  versao: 0,
};
const ouvintes = new Set<() => void>();

function mudar(parcial: Partial<Estado>) {
  estado = { ...estado, ...parcial, versao: estado.versao + 1 };
  ouvintes.forEach((o) => o());
}

export function useLoja(): Estado {
  return useSyncExternalStore(
    (o) => {
      ouvintes.add(o);
      return () => ouvintes.delete(o);
    },
    () => estado,
  );
}

export const lerEstado = () => estado;

async function salvar(dados: Dados) {
  mudar({ dados });
  await arq.escrever(CAMINHO_DADOS, JSON.stringify(dados, null, 2));
}

export async function iniciar() {
  let dados = DADOS_INICIAIS;
  if (await arq.existe(CAMINHO_DADOS)) dados = JSON.parse(await arq.ler(CAMINHO_DADOS)) as Dados;
  else await arq.escrever(CAMINHO_DADOS, JSON.stringify(dados, null, 2));
  mudar({ pronto: true, dados, modelo: arquivoModelo().exists ? 'baixado' : 'ausente' });
}

// ------------------------------------------------------------------ consultas
export const numeroAudio = (id: string) => Number(id.replace('audio-', ''));
export const rotuloAudio = (id: string) => `Áudio ${numeroAudio(id)}`;

export function capituloDoAudio(d: Dados, audioId: string): Capitulo | undefined {
  return d.capitulos.find((c) => c.audios.includes(audioId));
}

export type StatusAudio = 'ready' | 'transcribing' | 'queued';

export async function statusDosAudios(): Promise<Record<string, StatusAudio>> {
  const e = await new Runner(arq, modeloCompartilhado()).estado();
  const r: Record<string, StatusAudio> = {};
  for (const a of estado.dados.audios) {
    const s = e[a.id]?.transcrever?.status;
    r[a.id] =
      s === 'ok' ? 'ready' : estado.tarefa?.tipo === 'transcrever' && estado.tarefa.alvo === a.id ? 'transcribing' : 'queued';
  }
  return r;
}

// ------------------------------------------------------------------ livros e capítulos
export async function renomearLivro(id: string, titulo: string) {
  const d = estado.dados;
  await salvar({ ...d, livros: d.livros.map((l) => (l.id === id ? { ...l, titulo } : l)) });
}

export async function excluirLivro(id: string, apagarAudios: boolean) {
  const d = estado.dados;
  const audiosDoLivro = d.audios.filter((a) => a.livroId === id).map((a) => a.id);
  const audios = apagarAudios
    ? d.audios.filter((a) => a.livroId !== id)
    : d.audios.map((a) => (a.livroId === id ? { ...a, livroId: null } : a));
  if (apagarAudios) {
    for (const a of d.audios.filter((x) => x.livroId === id)) {
      const f = arquivoDeAudio(a.arquivo);
      if (f.exists) f.delete();
    }
  }
  await salvar({
    ...d,
    livros: d.livros.filter((l) => l.id !== id),
    capitulos: d.capitulos.filter((c) => c.livroId !== id),
    audios,
  });
  return audiosDoLivro.length;
}

/** Põe o áudio num capítulo (ou em nenhum) e no fim da ordem dele. */
export async function definirCapitulo(audioId: string, capituloId: string | null) {
  const d = estado.dados;
  const capitulos = d.capitulos.map((c) => {
    const sem = c.audios.filter((a) => a !== audioId);
    return c.id === capituloId ? { ...c, audios: [...sem, audioId] } : { ...c, audios: sem };
  });
  const cap = capitulos.find((c) => c.id === capituloId);
  const audios = d.audios.map((a) => (a.id === audioId && cap ? { ...a, livroId: cap.livroId } : a));
  await salvar({ ...d, capitulos, audios });
}

export async function moverNoCapitulo(capituloId: string, audioId: string, delta: -1 | 1) {
  const d = estado.dados;
  const capitulos = d.capitulos.map((c) => {
    if (c.id !== capituloId) return c;
    const lista = [...c.audios];
    const i = lista.indexOf(audioId);
    const j = i + delta;
    if (i < 0 || j < 0 || j >= lista.length) return c;
    [lista[i], lista[j]] = [lista[j], lista[i]];
    return { ...c, audios: lista };
  });
  await salvar({ ...d, capitulos });
}

export async function guardarEmLivro(audioId: string, livroId: string) {
  const d = estado.dados;
  await salvar({ ...d, audios: d.audios.map((a) => (a.id === audioId ? { ...a, livroId } : a)) });
}

// ------------------------------------------------------------------ áudios
/** Copia o áudio para projeto/audios (original guardado e imutável) e transcreve. */
export async function importarAudio(origemUri: string, nome: string, livroId: string | null) {
  const d = estado.dados;
  const n = d.seq;
  const id = `audio-${String(n).padStart(2, '0')}`;
  const ext = (/\.([a-z0-9]{2,4})(?:\?|$)/i.exec(origemUri)?.[1] ?? 'm4a').toLowerCase();
  const destino = arquivoDeAudio(`${id}.${ext}`);
  if (!destino.parentDirectory.exists) destino.parentDirectory.create({ intermediates: true });
  await new File(origemUri).copy(destino);
  const audio: Audio = { id, nome: nome || `História ${n}`, arquivo: `${id}.${ext}`, duracao: '', livroId };
  await salvar({ ...d, audios: [...d.audios, audio], seq: n + 1 });
  return id;
}

const transcricoes = new Map<string, Promise<void>>();

/** Transcreve uma vez; quem chamar de novo durante a transcrição espera a mesma. */
export function transcreverAudio(id: string): Promise<void> {
  const andamento = transcricoes.get(id);
  if (andamento) return andamento;
  const p = transcreverAgora(id).finally(() => transcricoes.delete(id));
  transcricoes.set(id, p);
  return p;
}

async function transcreverAgora(id: string) {
  const audio = estado.dados.audios.find((a) => a.id === id);
  if (!audio) return;
  if (estado.tarefa) {
    mudar({ erro: 'Espere a tarefa atual terminar.' });
    return;
  }
  mudar({ tarefa: { tipo: 'transcrever', alvo: id, fracao: 0.1 }, erro: null });
  try {
    const chave = await SecureStore.getItemAsync(CHAVE_ELEVENLABS);
    const f = arquivoDeAudio(audio.arquivo);
    let duracao = '';
    const pedir = async (): Promise<RespostaScribe> => {
      const r = await transcrever(f as unknown as Blob, chave, audio.arquivo);
      const fim = Math.max(0, ...(r.words ?? []).map((w) => w.end ?? 0));
      duracao = marcaTempo(fim);
      return r;
    };
    await new Runner(arq, modeloCompartilhado()).transcrever(id, pedir, undefined);
    if (duracao) {
      await arq.escrever(`${PASTAS.raw}/${id}.duracao`, duracao);
      const d = estado.dados;
      await salvar({ ...d, audios: d.audios.map((a) => (a.id === id ? { ...a, duracao } : a)) });
    }
    mudar({ semRede: estado.semRede.filter((x) => x !== id) });
  } catch (e) {
    if (e instanceof ErroScribe && e.tipo === 'sem-rede') mudar({ semRede: [...estado.semRede, id] });
    mudar({ erro: e instanceof Error ? e.message : String(e) });
  } finally {
    mudar({ tarefa: null });
  }
}

// ------------------------------------------------------------------ modelo e harness
let modelo: ModeloLlama | null = null;
function modeloCompartilhado(): ModeloLlama {
  modelo ??= new ModeloLlama(caminhoNativo(arquivoModelo()));
  return modelo;
}

async function comModelo<T>(tipo: Tarefa['tipo'], alvo: string, fn: (r: Runner) => Promise<T>) {
  if (estado.tarefa) throw new Error('Já existe uma tarefa em andamento.');
  if (!arquivoModelo().exists) throw new Error('Baixe o modelo na Configuração antes de continuar.');
  mudar({ tarefa: { tipo, alvo, fracao: 0.02 }, erro: null });
  const runner = new Runner(arq, modeloCompartilhado(), (_etapa, fracao) =>
    mudar({ tarefa: { tipo, alvo, fracao: Math.max(estado.tarefa?.fracao ?? 0, fracao) } }),
  );
  try {
    return await fn(runner);
  } catch (e) {
    mudar({ erro: e instanceof Error ? e.message : String(e) });
    throw e;
  } finally {
    // Devolve a memória ao sistema entre tarefas (aparelhos de 8 GB).
    await modeloCompartilhado().liberar().catch(() => {});
    mudar({ tarefa: null });
  }
}

const passo = (tipo: Tarefa['tipo'], alvo: string, fracao: number) => mudar({ tarefa: { tipo, alvo, fracao } });

/** "Lendo como você fala…": limpeza, ideias e (na primeira vez) o perfil de voz. */
export async function lerComoFala(audioId: string) {
  return comModelo('ler', audioId, async (r) => {
    const limpeza = await r.limpar(audioId);
    passo('ler', audioId, 0.45);
    const ideias = await r.extrair(audioId);
    passo('ler', audioId, 0.75);
    if (!ideias.ok) throw new Error(ideias.erros[0]?.msg ?? 'Não consegui separar as ideias.');
    // Enquanto a autora não decidiu os traços, o perfil é refeito com todos os áudios lidos.
    const guiaDecidido =
      (await arq.existe(ARQUIVOS.guiaVoz)) && (await arq.ler(ARQUIVOS.guiaVoz)).includes('status: aprovado');
    if (!guiaDecidido) {
      const prontos: string[] = [];
      for (const a of estado.dados.audios) {
        if (await arq.existe(`${PASTAS.clean}/${a.id}.md`)) prontos.push(a.id);
      }
      const perfil = await r.perfil(prontos);
      if (!perfil.ok) throw new Error(perfil.erros[0]?.msg ?? 'Não consegui ler o seu jeito de contar.');
    }
    passo('ler', audioId, 1);
    return { limpeza, ideias };
  });
}

/** "Escrevendo o capítulo no seu celular". */
export async function escreverCapitulo(capituloId: string) {
  const cap = estado.dados.capitulos.find((c) => c.id === capituloId);
  if (!cap) throw new Error('Capítulo não encontrado.');
  return comModelo('escrever', capituloId, async (r) => {
    passo('escrever', capituloId, 0.1);
    const rel = await r.redigir(capituloId, cap.audios);
    if (!rel.ok) throw new Error(rel.erros[0]?.msg ?? 'Não consegui escrever o capítulo.');
    passo('escrever', capituloId, 1);
    return rel;
  });
}

export async function aprovarCapitulo(capituloId: string) {
  const caminho = `${PASTAS.capitulos}/${capituloId}.md`;
  const texto = await arq.ler(caminho);
  await arq.escrever(caminho, texto.replace(/^status: .*$/m, 'status: aprovado'));
  mudar({});
}

// ------------------------------------------------------------------ download do modelo
export async function baixarModelo() {
  if (estado.modelo !== 'ausente') return;
  mudar({ modelo: 'baixando', progressoModelo: 0, erro: null });
  try {
    const destino = new File(Paths.document, `${NOME_MODELO}.parcial`);
    const tarefa = new DownloadTask(URL_MODELO, destino, {
      onProgress: ({ bytesWritten, totalBytes }) =>
        mudar({ progressoModelo: totalBytes ? bytesWritten / totalBytes : 0 }),
    });
    const baixado = await tarefa.downloadAsync();
    if (!baixado) throw new Error('O download foi interrompido.');
    await baixado.move(arquivoModelo());
    mudar({ modelo: 'baixado', progressoModelo: 1 });
  } catch (e) {
    mudar({ modelo: 'ausente', erro: e instanceof Error ? e.message : String(e) });
  }
}

export function limparErro() {
  mudar({ erro: null });
}

export function avisarMudanca() {
  mudar({});
}
