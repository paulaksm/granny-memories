// Projeto sintético, portado de criar_projeto_exemplo em reference/python/test_harness.py
// (só a parte que a fatia usa: transcrições limpas, átomos e capítulos).
import { ArquivosEmMemoria } from '../arquivos';

async function atomo(
  arq: ArquivosEmMemoria,
  n: number,
  fonte: string,
  tipo: string,
  resumo: string,
  literal: string,
  relacionado = '',
  conf = 'alta',
): Promise<void> {
  const aid = `A-${String(n).padStart(3, '0')}`;
  await arq.escrever(
    `notas/atoms/${aid}.md`,
    `---\nid: ${aid}\nfonte: ${fonte}\ntipo: ${tipo}\nresumo: ${resumo}\n` +
      `trecho_literal: ${literal}\nconfianca_transcricao: ${conf}\n` +
      `relacionado: ${relacionado}\n---\n`,
  );
}

export async function criarProjetoExemplo(): Promise<ArquivosEmMemoria> {
  const arq = new ArquivosEmMemoria();
  await arq.escrever(
    'transcricoes/clean/audio-01.md',
    '---\narquivo: audio-01.m4a\nqualidade: boa\n---\n' +
      '[00:00] Eu achava que era só mais uma reunião. Não era.\n\n' +
      '[00:20] A conversa com o diretor durou vinte minutos e mudou o rumo dos três anos seguintes.\n\n' +
      '[02:15] Na semana seguinte fui falar com a equipe nova e percebi que ninguém ali me conhecia.\n',
  );
  await arq.escrever(
    'transcricoes/clean/audio-02.md',
    '---\narquivo: audio-02.m4a\nqualidade: boa\n---\n' +
      '[00:10] Aprendi mais com um erro de planilha do que com qualquer curso.\n\n' +
      '[01:30] Eu sempre cheguei cedo, nem que fosse para tomar café sozinho.\n',
  );
  await atomo(
    arq, 1, 'audio-01 [00:00-00:40]', 'história', 'A reunião que mudou os três anos seguintes',
    'Eu achava que era só mais uma reunião. Não era. A conversa com o diretor durou vinte minutos ' +
      'e mudou o rumo dos três anos seguintes.',
  );
  await atomo(
    arq, 2, 'audio-01 [02:15-02:40]', 'fato', 'Ninguém conhecia a autora na equipe nova',
    'Na semana seguinte fui falar com a equipe nova e percebi que ninguém ali me conhecia.',
    'A-001 (complementa)',
  );
  await atomo(
    arq, 3, 'audio-02 [00:10-00:50]', 'opinião', 'Aprendeu mais com um erro do que com cursos',
    'Aprendi mais com um erro de planilha do que com qualquer curso.',
  );
  await atomo(
    arq, 4, 'audio-02 [01:30-01:50]', 'fato', 'Sempre chegava cedo',
    'Eu sempre cheguei cedo, nem que fosse para tomar café sozinho.',
    'A-003 (complementa)',
  );
  await arq.escrever(
    'livro/capitulos/C-01.md',
    '---\ntitulo: A reunião que mudou tudo\nstatus: aprovado\n---\n' +
      'Eu achava que era só mais uma reunião. Não era. <!-- A-001 -->\n\n' +
      'A conversa com o diretor durou vinte minutos e mudou o rumo dos três anos seguintes.\n' +
      '<!-- A-001 -->\n\n' +
      'Na semana seguinte, fui falar com a equipe nova e percebi que ninguém ali me conhecia. <!-- A-002 -->\n',
  );
  await arq.escrever(
    'livro/capitulos/C-02.md',
    '---\ntitulo: O que aprendi errando\nstatus: aprovado\n---\n' +
      'Aprendi mais com um erro de planilha do que com qualquer curso. <!-- A-003 -->\n\n' +
      'Eu sempre cheguei cedo, nem que fosse para tomar café sozinho. <!-- A-004 -->\n',
  );
  return arq;
}

export async function alterar(
  arq: ArquivosEmMemoria,
  caminho: string,
  fn: (texto: string) => string,
): Promise<void> {
  await arq.escrever(caminho, fn(await arq.ler(caminho)));
}
