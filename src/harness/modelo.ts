// Interface de modelo (PRD, Arquitetura; docs/harness-fatia.md, "Interface ModeloLocal").
// Na fatia há uma implementação sobre o llama.rn (src/modelo/llama.ts).

export type Pedido = {
  /** Bloco comum + prompt do agente. */
  sistema: string;
  /** A entrada da etapa. */
  usuario: string;
  /** JSON Schema da saída. */
  esquema: object;
  maxTokens: number;
  temperatura: number;
};

export interface ModeloLocal {
  carregar(onProgresso?: (p: number) => void): Promise<void>;
  /** Devolve o JSON já interpretado (a gramática garante o formato). */
  gerar(pedido: Pedido): Promise<unknown>;
  liberar(): Promise<void>;
}

export const TEMPERATURAS = {
  limpeza: 0.1,
  extrator: 0.2,
  analista: 0.3,
  redator: 0.6,
} as const;
