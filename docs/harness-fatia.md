# Harness da fatia vertical

Como o harness roda no app para o recorte do desafio: um ou mais áudios viram transcrição, limpeza, átomos, perfil de voz e um capítulo curto com rastreio. Este documento detalha o que o PRD (Arquitetura, Harness) e o `CLAUDE.md` (Estado atual) deixam em aberto. Status: **aprovado em 2026-10-04**.

## Princípio: o modelo devolve conteúdo, o código escreve os arquivos

Os prompts originais pedem que cada agente escreva arquivos em formatos exatos (cabeçalho `---`, `<!-- A-014 -->`, linha de pergunta). Um modelo pequeno erra esses formatos com frequência (PRD, Riscos). Na fatia:

1. O modelo responde em **JSON imposto por esquema** (`response_format: json_schema` do llama.rn, que vira gramática no llama.cpp e não deixa sair JSON inválido).
2. O **código** converte o JSON nos arquivos, exatamente nos formatos de `docs/prompts-agentes-ghostwriter.md`.
3. Os **scripts de verificação** (`atomos`, `rastreio`) leem esses arquivos, como fariam com qualquer outra fonte.

Tudo o que o código pode calcular sozinho sai do modelo: IDs, marcas de tempo, `confianca_transcricao`, estatísticas de estilo. O modelo fica só com o que exige julgamento.

## Runner

Uma sequência fixa em TypeScript, sem agente orquestrador (decisão de 2026-10-04: maestro fora do recorte).

| # | Etapa | Quem faz | Entrada | Saída | Verificação |
|---|---|---|---|---|---|
| 1 | Importar | código | áudio gravado ou escolhido | `audios/audio-NN.<ext>` + hash | hash gravado; o arquivo nunca é sobrescrito |
| 2 | Transcrever | Scribe v2 | áudio | `transcricoes/raw/audio-NN.json` (resposta original) e `audio-NN.txt` | parágrafos com `[mm:ss]` |
| — | **Pausa: a autora corrige as palavras `[?]`** | autora | `raw/audio-NN.txt` | `transcricoes/revisada/audio-NN.txt` | `raw/` intacto |
| 3 | Limpar | modelo (limpeza) | `revisada/audio-NN.txt` | `transcricoes/clean/audio-NN.md` | `limpeza` (nova, abaixo) |
| 4 | Extrair átomos | modelo (extrator) | `clean/audio-NN.md` | `notas/atoms/A-NNN.md` | `atomos` |
| 5 | Perfil de voz | código + modelo (analista) | todas as `clean/` | `voz/guia-de-voz.md` (rascunho) | trechos conferidos por código |
| — | **Pausa: a autora aprova ou recusa cada traço** | autora | | `guia-de-voz.md` com status por traço | |
| 6 | Redigir | modelo (redator) | átomos, traços aprovados, outline mínimo | `livro/capitulos/C-01.md`, `controle/perguntas.md` | `rastreio` |

Regras do runner:

- **Uma etapa por vez** e **um modelo residente**. O modelo carrega uma vez antes da etapa 3 e é liberado depois da 6 ou quando o app vai para segundo plano.
- **Cada etapa grava seu estado** em `controle/estado.json` (pendente, rodando, ok, falhou + mensagem). Ao reabrir o app, a fila continua de onde parou.
- **Etapas são refazíveis.** Refazer a etapa N apaga só as saídas da etapa N e das seguintes. `audios/` e `transcricoes/raw/` nunca são apagados nem reescritos (PRD, princípio 2).
- **Falha de verificação:** uma nova tentativa automática, com a lista de erros do script acrescentada ao pedido. Se falhar de novo, a etapa fica como `falhou` e a tela mostra os erros. Itens isolados que continuam inválidos (por exemplo, um átomo cujo trecho não existe) são descartados e listados, sem travar o resto.
- **Falha de rede na transcrição:** o áudio fica com a etapa 2 `pendente` e um botão "tentar de novo". A fila automática do RF2 completo fica para depois.
- **Vários áudios:** as etapas 1 a 4 rodam por áudio; a 5 e a 6 rodam uma vez sobre todos. Para a demonstração, recomenda-se de 2 a 3 áudios curtos (até 5 min cada), porque um perfil de voz feito com um único áudio tem pouca evidência.

## Etapa por etapa

### 2. Transcrição (Scribe v2)

