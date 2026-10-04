# Granny Memories

App Android (Expo / React Native, TypeScript) que transforma os áudios que uma autora grava no dia a dia em um livro escrito na voz dela. Um harness de agentes, com a persona de uma ghost writer, transcreve, limpa, extrai ideias (átomos), propõe estrutura e redige capítulo a capítulo. A autora aprova tudo.

Projeto do [Hacktoberfest Weekend Challenge: Build for a Friend](https://dev.to/challenges/hacktoberfest-weekend-2026-10-01), da DEV. **Prazo de envio: 5 de outubro de 2026, 6h59 UTC (3h59 de segunda em Brasília).** O código é **aberto**, neste repositório público: github.com/paulaksm/granny-memories.

O desafio pede um projeto novo, com IA de código aberto no centro, que resolva um problema real de uma pessoa próxima. O envio é um post na DEV (o texto tem o maior peso): o que foi feito e para quem, demonstração, link do código, como foi construído e por que a inovação aberta importa. Categorias de parceiros em vista: Gemma (se o modelo local for Gemma) e ElevenLabs.

Fonte da verdade do produto: o PRD (`docs/PRD.md`). Se algo mudar, aponte a seção do PRD que precisa ser atualizada.

## Regras inegociáveis: repositório público

Tudo o que for commitado é público e permanente (o histórico do Git guarda o que foi apagado). Antes de criar, editar ou commitar qualquer arquivo, confira estas regras.

1. **Nenhuma senha, chave ou token** no código, nos testes, nos logs, nos prompts nem na documentação. A chave da ElevenLabs é digitada no app e guardada em armazenamento seguro do aparelho. Só `.env.example` entra, com nomes de variáveis e valores vazios.
2. **Nenhum arquivo pessoal.** Áudios, transcrições, átomos, capítulos, guia de voz, decisões, bio da autora e backups do projeto ficam só no aparelho. Nunca os copie para o repositório, nem como exemplo.
3. **Dados de exemplo e de teste são sintéticos.** Não use áudios nem textos reais de nenhuma pessoa, em nenhum fixture.
4. **Modelos (`*.gguf`, `*.bin`, `*.onnx`) e arquivos grandes não entram.** O app os baixa no aparelho.
5. Se algo sensível for commitado por engano, **avise imediatamente**: a chave precisa ser revogada, e apagar o arquivo depois não basta.
6. Nunca desative a varredura de segredos nem edite o `.gitignore` para liberar um desses itens.

Itens que o `.gitignore` deve sempre bloquear: `.env*` (exceto `.env.example`), `*.opus`, `*.m4a`, `*.mp3`, `*.wav`, `*.gguf`, `*.bin`, `*.onnx`, `*.keystore`, `*.jks`, `google-services.json`, a pasta de dados do projeto (`transcricoes/`, `notas/`, `livro/`, `voz/`, `controle/`, `fechamento/`) e qualquer `backup-*.zip`.

## Decisões já tomadas (não reabrir sem motivo)

- **Público:** 3 pessoas de confiança, Android Samsung (S24 e S25). Sem loja e sem login. APK por EAS Build, com development build (as bibliotecas de IA têm código nativo e não rodam no Expo Go).
- **Transcrição:** ElevenLabs Scribe v2, o único serviço externo. Só o áudio sai do aparelho. Todo o resto roda localmente.
- **Modelo local:** `llama.rn` (GGUF), um modelo residente por vez, piso de 8 GB de RAM. A interface `ModeloLocal` permite apontar cada agente para local ou API por configuração.
- **Áudios e transcrições originais são guardados e imutáveis**, para reprocessar com agentes melhores no futuro.
- **Maestro:** camada transversal, a única voz da ghost writer com a autora em todas as telas. Nunca altera livro ou guia de voz sozinho.
- **Neutralidade editorial:** nenhum agente pondera se uma história vale ser contada por motivos religiosos, culturais ou sociais. Cortes e reordenações têm razão estrutural. A decisão é sempre da autora.
- **Rastreabilidade:** toda afirmação factual aponta para um átomo e um áudio de origem.

## Jornada

1. **Início (uma vez):** boas-vindas com mini bio, áudios de amostra, revisão da transcrição, revisão do perfil de voz, importação de todos os áudios, escolha da estrutura.
2. **Ciclo por capítulo:** capítulo entregue com notas e perguntas, a autora edita e aprova, guia de voz atualizado com aprovação dela.
3. **Fechamento (uma vez):** revisão do conjunto, itens editoriais (título, contracapa, orelha, sumário, dedicatória, agradecimentos), gate e exportação.

## Harness

- 13 agentes: limpeza, extrator de átomos, mapeador de temas, analista de voz, arquiteto de estrutura, sugestor de temas, redator de capítulos, revisor de capítulo, atualizador do guia de voz, revisor de conjunto (por lente), redator editorial, entrevistador e maestro.
- System prompts: `docs/prompts-agentes-ghostwriter.md`. Todos incluem o bloco comum (neutralidade e fidelidade). Os formatos de arquivo descritos lá são lidos pelos scripts, então siga-os exatamente.
- Scripts de verificação sem modelo de linguagem: `atomos`, `rastreio`, `montar`, `gate`. A versão de referência em Python está em `reference/python/harness.py`, com 26 testes em `test_harness.py`. A portagem para TypeScript deve passar nos mesmos casos de teste. Exceção aprovada para o prazo: a fatia porta só `atomos` e `rastreio` e seus 10 testes; montador, gate e CLI ficam para depois.
- O projeto do livro (dados da autora) segue esta estrutura, sempre fora do Git: `transcricoes/raw|clean`, `notas/atoms`, `notas/temas.md`, `livro/outline.md`, `livro/capitulos`, `voz/guia-de-voz.md`, `controle/decisoes.md`, `controle/perguntas.md`, `fechamento/`.

## Convenções de trabalho

- Responda em português do Brasil. Texto da interface, prompts e documentação em português; identificadores de código em inglês (padrão proposto).
- Trabalhe um marco por vez, na ordem do PRD, e não avance sem a condição de saída do marco atual.
- Registre decisões novas explicitamente em `docs/decisoes.md` (data, decisão, motivo) e aponte a seção do PRD afetada.
- Nunca invente funcionalidade fora do escopo do PRD. Se achar necessária, proponha e espere aprovação.
- Antes de dizer que algo está pronto: rode os testes, rode os scripts de verificação nos dados sintéticos e confirme que nada pessoal ou secreto está no `git status`.

## Estado atual

- PRD pronto. Prompts dos agentes e scripts de verificação em Python prontos e testados.
- App Expo (SDK 57) com as telas do protótipo, harness em TypeScript (`src/harness`, 22 testes), Scribe v2 e Gemma 4 E2B no aparelho; fluxo do áudio ao capítulo testado de ponta a ponta no S24 (ver `docs/decisoes.md`). README pronto. Falta: vídeo de demonstração e post na DEV.
- Recorte proposto para o prazo do desafio: uma única fatia vertical. Um áudio vira transcrição (Scribe v2), átomos e um capítulo curto com rastreio, com limpeza, extração, perfil de voz e redação rodando no aparelho em modelo open-weight (RF1, RF2, RF4, RF5, RF6 e RF8 em versão mínima), mais a documentação e o post. O resto do PRD é o plano do produto, não do prazo.
- Na fatia, só se porta para TypeScript o necessário: os scripts `atomos` e `rastreio` (com os mesmos testes do Python) e os prompts de limpeza, extrator de átomos, analista de voz e redator de capítulos, com o bloco comum.
- Perfil de voz mínimo: estatísticas calculadas por código, trechos reais da autora como exemplos e no máximo 3 traços descritos pelo modelo. A autora aprova cada traço, e o redator usa só os traços aprovados.
- Como o harness roda na fatia (runner, saída em JSON por esquema convertida em arquivos por código, verificação `limpeza`, formato dos traços de voz, ModeloLocal, testes): `docs/harness-fatia.md`, aprovado.
- Modelo local: Gemma 4 E2B instruct, GGUF Q4_K_M (cerca de 3,1 GB, Apache 2.0), baixado do Hugging Face no aparelho.
- Telas: o protótipo completo do Claude Design em `design/design_handoff_granny_memories/` (vários livros, linha do tempo, capítulos com ordem, prévia, configuração), com os ajustes registrados em `docs/decisoes.md` (2026-10-04, "telas seguem o protótipo"): correção mínima da transcrição, só traços aprovados, app aberto durante processos longos, sem fila automática, sem botão da ghost writer, sem edição do capítulo nem resposta a lacunas. Ordem de trabalho: harness e fluxo de um áudio até o capítulo primeiro; livros, ordem, exclusão e prévia depois.
- O maestro (RF11) fica fora do recorte, em tela e em código: na fatia, a ordem das etapas é um runner determinístico em TypeScript, sem agente orquestrador. A voz da ghost writer aparece só nas notas e perguntas que o redator de capítulos devolve.
- Entregáveis do desafio: repositório público com README (sem segredos nem dados pessoais), demonstração em vídeo e o post na DEV.

## Questões em aberto

Terceiro aparelho (modelo e RAM), pessoa para quem o app é feito, horas da assinatura Creative valendo para a API (ou créditos em hacktoberfest.com/my), política de uso do áudio na conta ElevenLabs, `whisper.rn` como transcrição alternativa para quem clonar o repositório, qualidade da saída em JSON (`json_schema`) do Gemma 4 no aparelho, medição no S25 (fora da entrega do desafio), formato de exportação e nome final do app.
