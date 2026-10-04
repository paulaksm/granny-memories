// Implementação de Arquivos (src/harness/arquivos.ts) sobre o expo-file-system.
// Tudo fica na pasta privada do app: nada aqui sai do aparelho.
import { Directory, File, Paths } from 'expo-file-system';
import type { Arquivos } from '../harness/arquivos';

export const RAIZ_PROJETO = new Directory(Paths.document, 'projeto');

function arquivo(caminho: string): File {
  return new File(RAIZ_PROJETO, ...caminho.split('/'));
}

export class ArquivosExpo implements Arquivos {
  async ler(caminho: string): Promise<string> {
    return arquivo(caminho).text();
  }

  async escrever(caminho: string, conteudo: string): Promise<void> {
    const f = arquivo(caminho);
    if (!f.exists) f.create({ intermediates: true });
    f.write(conteudo);
  }

  async existe(caminho: string): Promise<boolean> {
    return arquivo(caminho).exists;
  }

  async listar(pasta: string): Promise<string[]> {
    const d = new Directory(RAIZ_PROJETO, ...pasta.split('/'));
    if (!d.exists) return [];
    return d
      .list()
      .filter((item) => item instanceof File)
      .map((item) => item.name)
      .sort();
  }

  async apagar(caminho: string): Promise<void> {
    const f = arquivo(caminho);
    if (f.exists) f.delete();
  }
}

/** Arquivo de áudio guardado (imutável) em projeto/audios/. */
export function arquivoDeAudio(nome: string): File {
  return new File(RAIZ_PROJETO, 'audios', nome);
}

/** Caminho sem "file://", como o llama.rn espera. */
export const caminhoNativo = (f: File) => decodeURI(f.uri.replace(/^file:\/\//, ''));
