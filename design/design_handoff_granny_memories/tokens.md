# Granny Memories: tokens e componentes

Referência visual: `Granny Memories.dc.html` (turno 2, “Paleta v2”). Telas atuais: `GrannyApp2.dc.html` (v1, histórica, em `GrannyApp.dc.html`).
Alvo: React Native, Android, 360 a 412 px de largura. Sem gradientes, blur ou efeitos.

## Cores (v2: Light Brown Drab, Vinaceous Tawny, Andover Green, Antwerp Blue)
| token | valor | uso |
|---|---|---|
| drab | #B59392 | cor de referência do papel |
| paper | #F6EFEC | fundo das telas |
| paper-raised | #FCF8F6 | cartões, folhas, campos |
| paper-page | #FFFCFB | página na prévia do livro |
| paper-sunk | #EFE4E1 | selo de privacidade, avisos |
| paper-pressed | #EDE1DE | hover/pressionado em botões transparentes |
| desk | #EADCDA | fundo atrás da página na prévia |
| line | #E4D5D2 | divisórias, borda de cartão |
| line-soft | #CDB8B6 | botão da ghost writer, placeholders |
| ink | #2E2322 | texto principal |
| ink-soft | #66504F | texto secundário |
| ink-muted | #4F3D3C | texto em fundos tingidos |
| ink-border | #8E716F | borda de botão secundário e campos |
| tawny | #C56127 | ação: botão principal (texto branco ≥19 px bold), capitular |
| tawny-hover / pressed | #B2571F / #A3501F | |
| tawny-tint | #F6E1D3 | palavra duvidosa, “Escolher o capítulo”, seleção |
| tawny-ink | #8A3F14 | texto sobre tawny-tint, rótulos de passo |
| blue | #007190 | capa do livro, progresso “Transcrevendo” |
| blue-tint | #DCEEF3 | selo de origem, tag Transcrevendo/Baixando |
| blue-ink | #00586F | texto do selo de origem |
| green | #6D7E77 | ponto de Pronto/Aprovado |
| green-tint | #E3E9E6 | tag Pronto, aviso de sucesso |
| green-ink | #3F4D47 | texto sobre green-tint |
| gap | #FAEDB5 / borda #E2C866 / texto #5C4709 | lacuna (amarelo suave, do briefing) |
| error | #9A2E22 / tint #F5DAD3 | Sem internet |

## Tipografia
- Livro: **Literata** (400, 600, itálico 400)
- Interface: **Atkinson Hyperlegible** (400, 700)

| token | fonte | tamanho/altura | peso |
|---|---|---|---|
| display | Atkinson | 32/38 | 700 |
| title | Atkinson | 30/36 | 700 |
| sheet-title | Atkinson | 24/30 | 700 |
| section | Atkinson | 19–20/24–26 | 700 |
| book-title | Literata | 30/38 | 600 |
| book | Literata | 21/35 (transcrição 21/36) | 400 |
| book-card | Literata | 21/30 | 400 |
| quote | Literata itálico | 19/30 | 400 |
| body | Atkinson | 17–19/24–28 | 400 |
| button | Atkinson | 19 (principal), 18 (secundário), 17 (pequeno) | 700 |
| small | Atkinson | 15/20 (mínimo da interface) | 700 |

## Espaço, raios, toque
- Espaço: 4, 8, 12, 16, 24, 32, 48. Margem lateral da tela 24. Entre seções 36.
- Raios: 12 campos/avisos, 14 botões, 18 cartões, 24 folhas, 999 selos/tags.
- Toque: mínimo 48. Principal 60 (64 em Meus livros). Secundário 56. Campos 56.
- Foco: contorno 3 px tawny, afastado 2 px.
- Sombra só em folha e toast (`elevation` no RN).

