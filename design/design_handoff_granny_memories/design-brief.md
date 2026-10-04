# Briefing de design: Granny Memories

App Android que transforma os áudios que uma pessoa grava, contando suas histórias, em um livro escrito na voz dela. Ela não escreve nada: o app transcreve, separa as ideias e redige capítulos curtos. Ela decide o que fica.

Este briefing cobre apenas a fatia do desafio: um áudio vira transcrição, ideias e um capítulo curto com a origem de cada trecho.

## Quem usa

- Uma pessoa que **não é técnica** e pode ser idosa. Celular Android Samsung (tela de cerca de 6 polegadas, largura de 360 a 412 px), uso com uma mão.
- Texto grande, contraste alto, poucos botões por tela, nenhum jargão. Português do Brasil.
- Em toda a interface, as unidades de conteúdo se chamam **"ideias"** (nunca "átomos").

## Tom visual

- Caloroso e íntimo, como um **caderno de memórias**. Não deve parecer um "app de IA": nada de brilhos, roxo neon, robôs ou gradientes.
- Papel creme de fundo, tinta escura no texto, um único acento terroso (terracota ou ocre).
- Serifa legível para o texto do livro, sem serifa para a interface. Cantos suaves. Muito espaço em branco.
- Botões com no mínimo 48 px de altura. O botão principal de cada tela é um só e bem evidente.

## Princípios de interface

1. **Mostrar sempre de onde vem cada trecho.** Cada passagem do capítulo tem um selo de origem (por exemplo, "Áudio 2 · 00:20"), e tocar nele abre o trecho original.
2. **A autora decide.** O app propõe; os botões são "Editar" e "Aprovar".
3. **O app pergunta, não inventa.** Quando algo não foi dito nos áudios, o texto marca a lacuna e faz uma pergunta curta.
4. **Privacidade à vista.** Um selo discreto: "Seus textos ficam no seu celular. Só o áudio é enviado para ser transcrito."
5. **Nunca travar a tela.** Tarefas longas mostram progresso e um aviso de que podem continuar com o app fechado.

## Telas (protótipo navegável, nesta ordem)

### 1. Início: meus áudios
- Lista de áudios com nome, duração e estado: Na fila, Transcrevendo, Pronto.
- Botão principal grande: **Gravar uma história**. Botão secundário: **Escolher um áudio**.
- Selo de privacidade no rodapé.
- Estado vazio: ilustração simples e a frase "Conte a primeira história. Pode ser curta."

### 2. Transcrição
- O texto do áudio, com os trechos duvidosos destacados para a autora corrigir (toque para editar).
- Botão principal: **Está certo, continuar**.

### 3. Ideias
- Cartões de ideias: resumo de uma ou duas frases, tipo (história, opinião, fato) e origem ("Áudio 2 · 00:20").
- Tocar em um cartão mostra o trecho original da transcrição.
- Botão principal: **Escrever o capítulo**.

### 4. Capítulo
- Texto do capítulo em serifa, em largura de leitura confortável.
- Selos de origem ao lado de cada passagem.
- Lacunas destacadas em amarelo suave, cada uma com uma pergunta e um campo de resposta.
- Botões: **Editar** e **Aprovar capítulo**.

### 5. Configuração
- Chave da ElevenLabs (campo mascarado, com botão de mostrar).
- Modelo no aparelho: estado (baixado ou não), tamanho, botão de baixar.
- Bloco "O que sai do seu celular": só o áudio, e só durante a transcrição.

### Estados a desenhar
- Carregamento: "Transcrevendo seu áudio", "Escrevendo o capítulo no seu celular" (com progresso).
- Erro de rede na transcrição: "Sem internet. O áudio ficou na fila e será enviado quando você voltar a ficar online."
- Vazio: tela 1 sem áudios.

### Fora do recorte (deixe só espaço)
Um botão de conversa com a ghost writer pode aparecer no canto, sem tela própria.

## Conteúdo de exemplo (fictício: use só isto)

**Áudios**
- Áudio 1 · O bolo de laranja · 0:42 · Pronto
- Áudio 2 · A mudança para a cidade · 0:36 · Transcrevendo
- Áudio 3 · Uma história curta · 0:28 · Na fila

**Transcrição do Áudio 1 (trecho)**
"Toda sexta-feira a casa cheirava a laranja. Era dia de bolo. Eu ficava na porta da cozinha esperando a minha avó tirar a forma do forno, e ela sempre dizia que ainda não estava no ponto. [?] cortava o primeiro pedaço para mim."

(O trecho "[?]" é a palavra duvidosa que a autora corrige.)

**Ideias extraídas**
- História · "Toda sexta, a casa cheirava a bolo de laranja." · Áudio 1 · 00:03
- Fato · "A avó dizia que o bolo ainda não estava no ponto." · Áudio 1 · 00:14
- Opinião · "Aprendi mais cozinhando junto do que em qualquer livro." · Áudio 3 · 00:09

**Capítulo (trecho)**
"Toda sexta-feira a casa cheirava a laranja. Era dia de bolo." [Áudio 1 · 00:03]

"Eu ficava na porta da cozinha esperando minha avó tirar a forma do forno. Ela sempre dizia que ainda não estava no ponto." [Áudio 1 · 00:14]

Lacuna: "Quem cortava o primeiro pedaço? No áudio, essa palavra não ficou clara."

## Entrega esperada
- Protótipo navegável das 5 telas e dos estados acima, em uma versão clara.
- Ao final, a lista de **tokens** (cores, tipografia, espaçamento) e de **componentes reutilizáveis** (botão principal, cartão de ideia, selo de origem, destaque de lacuna, selo de privacidade), para repassar ao Claude Code.
- Implementável em React Native: nada que dependa de efeitos que o celular não renderiza bem.
