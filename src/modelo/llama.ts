// ModeloLocal sobre o llama.rn (docs/harness-fatia.md, "Interface ModeloLocal").
// Um modelo residente por vez; a saída é presa ao esquema por gramática (json_schema).
import { initLlama, type LlamaContext, releaseAllLlama } from 'llama.rn';
import type { ModeloLocal, Pedido } from '../harness/modelo';

export type Medida = {
  tokensEntrada: number;
  tokensSaida: number;
  entradaPorSegundo: number;
  saidaPorSegundo: number;
};

export class ModeloLlama implements ModeloLocal {
  private contexto: LlamaContext | null = null;
  /** Medidas da última geração, para o teste técnico. */
  ultimaMedida: Medida | null = null;

  constructor(
    private caminhoModelo: string,
    private nCtx = 8192,
  ) {}

  async carregar(onProgresso?: (p: number) => void): Promise<void> {
    if (this.contexto) return;
    // Um modelo residente por vez: solta qualquer contexto que tenha ficado para trás
    // (por exemplo, depois de recarregar o JavaScript) antes de ocupar mais 3 GB.
    await releaseAllLlama();
    this.contexto = await initLlama(
      {
        model: this.caminhoModelo,
        n_ctx: this.nCtx,
        n_gpu_layers: 0,
        use_mlock: false,
        use_mmap: true,
      },
      (p) => onProgresso?.(p / 100),
    );
  }

  async gerar(pedido: Pedido): Promise<unknown> {
    if (!this.contexto) await this.carregar();
    const resultado = await this.contexto!.completion({
      messages: [
        { role: 'system', content: pedido.sistema },
        { role: 'user', content: pedido.usuario },
      ],
      response_format: { type: 'json_schema', json_schema: { strict: true, schema: pedido.esquema } },
      n_predict: pedido.maxTokens,
      temperature: pedido.temperatura,
      enable_thinking: false,
    });
    const t = resultado.timings;
    this.ultimaMedida = {
      tokensEntrada: t.prompt_n,
      tokensSaida: t.predicted_n,
      entradaPorSegundo: t.prompt_per_second,
      saidaPorSegundo: t.predicted_per_second,
    };
    const texto = (resultado.content || resultado.text || '').trim();
    try {
      return JSON.parse(texto);
    } catch {
      throw new Error(`o modelo não devolveu JSON válido (saída cortada em ${t.predicted_n} tokens?)`);
    }
  }

  async liberar(): Promise<void> {
    await this.contexto?.release();
    this.contexto = null;
  }
}