## Componentes
- **PrimaryButton**: 60 px, tawny, texto branco 19/700, ícone opcional. Um por tela.
- **SecondaryButton**: 56 px, transparente, borda 2 px ink-border.
- **PillButton**: 48 px, raio 999, para "Ouvir o áudio" / "Ouvir este trecho".
- **SourceSeal**: pílula 34 px blue-tint, ícone de onda + "Áudio N · mm:ss" (ou "Sua resposta"). Área de toque 48. Toque abre a folha "De onde veio este trecho".
- **StatusTag**: pílula 30 px com ponto. Pronto (ok), Transcrevendo (blue), Na fila (neutro, ponto vazado). Também Rascunho/Aprovado, Baixado/Não baixado.
- **IdeaCard**: cartão paper-raised, tipo (História/Opinião/Fato), resumo em Literata, SourceSeal. Toque expande o trecho original + PillButton "Ouvir".
- **GapPrompt**: bloco gap com "Falta uma parte", pergunta em Literata, explicação, campo e botão "Guardar resposta". A resposta vira uma passagem com selo "Sua resposta".
- **DoubtfulWord**: palavra destacada no texto (tawny-tint, sublinhado tracejado). Toque abre a folha de correção.
- **PrivacySeal**: cadeado + "Seus textos ficam no seu celular. Só o áudio é enviado para ser transcrito."
- **ScreenHeader**: "Voltar" (48 px) + espaço da ghost writer (botão redondo 48 px, sem tela).
- **StepLabel**: "Passo N de 4", 15/700, tawny-ink.
- **BottomActionBar**: rodapé fixo, borda superior line, padding 12/24.
- **ProgressBar**: 12–14 px, trilho line, preenchimento tawny, com % e aviso "Pode fechar o app".
- **BottomSheet**: paper-raised, raio 24 no topo, alça, scrim.
- **Toast**: ink com texto paper, 17 px.
- **BookCard**: capa azul + título em Literata + contagem de capítulos e áudios.
- **ChapterAssign**: folha com rádio de capítulo (60 px) e lista de ordem com setas Subir/Descer (48 px).
- **TimelineItem**: trilho com ponto de estado, nome, botão de capítulo (“Capítulo 1 · 1º de 2”).
- **BookPage**: página da prévia com cabeçalho corrido, capitular tawny, selos de origem e lacunas.
- **VoiceTraitCard** (cartão de traço de voz): cartão paper-raised, raio 18, borda 2 px (line; tawny quando aprovado). Nome do traço 15/700 maiúsculas tawny-ink, traço em uma frase (Atkinson 18/26), trecho real em Literata 23/35 entre aspas, SourceSeal tocável. Rodapé com “Isso sou eu” e “Não sou eu” (52 px, lado a lado). Estados: neutro; aprovado (borda tawny, chip “É você” com check, botão preenchido); recusado (conteúdo a 45%, “Este traço não será usado” + link “Desfazer” 48 px). Sem números, gráficos ou porcentagens.
- **VoiceSeal** (reuso do estilo de StatusTag, sem componente novo): “Escrito no seu jeito de contar”, pílula paper-sunk perto do título do Capítulo; leva à tela Seu jeito de contar.
- **TitleEdit**: botão lápis 48 px ao lado do título do livro; folha com campo em Literata e “Salvar nome”.
- **DeleteConfirm**: botão “Excluir este livro” no fim do livro (contorno error); folha com ícone, pergunta, rádio “Excluir só o livro” (padrão, áudios voltam a rascunhos) ou “Excluir o livro e os áudios”, botão error + Cancelar em contorno.
- **SegmentedTabs**: 52 px, Linha do tempo / Capítulos.
- **AudioRow**: rótulo "Áudio N · duração", nome em Literata, StatusTag, seta.
- **TextField**: 56 px, borda 2 px ink-border; variante senha com botão Mostrar/Ocultar.

## Textos fixos
- Vazio: "Conte a primeira história. Pode ser curta."
- Carregando: "Transcrevendo seu áudio", "Lendo como você fala…", "Escrevendo o capítulo no seu celular"
- Poucos dados (voz): "Com um áudio só, ainda é um palpite. Confirme o que for seu."
- Erro: "Sem internet. O áudio ficou na fila e será enviado quando você voltar a ficar online."
- Sempre "ideias", nunca "átomos".