- `POST /v1/speech-to-text`, `model_id=scribe_v2`, sem `language_code` (detecção automática), cabeçalho `xi-api-key` lido do armazenamento seguro.
- A resposta JSON vai inteira para `raw/audio-NN.json`, imutável.
- `raw/audio-NN.txt` é derivado por código: palavras agrupadas em parágrafos por pausa (≥ 1,5 s entre palavras), cada parágrafo começando com `[mm:ss]` do primeiro termo.
- Palavras com baixa confiança do Scribe (probabilidade abaixo de um limite a calibrar) saem como `[?palavra]` no `.txt`.

### Correção mínima (RF3 mínimo)

- A tela mostra o texto com as marcas `[?]`. A autora toca, ouve o trecho e digita a palavra certa.
- As correções ficam em `transcricoes/revisada/audio-NN.txt` (cópia do bruto com as palavras trocadas). `raw/` nunca muda.
- "Está certo, continuar" aceita as marcas não corrigidas como estão; a limpeza preserva `[?]` e o átomo fica com `confianca_transcricao: baixa`.
- Na verificação `limpeza`, o texto de referência passa a ser o revisado.

### 3. Limpeza

- Roda **por parágrafo**, mantendo a marca de tempo fora do pedido ao modelo. Assim o modelo não consegue juntar, reordenar nem perder parágrafos.
- Esquema: `{ "texto": string }` por parágrafo, e ao final `{ "qualidade": "boa|média|baixa", "motivo": string }` sobre o áudio inteiro.
- O código monta `clean/audio-NN.md` com o cabeçalho do prompt original (`arquivo`, `duração`, `qualidade`).
- **Verificação `limpeza` (nova, só código):** cada palavra do parágrafo limpo precisa existir no parágrafo bruto correspondente, exceto as marcas `[?…]`. Palavra nova é erro (o prompt proíbe trocar palavras). Parágrafo limpo com menos da metade das palavras do bruto vira aviso (possível resumo). Isso cobre o critério do RF4.

### 4. Átomos

- Esquema: lista de `{ tipo, resumo, trecho_literal, pessoas, datas_locais_numeros, relacionado: [{ indice, relacao }] }`.
- O código:
  - numera `A-NNN` em sequência, continuando do maior ID existente;
  - localiza o `trecho_literal` no clean e calcula a `fonte` (`audio-NN [mm:ss-mm:ss]`) a partir das marcas dos parágrafos onde ele começa e termina;
  - define `confianca_transcricao` como `baixa` se o trecho tiver `[?`;
  - converte `relacionado` de índices para IDs.
- Depois roda `atomos`. Átomo com trecho não encontrado é o erro mais provável: entra na nova tentativa e, se persistir, é descartado.

### 5. Perfil de voz mínimo

Três partes, gravadas em `voz/guia-de-voz.md`:

1. **Estatísticas (código):** total de palavras; média e faixa de palavras por frase; expressões recorrentes (2 a 3 palavras, ≥ 3 ocorrências, sem palavras vazias), com contagem; marcas de oralidade (lista fixa: "né", "aí", "então", "sabe", "olha", "tipo"…), com contagem; pessoa gramatical ("eu", "a gente", "nós"), com contagem; discurso direto (falas citadas), com contagem.
2. **Exemplos (código):** de 3 a 5 trechos literais escolhidos entre os átomos já validados, priorizando `tipo: história` e citações, com fonte.
3. **Traços (modelo, no máximo 3):** esquema `[{ traco, evidencia_literal, ocorrencias }]`, com as estatísticas e os exemplos na entrada. O código descarta o traço cuja evidência não existe no clean. Prompt do analista de voz adaptado: mesmas regras ("descreva só o que está no texto", "exemplos valem mais que adjetivos", confiança baixa declarada), saída reduzida a 3 traços.

Formato dos traços no arquivo (uma linha por traço, como as perguntas):

```
- [ ] traço: <texto> | evidência: "<trecho>" | fonte: audio-NN [mm:ss] | ocorrências: N
```

`[ ]` pendente, `[x]` aprovado, `[-]` recusado. Só a tela de aprovação muda o marcador. O cabeçalho do arquivo tem `status: rascunho` até a autora decidir todos os traços, e então `status: aprovado`.

### 6. Capítulo

