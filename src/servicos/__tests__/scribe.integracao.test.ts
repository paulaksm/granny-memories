// Teste com a API real do Scribe e um áudio SINTÉTICO (voz gerada por TTS a partir de
// texto inventado). Só roda quando pedido:
//   SCRIBE_AUDIO=/caminho/sintetico.m4a npx jest -c jest.integracao.config.js
// A chave vem de ELEVENLABS_API_KEY no .env local (ignorado pelo Git).
import { describe, expect, test } from '@jest/globals';
import { readFileSync } from 'fs';
import { listarDuvidas, paragrafosDoScribe, paragrafosParaTexto } from '../../harness/transcricao';
import { transcrever } from '../scribe';

const audio = process.env.SCRIBE_AUDIO;
const chave = (() => {
  try {
    return /^ELEVENLABS_API_KEY=(.*)$/m.exec(readFileSync('.env', 'utf8'))?.[1].trim() ?? null;
  } catch {
    return null;
  }
})();

(audio && chave ? describe : describe.skip)('Scribe v2 (rede)', () => {
  test('áudio sintético vira parágrafos com marcas de tempo', async () => {
    const blob = new Blob([readFileSync(audio!)], { type: 'audio/mp4' });
    const resposta = await transcrever(blob, chave, 'sintetico.m4a');
    const texto = paragrafosParaTexto(paragrafosDoScribe(resposta));
    console.log(`idioma: ${resposta.language_code}\n${texto}duvidosas: ${listarDuvidas(texto).length}`);
    expect(resposta.language_code).toMatch(/^p(t|or)/);
    expect(texto).toMatch(/^\[00:0\d\] /);
    expect(texto.toLowerCase()).toContain('laranja');
  }, 120000);
});
