export type Achado = { local: string; msg: string };

export class Relatorio {
  erros: Achado[] = [];
  avisos: Achado[] = [];
  infos: Achado[] = [];

  constructor(public titulo: string) {}

  erro(local: string, msg: string): void {
    this.erros.push({ local, msg });
  }

  aviso(local: string, msg: string): void {
    this.avisos.push({ local, msg });
  }

  info(local: string, msg: string): void {
    this.infos.push({ local, msg });
  }

  get ok(): boolean {
    return this.erros.length === 0;
  }

  /** Erros em uma linha cada, para devolver ao modelo numa nova tentativa. */
  errosComoTexto(): string {
    return this.erros.map((e) => `- ${e.local}: ${e.msg}`).join('\n');
  }
}
