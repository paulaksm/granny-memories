// Cliente do ElevenLabs Scribe v2 (PRD, RF2). Único serviço externo: só o áudio sai do
// aparelho. A chave é digitada na Configuração e fica no armazenamento seguro.
import type { RespostaScribe } from '../harness/transcricao';

const URL_SCRIBE = 'https://api.elevenlabs.io/v1/speech-to-text';
export const MODELO_SCRIBE = 'scribe_v2';

/** Arquivo do app ({ uri, name, type }, como o fetch do React Native aceita) ou Blob. */
export type ArquivoAudio = { uri: string; name: string; type: string } | Blob;

export type FalhaScribe = 'sem-chave' | 'chave-invalida' | 'sem-rede' | 'servico';

export class ErroScribe extends Error {
  constructor(
    public tipo: FalhaScribe,
    mensagem: string,
  ) {
    super(mensagem);
  }
}

/** Sem language_code: o idioma é detectado automaticamente (vários idiomas no mesmo áudio). */
export async function transcrever(
  arquivo: ArquivoAudio,
  chave: string | null,
  nome = 'audio.m4a',
): Promise<RespostaScribe> {
  if (!chave) throw new ErroScribe('sem-chave', 'Falta a chave da ElevenLabs na Configuração.');
  const corpo = new FormData();
  corpo.append('model_id', MODELO_SCRIBE);
  corpo.append('timestamps_granularity', 'word');
  corpo.append('tag_audio_events', 'false');
  if (arquivo instanceof Blob) corpo.append('file', arquivo, nome);
  else corpo.append('file', arquivo as unknown as Blob);

  let resposta: Response;
  try {
    resposta = await fetch(URL_SCRIBE, { method: 'POST', headers: { 'xi-api-key': chave }, body: corpo });
  } catch {
    throw new ErroScribe('sem-rede', 'Sem internet. O áudio ficou na fila.');
  }
  if (resposta.status === 401) {
    throw new ErroScribe('chave-invalida', 'A chave da ElevenLabs não foi aceita.');
  }
  if (!resposta.ok) {
    const detalhe = (await resposta.text()).slice(0, 300);
    throw new ErroScribe('servico', `Falha na transcrição (HTTP ${resposta.status}): ${detalhe}`);
  }
  return (await resposta.json()) as RespostaScribe;
}
