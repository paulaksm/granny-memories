// Acesso a arquivos do projeto do livro. O harness só conversa com esta
// interface: no app ela é implementada sobre o expo-file-system; nos testes,
// em memória. Caminhos são relativos à raiz do projeto, com "/".

export interface Arquivos {
  ler(caminho: string): Promise<string>;
  escrever(caminho: string, conteudo: string): Promise<void>;
  existe(caminho: string): Promise<boolean>;
  /** Nomes dos arquivos (não recursivo) da pasta; vazio se ela não existir. */
  listar(pasta: string): Promise<string[]>;
  apagar(caminho: string): Promise<void>;
}

export class ArquivosEmMemoria implements Arquivos {
  private dados = new Map<string, string>();

  async ler(caminho: string): Promise<string> {
    const valor = this.dados.get(caminho);
    if (valor === undefined) throw new Error(`arquivo não encontrado: ${caminho}`);
    return valor;
  }

  async escrever(caminho: string, conteudo: string): Promise<void> {
    this.dados.set(caminho, conteudo);
  }

  async existe(caminho: string): Promise<boolean> {
    return this.dados.has(caminho);
  }

  async listar(pasta: string): Promise<string[]> {
    const prefixo = pasta.endsWith('/') ? pasta : `${pasta}/`;
    return [...this.dados.keys()]
      .filter((c) => c.startsWith(prefixo) && !c.slice(prefixo.length).includes('/'))
      .map((c) => c.slice(prefixo.length))
      .sort();
  }

  async apagar(caminho: string): Promise<void> {
    this.dados.delete(caminho);
  }
}
