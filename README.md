# Granny Memories

Um app Android que transforma os áudios que uma avó grava contando a vida dela em um livro escrito **na voz dela**. Ela não precisa escrever nada. O app transcreve, separa as ideias, aprende o jeito dela de contar e redige capítulo a capítulo. Ela decide o que fica.

> *An Android app that turns the voice notes a grandmother records about her life into a book written in her own voice. The writing runs on the phone with an open-weight model (Gemma 4); only the audio leaves the device, to be transcribed.*

Feito para a minha avó, no [Hacktoberfest Weekend Challenge: Build for a Friend](https://dev.to/challenges/hacktoberfest-weekend-2026-10-01), da DEV.

## Para quem e por quê

As histórias da minha avó estão espalhadas em áudios de WhatsApp. Transformar isso em livro exige reescrever tudo, e no caminho a voz de quem conta se perde: o texto fica "bem escrito" e deixa de soar como ela.

O app foi desenhado para uma pessoa idosa e não técnica: texto grande, contraste alto, um botão principal por tela, nenhum jargão. Na interface não existem "átomos", "prompts" nem "modelos". Existem histórias, ideias e capítulos.

## Como funciona

```
gravar ──► transcrever ──► corrigir ──► limpar ──► separar ideias ──► jeito de contar ──► capítulo
 (app)    (ElevenLabs     (a autora    (Gemma 4,   (Gemma 4,          (código + Gemma 4,   (Gemma 4,
           Scribe v2)      toca no [?]) no celular) no celular)        ela aprova cada      no celular)
                                                                        traço)
```

1. **Gravar ou escolher um áudio.** O original é guardado e nunca é alterado.
2. **Transcrever** com o ElevenLabs Scribe v2, com detecção automática de idioma. Palavras de baixa confiança aparecem como `[?]` e a autora toca nelas para corrigir.
3. **Limpar** hesitações e ruídos parágrafo a parágrafo, sem trocar palavras. Uma verificação por código recusa qualquer palavra que não estava no áudio.
4. **Separar as ideias.** Cada ideia leva um trecho literal da transcrição, e o código confere que o trecho existe.
5. **Aprender o jeito de contar.** Estatísticas calculadas por código (ritmo, expressões, marcas de oralidade), trechos reais como exemplo e no máximo três traços descritos pelo modelo. A autora responde "isso sou eu" ou "não sou eu" a cada um; só os aprovados entram na escrita.
6. **Escrever o capítulo.** Toda passagem cita as ideias de onde veio. Na tela, cada passagem tem um selo ("Áudio 2 · 00:20") que abre o trecho original e toca o áudio naquele ponto. O que faltou vira pergunta, não invenção.

## O que roda no celular e o que sai dele

| Dado | Onde fica | Sai do celular? |
|---|---|---|
| Áudios | Celular | **Sim, só para a transcrição**, na ElevenLabs |
| Transcrições, ideias, jeito de contar, capítulos | Celular | Não |
| Chave da ElevenLabs | Armazenamento seguro do Android | Não |
| Modelo (Gemma 4 E2B, cerca de 3,1 GB) | Celular, baixado uma vez | Não |

Não há servidor próprio, login, telemetria nem nuvem. Depois de transcrever, tudo funciona em modo avião.

## Por que IA aberta importa aqui

- **Privacidade de verdade.** São memórias de família: nomes, brigas, perdas, segredos. Com um modelo aberto rodando no aparelho, o texto nunca sai do celular. Isso não é uma promessa de política de privacidade; é como o app funciona.
- **Funciona offline e sem custo por uso.** Depois do download, escrever um capítulo não depende de internet nem de cobrança por token.
- **Dá para refazer depois.** Áudios e transcrições originais ficam guardados. Quando surgir um modelo aberto melhor, o livro pode ser reprocessado sem depender de um fornecedor.
- **O processo é auditável.** O código, os prompts dos agentes e os scripts que verificam o que o modelo produziu estão neste repositório. Qualquer pessoa pode ver por que o app nunca inventa um fato.

## Como foi construído

- **App:** Expo (React Native) em TypeScript, com development build pelo EAS.
- **Modelo no aparelho:** [Gemma 4 E2B instruct](https://huggingface.co/google/gemma-4-E2B-it) (Apache 2.0), GGUF Q4_K_M, rodando com [llama.rn](https://github.com/mybigday/llama.rn) (llama.cpp). A saída é presa a um JSON Schema por gramática, então o modelo não consegue devolver um formato errado.
- **Transcrição:** [ElevenLabs Scribe v2](https://elevenlabs.io/speech-to-text).
- **Harness de agentes** (`src/harness/`): uma sequência fixa em TypeScript, sem agente orquestrador. O modelo devolve só conteúdo, e o código grava os arquivos e roda verificações sem modelo de linguagem:
  - `limpeza`: nenhuma palavra nova em relação ao áudio;
  - `atomos`: cada ideia tem campos válidos e um trecho literal que existe na transcrição;
  - `rastreio`: cada passagem do capítulo cita ideias que existem.

  Se uma verificação falha, o app tenta de novo uma vez, mostrando os erros ao modelo; se falhar de novo, na dúvida fica a fala como foi dita.
- **Prompts dos agentes:** `docs/prompts-agentes-ghostwriter.md`, com uma regra comum de neutralidade editorial (nenhum agente pondera se uma história "vale" ser contada) e de fidelidade (nada de fatos, nomes ou falas inventados).
- **Design:** feito no Claude Design, com handoff em `design/design_handoff_granny_memories/`.
- **Medido no Galaxy S24** (Exynos 2400, só CPU, Android 16): o modelo carrega em cerca de 5 s, gera de 11 a 12 tokens/s e ocupa cerca de 2,9 GB de memória.
- Construído com a ajuda do Claude Code.

## Como rodar

Pré-requisitos: Node 22, uma conta Expo (para o EAS Build), um Android arm64 com 8 GB de RAM e uma chave da [ElevenLabs](https://elevenlabs.io) com permissão de speech-to-text.

```bash
git clone https://github.com/paulaksm/granny-memories
cd granny-memories
npm install
git config core.hooksPath .githooks       # varredura de segredos antes de cada commit

# development build (o llama.rn tem código nativo e não roda no Expo Go)
npx eas-cli build --platform android --profile development
# instale o APK no celular e depois:
npx expo start --dev-client
```

No app: **Ajustes → Chave da ElevenLabs** (a chave fica no armazenamento seguro do aparelho) e **Ajustes → Baixar modelo** (cerca de 3,1 GB, use o Wi-Fi).

### Testes

```bash
npm test          # harness: verificações, conversões, estatísticas e o runner de ponta a ponta (23 testes)
npm run typecheck

# opcional: chamada real ao Scribe com um áudio de voz sintética
SCRIBE_AUDIO=/caminho/sintetico.m4a npx jest -c jest.integracao.config.js
```

A referência em Python das verificações está em `reference/python/` (`python3 -m unittest test_harness`).

## Estrutura

```
App.tsx                    navegação
src/app/                   telas, componentes, tema, estado do app, armazenamento no aparelho
src/harness/               runner, prompts, esquemas, verificações (sem dependência do app)
src/modelo/llama.ts        ModeloLocal sobre o llama.rn
src/servicos/scribe.ts     cliente do Scribe v2
docs/                      PRD, prompts dos agentes, desenho do harness, registro de decisões
design/                    handoff do Claude Design
reference/python/          scripts de verificação de referência e testes
```

## Privacidade e segurança do repositório

Este repositório é público. Nenhuma chave, áudio, transcrição ou texto real de ninguém entra aqui: os testes usam só dados sintéticos, o `.gitignore` bloqueia áudios, modelos e as pastas de dados do livro, e o [gitleaks](https://github.com/gitleaks/gitleaks) roda antes de cada commit e no GitHub Actions.

## Estado e limites

Esta é a fatia vertical feita para o desafio: do áudio ao capítulo, com o rastreio de cada trecho. O plano completo do produto está em `docs/PRD.md`. Ainda não estão prontos:

- a conversa com a ghost writer;
- a edição do capítulo e a resposta às lacunas dentro do app;
- vários livros e novos capítulos (a interface já mostra, mas há um livro por vez);
- a exportação do livro.

Um modelo pequeno no celular escreve uma prosa mais simples que um modelo grande na nuvem. É uma troca consciente: a voz e a privacidade dela vêm primeiro, e tudo fica guardado para reescrever com modelos abertos melhores no futuro.

## Licença

Código sob a [licença MIT](LICENSE). O Gemma 4 é distribuído pelo Google sob a licença Apache 2.0 e é baixado pelo app, não está neste repositório. As fontes Literata e Atkinson Hyperlegible são OFL.
