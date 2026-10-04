# Decisões

Registro de decisões do projeto: data, decisão, motivo e seção do PRD afetada.

## 2026-10-04: maestro fora do recorte do desafio

- **Decisão:** o maestro (RF11) fica fora do recorte, em tela e em código. Na fatia vertical, a ordem das etapas é um runner determinístico em TypeScript, sem agente orquestrador. A voz da ghost writer aparece só nas notas e perguntas que o redator de capítulos devolve.
- **Motivo:** prazo do desafio. A fatia vertical precisa de uma ordem fixa de etapas, não de um orquestrador conversacional.
- **PRD afetado:** RF11 (tabela de requisitos), a descrição do maestro na jornada ("o maestro acompanha todas") e o marco 4 ("Telas e ciclo por capítulo"), que inclui o maestro. A decisão "O maestro é uma camada transversal" continua valendo para o produto, só não entra no prazo.

## 2026-10-04: varredura de segredos com gitleaks

- **Decisão:** gitleaks (v8.30.1) roda antes de cada commit por um hook versionado em `.githooks/pre-commit` (ativado com `git config core.hooksPath .githooks`) e de novo no GitHub Actions a cada push. O hook também recusa áudios, vídeos, modelos, chaves de assinatura e as pastas de dados do livro, mesmo com `git add -f`. O `.gitleaks.toml` soma às regras padrão uma regra específica para chaves da ElevenLabs (`sk_` + 48 hex), que as regras padrão só pegam pela regra genérica.
- **Motivo:** regra 5 do repositório público. Hook versionado, sem depender do Node, porque o app ainda não existe. O CI cobre quem clonar sem ativar o hook.
- **PRD afetado:** nenhum (cumpre "Regras do repositório público", item 5).

## 2026-10-04: vídeos fora do Git

- **Decisão:** `.gitignore` passa a bloquear `*.mp4`, `*.mov`, `*.webm` e `*.mkv`.
- **Motivo:** o vídeo de demonstração pode ter voz real. Ele é publicado na DEV ou no YouTube, não no repositório.
- **PRD afetado:** nenhum.

## 2026-10-04: DevRelay fora do repositório, por enquanto

- **Decisão:** `.claude/`, `.devrelay/` e `.mcp.json` ficam no `.gitignore` e o trabalho segue sem o DevRelay.
- **Motivo:** escolha da autora do projeto. Decisão provisória: pode voltar, e aí basta tirar essas três linhas do `.gitignore` (a credencial em `.devrelay/home/` continua bloqueada).
- **PRD afetado:** nenhum.

## 2026-10-04: esqueleto do app

- **Decisão:** Expo SDK 57 (React Native 0.86, New Architecture), template `blank-typescript`, com `expo-dev-client`, `expo-secure-store`, `expo-build-properties` e `llama.rn` fixado em `0.13.0-rc.6` (a tag `latest` no npm é esse release candidate; versão exata para builds reproduzíveis). Pacote Android `com.paulaksm.grannymemories`. Projeto EAS `@pksm/granny-memories` (`1a101ff8-8296-4094-8325-656d80de9973`); o primeiro, criado por engano na org `backpackexpo`, foi descartado. Keystore gerada e guardada pelo EAS (nunca no repositório). Perfil `development` gera APK de distribuição interna.
- **Motivo:** o llama.rn exige New Architecture e código nativo, então precisa de development build. Build na nuvem pelo EAS para não instalar Android SDK e NDK nesta máquina.
- **PRD afetado:** nenhum (segue "Arquitetura").

## 2026-10-04: perfil de voz mínimo entra no recorte

- **Decisão:** o analista de voz entra na fatia vertical, em versão mínima. O perfil combina estatísticas calculadas por código, trechos reais da autora como exemplos e no máximo 3 traços descritos pelo modelo. A autora aprova cada traço, e o redator de capítulos usa só os aprovados. As telas mínimas seguem o protótipo do Claude Design: escolher ou gravar um áudio, transcrever, aprovar o perfil de voz, ver as ideias e ler o capítulo com os IDs de origem.
- **Motivo:** sem perfil de voz, o capítulo não sai "na voz dela", que é a promessa central do app. Limitar a 3 traços e apoiar o resto em código reduz o peso sobre o modelo local pequeno.
- **PRD afetado:** "Contexto", parágrafo "Recorte para o prazo" (acrescentar RF6 em versão mínima); RF6 (o critério completo, com traços sem limite e guia de voz, continua sendo o do produto).

