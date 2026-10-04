# Handoff: Granny Memories (Android)

## Visão geral
Granny Memories é um app Android que transforma os áudios que uma pessoa idosa grava em capítulos de um livro de memórias, escritos na voz dela. A usuária principal é a própria avó, que grava as histórias. Por isso o app usa texto grande, contraste alto, alvos de toque de 48 px ou mais e um botão principal por tela. O tom visual é de caderno de memórias: papel, tinta e um acento terroso. Nada deve lembrar um "app de IA".

Fluxo principal: **Meus livros → Livro → Transcrição → Seu jeito de contar → Ideias → Capítulo**. A **Prévia do livro** abre a partir do Livro. A **Configuração** fica fora do fluxo.

## Sobre os arquivos de design
Os arquivos `.dc.html` deste pacote são **referências de design feitas em HTML**: protótipos que mostram a aparência e o comportamento pretendidos. **Não são código de produção.** A tarefa é **recriar essas telas em React Native** (o briefing pede que seja implementável em RN), seguindo os padrões do projeto. Se ainda não houver projeto, use React Native + TypeScript (Expo serve).

Para ver o protótipo, abra `design/Granny Memories.dc.html` num navegador, com `support.js` na mesma pasta. O turno 2 (protótipo **2a**) é o fluxo navegável atual. O turno 3 mostra a tela de voz e os estados dela. O turno 1 é a versão anterior, sem livros; serve só de histórico. A lógica de cada tela fica na classe `Component` no fim de `design/GrannyApp2.dc.html`.

## Fidelidade
**Alta fidelidade.** Cores, tipografia, espaçamentos, raios e textos são finais. Recrie fiel ao protótipo. Todos os textos de exemplo (títulos, trechos, durações) vêm do briefing e são **fictícios**: em produção, troque pelos dados reais.

Restrições de RN: nada de gradientes, blur, `backdrop-filter` ou sombras complexas. Use sombra só em folhas (bottom sheet) e toasts, via `elevation`.

---

## Estrutura comum das telas
- Largura de referência 390 dp, compatível de 360 a 412. Fundo `paper` #F6EFEC.
- **Margem lateral 24.**
- **ScreenHeader** (telas internas): "Voltar" à esquerda (48 de altura, ícone chevron 24 + texto 18/700, padding 0 14 0 8, raio 14). À direita, botão redondo de 48 com borda 1.5 `line-soft` e ícone de balão de fala: é o espaço reservado da "ghost writer", **sem tela por enquanto**.
- **Bloco de título:** StepLabel ("Passo N de 4", 15/700, `tawny-ink`), H1 30/36 700, subtítulo 17/24 `ink-soft`. Padding 8 24 16.
- **Área de conteúdo** com rolagem.
- **BottomActionBar** fixa: borda superior 1 `line`, padding 12 24, fundo `paper`, com o PrimaryButton (60 de altura).
- Folhas (bottom sheets) e toasts ficam sobre a tela; detalhes em Componentes.

## Telas

### 1. Meus livros (início)
- **Objetivo:** escolher o livro onde registrar os áudios, ou ver áudios soltos, que são rascunhos ainda sem livro.
- **Topo:** "Granny Memories" em Literata itálico 18, `tawny-ink`, à esquerda. À direita, botão "Ajustes" (48, ícone de controles + 17/700), que leva à Configuração. Abaixo, H1 "Meus livros" 32/38 700.
- **BookCard:** linha com padding 18, borda 1 `line`, raio 18, fundo `paper-raised`.
  - Capa 76×104, `blue` #007190, raio 3 10 10 3, sombra interna à esquerda simulando a lombada, título 15 Literata 600 em `paper-raised`.
  - Título do livro em Literata 24/30 600, meta "2 capítulos · 2 áudios" 16 `ink-soft`, "Abrir o livro" 16/700 `tawny-ink` e chevron.
  - Tocar abre o Livro.
- **"Começar um livro novo":** 56, borda **tracejada** 2 `ink-border`, raio 14. No protótipo, só mostra um toast.
- **Seção "Rascunhos sem livro"** (H2 20/26 700) com a descrição "Áudios que ainda não estão em nenhum livro." Cada rascunho mostra:
  - meta "Áudio 3 · 0:28 · Na fila" (15 `ink-soft`);
  - nome em Literata 21/28 600;
  - botão "Guardar em um livro" (48, contorno 2 `ink-border`, raio 12, ícone de livro), que abre a folha **Guardar em um livro**.
  - Se a lista estiver vazia: "Nenhum rascunho solto agora."