- **Entrada montada pelo runner:** outline mínimo (um capítulo, `C-01`, com todos os átomos); guia com estatísticas, exemplos e **só os traços `[x]`**; átomos com texto completo. Capítulo anterior e `decisoes.md` vão vazios.
- Esquema: `{ titulo, paragrafos: [{ texto, atomos: ["A-001"] }], notas: [string] (≤ 5), perguntas: [{ texto, origem: [ids], tipo: "lacuna|contradição|confirmação" }] }`.
- O código grava `C-01.md` com o cabeçalho (`titulo`, `status: rascunho`), cada parágrafo seguido de `<!-- A-001, A-002 -->`, as notas e as perguntas; as perguntas também vão para `controle/perguntas.md` no formato comum.
- Tamanho-alvo: de 400 a 700 palavras.
- Depois roda `rastreio` no modo normal: ID inexistente é erro (nova tentativa); parágrafo sem átomo é aviso, mostrado na tela, porque transições neutras são permitidas.
- Relações `contradiz` entre átomos precisam aparecer como pergunta. Se o capítulo não tiver a pergunta, o código a acrescenta.

## Interface ModeloLocal

```ts
interface ModeloLocal {
  carregar(onProgresso?: (p: number) => void): Promise<void>;
  gerar(pedido: {
    sistema: string;          // bloco comum + prompt do agente
    usuario: string;          // a entrada da etapa
    esquema: object;          // JSON Schema da saída
    maxTokens: number;
    temperatura: number;
  }): Promise<unknown>;       // JSON já validado contra o esquema
  liberar(): Promise<void>;
}
```

- Uma implementação na fatia, sobre o llama.rn. `controle/config.json` aponta cada agente para `local`; a opção `api` fica no formato do arquivo, mas não é implementada no prazo.
- Temperaturas iniciais: limpeza 0,1; extrator 0,2; analista 0,3; redator 0,6. Ajustar no teste com o modelo escolhido (etapa 3 do plano).
- Contexto: `n_ctx` de 8192 tokens como ponto de partida, o que cabe um áudio de 5 min por vez na limpeza e na extração. O redator recebe só os átomos, não as transcrições.

## Modelo

- **Gemma 4 E2B instruct, GGUF Q4_K_M** (cerca de 3,1 GB, Apache 2.0), o mesmo nos dois aparelhos. O E4B (cerca de 5 GB) fica como opção para o redator no S25, só se o teste mostrar memória sobrando.
- Baixado do Hugging Face na primeira abertura do app, com aviso para usar Wi-Fi. Os arquivos `mmproj` (visão e áudio) não são usados.
- A confirmar no aparelho: qualidade da saída com `json_schema`, velocidade no S24 (Exynos, provavelmente só CPU) e qualidade da prosa em português.

## Prompts

- Ficam em `src/harness/prompts/`, um arquivo por agente, cada um exportando o **bloco comum** + o prompt do agente copiados de `docs/prompts-agentes-ghostwriter.md`.
- A seção SAÍDA de cada prompt é trocada por "responda só com JSON no esquema dado", porque o formato de arquivo agora é responsabilidade do código. O restante (papel, regras, neutralidade, fidelidade) não muda. O documento original continua sendo a fonte; cada arquivo TS diz de qual seção veio.

## Arquivos no aparelho

A mesma estrutura do harness, dentro de `documentDirectory/projeto/` (expo-file-system), mais `audios/` e `controle/estado.json`. O código do harness não chama o expo-file-system diretamente: usa uma interface `Arquivos` (`ler`, `escrever`, `listar`, `existe`, `apagar`). No app ela é implementada com o expo-file-system; nos testes, em memória ou com o `fs` do Node.

## Testes

- Portados do Python só os casos da fatia: `TestAtomos` (5) e `TestRastreio` (5), com as mesmas fixtures sintéticas. Os outros 16 (montador, gate, CLI) ficam para quando essas partes forem portadas.
- Testes novos, também sintéticos: conversão JSON → arquivos (átomo, capítulo, guia), cálculo da `fonte` a partir do trecho, verificação `limpeza` e estatísticas de estilo.
- Rodam em Node, sem aparelho e sem modelo.

## Fora da fatia

Maestro, revisão completa da transcrição (RF3 além da correção de `[?]`), mapeador de temas, arquiteto de estrutura, revisor de capítulo, edição e aprovação do capítulo (RF10), atualizador do guia, montador, gate e exportação.

## Seções do PRD afetadas

- **Harness:** a fatia usa saída estruturada e conversão por código, em vez de o agente escrever o arquivo.
- **Harness, scripts de verificação:** nova verificação `limpeza`.
- **RF6:** perfil mínimo e formato de traço com `[x]`/`[-]`.
- **Decisões em aberto:** "O llama.rn oferece saída estruturada?" Sim, pela API (`json_schema`); falta confirmar a qualidade com o Gemma 4 no aparelho. "Qual modelo local usar?" Gemma 4 E2B.
- **Arquitetura, linha "Modelo local":** Gemma 4 E2B Q4_K_M.