## 2026-10-04: build só para arm64-v8a

- **Decisão:** `expo-build-properties` com `android.buildArchs: ["arm64-v8a"]`.
- **Motivo:** o primeiro development build compilou o llama.cpp para 4 arquiteturas, gerou um APK de 278 MB e bateu o limite de 45 min do plano gratuito do EAS (terminou como CANCELED, mas com o APK completo). Os Samsung S24 e S25 são arm64; as outras arquiteturas só servem a emuladores.
- **PRD afetado:** nenhum (Arquitetura, linha "Aplicativo").

## 2026-10-04: harness da fatia aprovado

- **Decisão:** aprovado `docs/harness-fatia.md`. Pontos principais: o modelo responde em JSON imposto por esquema e o código escreve os arquivos nos formatos dos prompts; limpeza por parágrafo, com a verificação nova `limpeza` (nenhuma palavra que não esteja no bruto); traços de voz em linhas `[ ]`/`[x]`/`[-]` com evidência literal conferida por código; uma nova tentativa automática por verificação falha, depois erro na tela; demonstração com 2 a 3 áudios curtos. Exceção à regra de portagem: só `atomos` e `rastreio` e seus 10 testes entram no prazo.
- **Motivo:** modelo pequeno erra formatos; o que dá para calcular por código sai do modelo. A exceção dos testes cabe no prazo sem perder a verificação do que a fatia usa.
- **PRD afetado:** Harness (saída estruturada e verificação `limpeza`), RF6 (perfil mínimo).

## 2026-10-04: modelo local Gemma 4 E2B

- **Decisão:** Gemma 4 E2B instruct, GGUF Q4_K_M (cerca de 3,1 GB), nos dois aparelhos, baixado do Hugging Face na primeira abertura. E4B (cerca de 5 GB) só como opção futura para o redator no S25. Contexto inicial de 8192 tokens; temperaturas iniciais: limpeza 0,1, extrator 0,2, analista 0,3, redator 0,6.
- **Motivo:** cabe com folga no piso de 8 GB; licença Apache 2.0, sem cadastro; há uso documentado com o llama.rn; habilita a categoria Gemma do desafio. O E4B com contexto e app passaria de 6 GB.
- **PRD afetado:** Arquitetura (linha "Modelo local"); Decisões em aberto ("Qual modelo local usar" e "O llama.rn oferece saída estruturada").

## 2026-10-04: telas seguem o protótipo do Claude Design

- **Decisão:** as telas seguem o protótipo completo do handoff (`design/design_handoff_granny_memories/`, protótipo 2a e tela de voz): Meus livros (vários livros e rascunhos sem livro), Livro (linha do tempo, capítulos com ordem por setas, exclusão), Transcrição, Seu jeito de contar, Ideias, Capítulo, Prévia do livro e Configuração, com as folhas e os estados. Ajustes em relação ao handoff:
  - **Correção mínima da transcrição (RF3 mínimo):** palavras de baixa confiança do Scribe aparecem como `[?]`; a autora toca e corrige. A transcrição bruta original continua imutável; a correção fica numa camada separada e a limpeza roda sobre o texto corrigido.
  - **Só traços aprovados** ("Isso sou eu") entram na escrita. "Usar meu jeito de contar" fica desativado até ela decidir todos os traços (o handoff usava os não decididos).
  - **Processos longos com o app aberto:** o texto passa a pedir que o app fique aberto; não há execução com o app fechado na fatia.
  - **Rede:** sem fila automática; o áudio fica "Na fila" e o botão "Tentar agora" reenvia.
  - **Ghost writer:** o botão de balão fica escondido (maestro fora do recorte).
  - **Tamanho do modelo:** o valor real do Gemma 4 E2B Q4_K_M (cerca de 3,1 GB), não 1,9 GB.
  - **Fora:** editar o capítulo e responder lacunas virando passagem ("Sua resposta"). As lacunas aparecem como perguntas. "Aprovar capítulo" só muda o status.
  - **Gravar e escolher arquivo:** sem tela no protótipo; versão simples com os tokens do design.