- **Rodapé:**
  - PrimaryButton "Gravar uma história" (**64** de altura, 20/700, ícone de microfone): abre a folha **Onde guardar esta história?**.
  - Abaixo, o **PrivacySeal**.
- **Estado sem livros** (depois de excluir): o BookCard some e aparece "Você ainda não tem livros." (Literata 22/31).

### 2. Livro
- **Header:** Voltar (vai para Meus livros) + ghost writer.
- **Título:**
  - Kicker "Livro" 15/700 `tawny-ink`.
  - Linha com o título em Literata 30/38 600 e, ao lado, o **botão lápis** (48×48, contorno 2 `ink-border`, raio 12): abre a folha **Nome do livro**.
  - Meta "2 capítulos · N áudios".
- **Cartão "Ver prévia do livro":** miniatura de página 54×70 (fundo `paper-page`, sombra chapada 3 3 0 `line`, letra "T" tawny e linhas). Texto "Ver prévia do livro" 19/700 e "Como o livro está hoje, na sua voz." Leva à Prévia.
- **SegmentedTabs** "Linha do tempo | Capítulos": 52 de altura, trilho #ECE0DE, aba ativa `paper-raised` com sombra leve, raio 10/14.
- **Aba Linha do tempo** ("Na ordem em que você gravou."): **TimelineItem** com trilho vertical de 2 `line` e ponto de 16 por estado:
  - Pronto: `green` sólido;
  - Transcrevendo: `blue` com halo de 5 `blue-tint`;
  - Na fila: aro de 3 `ink-border`.

  Cada item tem nome em Literata 21/28 600 e meta "Áudio N · dur · estado"; tocar abre o áudio (ver Navegação). Embaixo, um botão de capítulo:
  - Com capítulo: contorno 2 `ink-border` + ícone de livro + "Capítulo 1 · 1º de 2".
  - Sem capítulo: "Escolher o capítulo", borda tracejada 2 `tawny`, fundo `tawny-tint`, texto `tawny-ink`.
  - Os dois abrem a folha **Capítulo e ordem**.
- **Aba Capítulos** ("Use as setas para mudar a ordem dos áudios dentro da história."):
  - Para cada capítulo: kicker "Capítulo N" e título em Literata 23/30.
  - Cada linha tem número da posição (círculo de 34 `ink` com texto `paper`), nome (Literata 19/25) + meta e as setas **Subir/Descer** (48×48, contorno 2 `ink-border`, raio 12). A seta fica a 35% de opacidade quando não há para onde mover.
  - Capítulo vazio: "Nenhum áudio neste capítulo ainda."
  - Áudios sem capítulo aparecem num grupo "Sem capítulo · Ainda sem lugar", com o botão "Escolher".
  - No fim, o botão tracejado "Novo capítulo" (só toast no protótipo).