- **Motivo:** escolha da autora do projeto, ciente do risco de prazo. Para proteger a entrega, a ordem de trabalho é harness e fluxo de um áudio até o capítulo primeiro; livros, ordem, exclusão e prévia depois.
- **PRD afetado:** Escopo, "Fora do MVP" ("Mais de um livro por autora" passa a estar dentro, ao menos na interface); Jornada (telas); RF3 em versão mínima; RF6 (aprovação por traço).

## 2026-10-04: teste técnico no S24 (Gemma 4 E2B)

- **Resultado:** no Galaxy S24 (SM-S921B, Exynos 2400, Android 16, 7,4 GB de RAM), o llama.rn enxerga só a CPU. O Gemma 4 E2B Q4_K_M carregou em 4,8 s; o app chegou a 2,9 GB de memória (PSS) sem ser fechado. Leitura do prompt: 42 a 59 tokens/s; geração: 11 a 12,5 tokens/s. A limpeza de um parágrafo sintético levou 21 s e passou na verificação `limpeza`; o extrator levou 26 s e devolveu JSON válido no esquema, com trecho literal exato. Estimativa para um áudio de 5 min: de 6 a 8 min do áudio ao capítulo.
- **Observação de qualidade:** o resumo de uma ideia trocou "a gente" por "a família", palavra que ela não usou. O resumo não passa por verificação literal; a tela mostra o trecho original ao lado.
- **Decisão:** manter o Gemma 4 E2B, só CPU no S24, e seguir com as telas. Falta medir no S25.
- **PRD afetado:** Requisitos não funcionais (tempo de redação e memória, antes "a definir"); Plano e marcos, marco 1 (teste técnico) cumprido no S24.

## 2026-10-04: entrega validada só no S24

- **Decisão:** a medição no S25 fica fora da entrega do desafio. O app é validado e demonstrado no Galaxy S24.
- **Motivo:** prazo. O S24 (Exynos, só CPU, 7,4 GB) é o caso mais difícil dos dois; o S25 deve ir igual ou melhor.
- **PRD afetado:** Qualidade e métricas, teste "Desempenho" (S25 pendente).

## 2026-10-04: teste ponta a ponta no S24 e ajustes

- **Resultado:** no Galaxy S24, com um áudio de voz sintética (26 s), o app fez o fluxo inteiro: escolher o áudio, transcrever (Scribe v2), limpar, separar ideias, perfil de voz (cerca de 2 min 35 s), aprovar traços e escrever o capítulo (cerca de 1 min 20 s), com cada parágrafo rastreado e a aprovação do capítulo.
- **Correções feitas no teste:**
  - o fetch do Expo SDK 57 não aceita `{ uri, name, type }` em FormData; o áudio vai como `File` do expo-file-system (que é um `Blob`);
  - a importação disparava duas transcrições; agora a tela de carregamento é a única que transcreve;
  - o Android fechou o app por falta de memória numa segunda rodada; o modelo agora é liberado ao fim de cada tarefa longa, e qualquer contexto esquecido é solto antes de carregar;
  - prompts: traços de voz sobre o jeito de contar (não o assunto), resumos em primeira pessoa e com as palavras dela, e o redator recebe só os trechos literais (antes herdava "pois" dos resumos).
- **Limites observados:** o Gemma 4 E2B ainda escreve traços em terceira pessoa ("A autora…") e às vezes um traço sobre o assunto; a autora recusa esses na tela. Os resumos das ideias às vezes acrescentam "pois".
- **PRD afetado:** Qualidade e métricas, teste "Escrita" (primeira medição) e "Desempenho" (S24).