- **Fim da rolagem:** separador 1 `line` e "Excluir este livro" (56, contorno 2 `error` #9A2E22, texto `error`, ícone de lixeira; hover #F5DAD3). Abre a folha **Excluir**.
- **Rodapé:** PrimaryButton "Gravar para este livro".

### 3. Transcrição (Passo 1 de 4)
- H1 "Transcrição" e o subtítulo "O que o app ouviu no seu áudio."
- **Linha do áudio:** "Áudio 1 · 0:42" + "O bolo de laranja" (Literata 19/600) e o PillButton "Ouvir o áudio", que vira "Tocando…" durante a reprodução.
- **Aviso** (`tawny-tint`, raio 14, texto #6E3210): "Uma palavra não ficou clara. Toque nela para corrigir." Tem um botão "Corrigir a palavra" (48, fundo `paper-raised`). Depois de corrigida, vira um aviso verde (`green-tint`): "Palavra corrigida. Confira o resto e continue."
- **Texto** em Literata 21/36. A palavra duvidosa aparece como **DoubtfulWord** "[?]"; tocar abre a folha **Qual palavra você disse aqui?**. Depois da correção, a palavra corrigida fica com fundo `green-tint` e sublinhado sólido `green`.
- **Rodapé:** "Está certo, continuar" leva ao carregamento **Lendo como você fala…** e, em seguida, a Seu jeito de contar.

### 4. Seu jeito de contar (Passo 2 de 4)
- H1 "Como você conta suas histórias". Subtítulo: "Baseado em 3 áudios. Quanto mais você gravar, mais o app aprende."
- **Poucos dados** (só um áudio): aviso suave no topo (`paper-sunk`, ícone "i"): "Com um áudio só, ainda é um palpite. Confirme o que for seu." O subtítulo passa a dizer "Baseado em 1 áudio…", e só aparecem os traços que vêm desse áudio.
- **Três VoiceTraitCard** empilhados, com gap de 14:
  1. Ritmo: "Frases curtas, e uma mais longa no meio para respirar." Trecho: "Toda sexta-feira a casa cheirava a laranja. Era dia de bolo." (Áudio 1 · 00:03)
  2. Abertura: "Começa com uma cena concreta antes de explicar." Trecho: "Eu ficava na porta da cozinha esperando minha avó tirar a forma do forno." (Áudio 1 · 00:14)
  3. Jeito de dizer: "Fala de aprendizado de forma simples, sem sermão." Trecho: "Aprendi mais cozinhando junto do que em qualquer livro." (Áudio 3 · 00:09)
- **Sem** gráficos, porcentagens ou pontuações. O trecho real é o maior elemento do cartão.
- **Rodapé:** "Usar meu jeito de contar".
  - Vindo do fluxo, vai para Ideias.
  - Vindo do Capítulo, volta ao Capítulo.
  - Vindo de Ajustes, volta à Configuração com o toast "Seu jeito de contar foi salvo."
  - O StepLabel mostra "Ajustes" quando a tela foi aberta a partir da Configuração.
  - "Voltar" sempre retorna à tela de onde se veio.

### 5. Ideias (Passo 3 de 4)
- H1 "Ideias", com o subtítulo "O app separou 3 ideias. Toque em uma para ver o trecho original."
- **IdeaCard:** padding 18 20, borda 1 `line`, raio 18, fundo `paper-raised`.
  - Tag de tipo (História, Fato ou Opinião; 30 de altura, fundo #ECE0DE) e a dica "Ver trecho" / "Fechar" à direita.
  - Resumo em Literata 21/30 e o SourceSeal.
  - Tocar expande o "Trecho original" (Literata itálico 19/30 sobre `paper`) com o PillButton "Ouvir o áudio".
- **Rodapé:** "Escrever o capítulo" leva ao carregamento "Escrevendo o capítulo no seu celular" e depois ao Capítulo.

### 6. Capítulo (Passo 4 de 4)
- Kicker "Passo 4 de 4 · Capítulo" e o título em Literata 30/38 600.
- Logo abaixo, o **VoiceSeal** "Escrito no seu jeito de contar" (pílula de 32, `paper-sunk`, texto `ink-muted`, ícone de pena), que abre Seu jeito de contar. Depois, a StatusTag Rascunho ou Aprovado.
- Dica "Toque em um selo para ver de onde veio cada trecho."
- **Passagens:** Literata 21/35, cada uma seguida do seu SourceSeal, que abre a folha "De onde veio este trecho".
- **GapPrompt:** "Falta uma parte", "Quem cortava o primeiro pedaço?", "No áudio, essa palavra não ficou clara.", campo e o botão "Guardar resposta". A resposta vira uma nova passagem com o selo "Sua resposta" (sem botão de ouvir).
- **Rodapé:**
  - "Editar" (secundário, flex 1) e "Aprovar capítulo" (principal, flex 1.7).
  - Em edição, cada passagem vira um textarea (Literata 20/32) e os botões passam a ser "Cancelar" e "Salvar alterações". Os selos continuam junto de cada trecho.
  - Depois de aprovar: aviso verde "Capítulo aprovado. Ele já faz parte do seu livro." e o botão "Voltar para o livro".

### 7. Prévia do livro
- Fundo `desk` #EADCDA. Header com "Voltar" e "Prévia do livro" 17/700.
- **BookPage:** fundo `paper-page`, raio 4 10 10 4, sombra 0 2 0 #DCCAC7 + `elevation` baixa.
  - Cabeçalho corrido em Literata itálico 15: título do livro à esquerda, "Página N de M" à direita.
  - Número da página centralizado no pé.
- **Páginas:**
  - **Capa:** "Prévia de hoje", título em Literata 46/52, filete tawny de 48×3, "Escrito a partir dos seus áudios, na sua voz." e a meta.
  - **Sumário:** linhas tocáveis com "N. Título ... página" e a tag de estado (Rascunho, Aprovado, Esperando a transcrição ou Sem áudios).
  - **Uma página por capítulo**, montada na ordem definida em Livro › Capítulos:
    - kicker "CAPÍTULO N" e o título;
    - o primeiro parágrafo tem **capitular** tawny (62/54) e os seguintes têm recuo de 1.4em;
    - todo parágrafo tem SourceSeal;
    - lacunas abertas aparecem como GapPrompt compacto, com "Responder no capítulo";
    - áudios ainda em transcrição aparecem como aviso: "O Áudio 2 · A mudança para a cidade ainda está sendo transcrito…".
- **Rodapé:** "Anterior" (secundário) e "Próxima página" (principal), a 40% de opacidade nos extremos.
- A prévia acompanha o estado: correções, respostas, edições e a ordem dos áudios aparecem nela.

### 8. Configuração (fora do fluxo)
- **"Chave da ElevenLabs"**, com o texto "Serve para transcrever seus áudios."
  - Campo de senha de 56 ("Cole a chave aqui") e o botão "Mostrar" / "Ocultar".
  - Com a chave preenchida: "Chave guardada no seu celular", em verde.
- **"Seu jeito de contar":** linha tocável "Veja e ajuste como o app escreve na sua voz.", que abre a tela de voz.
- **"Modelo no aparelho":** "Escreve os capítulos no seu celular, sem usar a internet."
  - Tag de estado: Não baixado, Baixando · N% ou Baixado.
  - "Tamanho: 1,9 GB". **Esse valor é provisório.**
  - Botão "Baixar modelo" e, durante o download, a ProgressBar com o aviso "Pode continuar usando o app ou fechá-lo. O download continua."
- **"O que sai do seu celular":** "Sai: só o áudio / E só durante a transcrição." e "Fica no celular / Seus textos, ideias e capítulos."

### Estados
- **Carregando** (tela própria, com Voltar e o botão secundário "Voltar para o livro" no rodapé):
  - Contém: fonte, H1, ProgressBar de 14 com % e um aviso com ícone de celular.
  - Três versões:
    - "Transcrevendo seu áudio";
    - "Lendo como você fala…";
    - "Escrevendo o capítulo no seu celular".
  - Todas avisam que o app pode ser fechado.
- **Vazio** (sem áudios): "Conte a primeira história. Pode ser curta." (Literata 28/38), com espaço reservado para a ilustração de um caderno aberto.
- **Erro de rede:**
  - Ícone de nuvem cortada (72, fundo #F5DAD3, traço #9A2E22) e o H1 "Sem internet".
  - Texto: "Sem internet. O áudio ficou na fila e será enviado quando você voltar a ficar online."
  - Cartão do áudio com a tag "Na fila".
  - Botões "Voltar para o livro" (principal) e "Tentar agora" (secundário).

## Folhas (bottom sheets)
Todas usam o mesmo **BottomSheet**: fundo `paper-raised`, raio 24 só no topo, alça de 44×5 `line-soft`, padding 12 24 20, altura máxima de 92% com rolagem e scrim rgba(46,35,34,.45). Tocar no scrim fecha a folha.

- **Onde guardar esta história?** Opções: "Meu livro / Você escolhe o capítulo depois" (com a mini capa azul) e "Rascunho sem livro / Fica guardado até você decidir" (com a borda tracejada). Tem "Cancelar".
- **Guardar em um livro:** mostra o áudio e o livro selecionado, com o botão "Guardar e escolher o capítulo". Ao confirmar, vai para o Livro e abre **Capítulo e ordem**.
- **Capítulo e ordem:**
  - Pergunta "Em qual capítulo?" com rádios de 60: "Capítulo N / título" e "Sem capítulo / Decido depois".
  - Em "Ordem dentro do capítulo", o áudio atual fica destacado com fundo `tawny-tint` e as setas Subir/Descer.
  - Botão "Pronto".
- **Nome do livro:** campo de 60 em Literata 22, "Salvar nome" (desativado se estiver vazio) e "Cancelar". Ao salvar, mostra o toast "Nome do livro salvo."
- **Excluir "título"?**
  - Ícone de lixeira, pergunta "O que fazer com os N áudios deste livro?" e rádios de 64:
    - "Excluir só o livro / Os áudios voltam para Rascunhos sem livro." (**padrão**);
    - "Excluir o livro e os áudios / Os áudios e os textos saem do seu celular. Não dá para desfazer."
  - O botão `error` muda o rótulo conforme a escolha; "Cancelar" é em contorno.
  - Depois de excluir: volta a Meus livros com um toast.
- **Qual palavra você disse aqui?** Mostra o contexto com uma lacuna tracejada, o selo "Áudio 1", "Ouvir este trecho", o campo e "Salvar correção" (a 45% enquanto estiver vazio).
- **De onde veio este trecho:** SourceSeal, trecho original em itálico, "Ouvir este trecho" (escondido para "Sua resposta") e "Fechar".

## Interações e navegação
- **Voltar:**
  - Livro → Meus livros
  - Transcrição → Livro
  - Seu jeito de contar → Transcrição (ou a tela de origem)
  - Ideias → Seu jeito de contar
  - Capítulo → Ideias
  - Prévia → Livro
  - Configuração → Meus livros
  - Erro → Livro
- **Tocar num áudio:**
  - Pronto abre a Transcrição.
  - Transcrevendo abre o carregamento da transcrição.
  - Na fila mostra o toast "O Áudio 3 está na fila. Ele será transcrito depois do Áudio 2."
- **Gravar e escolher arquivo** estão fora do escopo do protótipo (mostram só um toast).
- **Toast:** fundo `ink`, texto `paper` 17/24, raio 14, 16 de distância das bordas, some em cerca de 2,8 s.
- **Reordenar** só pelas setas (sem arrastar), para facilitar o uso com uma mão e por pessoas idosas.
- **Pressionado:** principal #A3501F; botões transparentes #EDE1DE.
- **Foco:** contorno de 3 tawny, afastado 2.
- O protótipo não tem animações de transição; use a transição padrão do navegador de telas do RN.
- **Botões desativados:** opacidade de 0.45.

## Gerenciamento de estado
- **Livros:** `{ id, title, deleted }`. **Capítulos:** `{ n, title }` por livro.
- **Áudios:** `{ id, label, name, duration, status: 'ready'|'transcribing'|'queued', bookId|null, chapterId|null }`. Ordem por capítulo: `order[chapterId] = audioId[]`.
- **Transcrição:** texto + palavras duvidosas e as correções feitas. **Lacunas:** pergunta + resposta.
- **Ideias:** `{ type, summary, source: {audioId, ts}, original }`. **Passagens do capítulo:** `{ text, source, edited }`.
- **Capítulo:** `status: 'draft'|'approved'`.
- **Traços de voz:** `{ name, trait, quote, source, decision: null|'yes'|'no' }`. Traços com `decision === 'no'` não são usados na escrita.
- **Configuração:** chave da ElevenLabs (armazenamento seguro, nunca em texto puro) e estado e progresso do modelo.
- **Processos longos** (transcrição, leitura da voz, escrita, download) continuam com o app fechado. A interface só lê o progresso.
- **Privacidade:** só o áudio sai do aparelho, e só durante a transcrição. Todo o resto fica salvo no celular.

## Design tokens
A lista completa está em `tokens.md` (com o uso de cada token) e `tokens.json`. Resumo:

**Cores**
- Papel e tinta, derivados de Light Brown Drab #B59392:
  - papel: paper #F6EFEC, paper-raised #FCF8F6, paper-page #FFFCFB, paper-sunk #EFE4E1, paper-pressed #EDE1DE, desk #EADCDA;
  - linhas: line #E4D5D2, line-soft #CDB8B6;
  - tinta: ink #2E2322, ink-muted #4F3D3C, ink-soft #66504F, ink-border #8E716F, placeholder #7F6866.
- Vinaceous Tawny (ação): tawny #C56127, hover #B2571F, pressed #A3501F, tint #F6E1D3, ink #8A3F14.
- Antwarp Blue (origem, progresso, capa): blue #007190, tint #DCEEF3, ink #00586F.
- Andover Green (pronto, aprovado): green #6D7E77, tint #E3E9E6, ink #3F4D47.
- Lacuna: gap #FAEDB5, gap-line #E2C866, gap-ink #5C4709.
- Erro: error #9A2E22, error-tint #F5DAD3.
- Scrim: rgba(46,35,34,.45).

**Tipografia**
- Literata (400, 600, itálico 400) para o texto do livro.
- Atkinson Hyperlegible (400, 700) para a interface.
- Escala:
  - display 32/38 700
  - title 30/36 700
  - sheet-title 24/30 700
  - book-title Literata 30/38 600
  - book 21/35
  - quote Literata itálico 19/30
  - body 17–19
  - button 19/18/17 700
  - small 15/20 700 (mínimo da interface)

**Espaçamento:** 4, 8, 12, 16, 24, 32, 48. Margem lateral de 24; seções separadas por 36 na Configuração.

**Raios:** 12 campos, 14 botões, 18 cartões, 24 folhas, 999 pílulas.

**Toque:** mínimo 48. Principal 60 (64 em Meus livros); secundário 56; campos 56; setas e lápis 48×48.

**Contraste:** o branco sobre tawny dá 4,1:1, o que vale só para texto de 19 px ou mais em negrito. Não use tawny em texto pequeno; use `tawny-ink`.

## Componentes
PrimaryButton, SecondaryButton, PillButton, SourceSeal, StatusTag, IdeaCard, GapPrompt, DoubtfulWord, PrivacySeal, ScreenHeader, StepLabel, BottomActionBar, ProgressBar, BottomSheet, Toast, BookCard, TimelineItem, ChapterAssign, BookPage, SegmentedTabs, AudioRow, TextField, TitleEdit, DeleteConfirm, **VoiceTraitCard** e VoiceSeal. As especificações de cada um estão em `tokens.md`.

**VoiceTraitCard**
- Base: fundo `paper-raised`, raio 18, borda 2 `line`, padding 18 20, gap 14.
- Conteúdo:
  - nome do traço 15/700 em maiúsculas, `tawny-ink`;
  - o traço 18/26;
  - trecho em Literata 23/35 entre aspas tipográficas;
  - SourceSeal.
- Botões "Isso sou eu" e "Não sou eu": lado a lado, 52 de altura, flex 1, contorno 2 `ink-border`, raio 12, 17/700, sem ícone e sem quebra de linha.
- **Aprovado:** borda `tawny`, chip "É você" com check (tawny e branco) ao lado do nome e o botão "Isso sou eu" preenchido de tawny. Tocar de novo desmarca.
- **Recusado:** conteúdo a 45% de opacidade. Os botões dão lugar a "Este traço não será usado" (17/700 `ink-muted`) e ao link "Desfazer" (`tawny-ink`, sublinhado, alvo de 48).

## Assets
- **Fontes:** Literata e Atkinson Hyperlegible, do Google Fonts (licença OFL). No RN, use `@expo-google-fonts/literata` e `@expo-google-fonts/atkinson-hyperlegible`, ou empacote os arquivos.
- **Ícones:** desenhados em linha simples de 24 px, traço 2 (microfone, onda de áudio, livro, lápis, lixeira, setas, check, X, cadeado, celular, controles, balão, pena, nuvem cortada, pasta, olho, download). Use a biblioteca de ícones do projeto no mesmo peso; Lucide (`lucide-react-native`) é a mais próxima.
- **Ilustração do estado vazio:** espaço reservado (um caderno aberto). Ainda precisa ser criada.
- Não há imagens.

## Arquivos
- `design/Granny Memories.dc.html`: o canvas com todos os turnos (abrir no navegador).
- `design/GrannyApp2.dc.html`: **o app atual** (telas, folhas, estados e lógica).
- `design/GrannyApp.dc.html`: versão 1, histórica (sem livros e sem a tela de voz).
- `design/support.js`: runtime necessário para abrir os `.dc.html`.
- `tokens.md`: tokens, componentes e textos fixos.
- `tokens.json`: os mesmos tokens em formato legível por máquina, pronto para virar `theme.ts`.
- `design-brief.md`: o briefing original.

## Pendências
- Tamanho do modelo (1,9 GB): valor provisório.
- Livros e capítulos de exemplo ("Meu livro", títulos dos capítulos): inventados para o protótipo.
- A ideia do Áudio 3 usa um trecho de um áudio que ainda está "Na fila": inconsistência dos dados de exemplo.
- Ghost writer, gravação, escolha de arquivo, criação de livro e criação de capítulo: sem telas ainda.
