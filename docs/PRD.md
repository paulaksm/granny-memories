# PRD — App Ghost Writer

Oct 4, 2026 · @P

## Visão e problema

O app transforma os áudios que a autora grava no dia a dia em um livro coeso, escrito na voz dela, sem que ela precise escrever.

Hoje essas histórias ficam espalhadas em áudios de WhatsApp. Organizá-las em livro exige reescrever tudo, e a voz de quem conta se perde no caminho. O app guarda todos os áudios e transcrições, extrai as ideias, propõe uma estrutura e redige capítulo a capítulo. A autora decide o que entra, o que sai e como o texto soa. Uma ghost writer conversa com ela em todas as etapas.

## Contexto: Hacktoberfest e repositório aberto

Este é um projeto para o desafio de fim de semana da Hacktoberfest 2026, e o código fica em um repositório público no GitHub: [paulaksm/granny-memories](https://github.com/paulaksm/granny-memories).

O desafio é o [Hacktoberfest Weekend Challenge: Build for a Friend](https://dev.to/challenges/hacktoberfest-weekend-2026-10-01), da DEV. A tarefa é construir, com IA de código aberto no centro, algo que resolva um problema real de uma pessoa próxima. O prazo de envio é 5 de outubro de 2026, às 6h59 UTC (3h59 da segunda-feira em Brasília).

O envio é um post na DEV com a descrição do que foi feito e para quem, uma demonstração (vídeo ou link), o link do código, como foi construído e por que a inovação aberta importa para o projeto. A qualidade do texto tem o maior peso na avaliação, seguida de relevância para o tema, criatividade e execução técnica.

O app tem duas categorias de parceiros em vista: Melhor Uso do Gemma, se o modelo local escolhido for da família Gemma, e Melhor Uso da ElevenLabs, pela transcrição com o Scribe v2. A ElevenLabs também distribui créditos aos participantes em hacktoberfest.com/my.

**Regras do repositório público (valem desde o primeiro commit)**

1. Nenhuma senha, chave ou token. A chave da ElevenLabs é digitada no app e guardada no aparelho. O repositório só tem um `.env.example` com os nomes das variáveis, sem valores.
2. Nenhum arquivo pessoal. Áudios, transcrições, átomos, capítulos, guia de voz, decisões, bio e backups ficam só no aparelho e são bloqueados pelo `.gitignore`.
3. Exemplos e testes usam dados sintéticos. Os áudios reais de teste não entram no repositório.
4. Modelos (arquivos GGUF) e outros arquivos grandes não entram. O app os baixa no aparelho.
5. Uma varredura de segredos roda antes de cada commit. O histórico do Git também conta: uma chave que já subiu precisa ser revogada, e apagá-la depois não basta.
6. O repositório tem uma licença de código aberto, e as licenças dos modelos e das dependências são conferidas.

**Recorte para o prazo (proposta).** O plano de seis marcos não cabe até o prazo. Proponho uma única fatia vertical: um áudio vira transcrição (Scribe v2), átomos e um capítulo curto com rastreio, com a limpeza, a extração e a redação rodando no aparelho em um modelo open-weight (RF1, RF2, RF4, RF5 e RF8, em versão mínima), mais a documentação e o post. O resto do PRD continua sendo o plano do produto.

## Usuários e contexto de uso

O app atende três pessoas de confiança, em celulares Android Samsung (S24 e S25). Não há distribuição pública nem login.

- Cada pessoa escreve um livro próprio a partir de áudios que grava no celular, ao longo de semanas ou meses.
- O uso é intermitente: ela grava quando surge uma história e abre o app para revisar quando tem tempo.
- O piso de projeto é um aparelho de 8 GB de RAM; o S25 pode usar modelos maiores.
- O terceiro aparelho ainda não foi informado.

## Princípios e restrições

Sete regras valem para todo o produto e prevalecem sobre qualquer decisão de implementação.

1. **Dados no aparelho.** Texto, capítulos, conversas, guia de voz e decisões nunca saem do celular. A única exceção é o áudio enviado à ElevenLabs para transcrição.
2. **Áudios e transcrições são preservados e imutáveis.** Os originais ficam guardados, e qualquer etapa pode ser refeita depois com agentes melhores.
3. **Voz da autora acima de estilo de livro.** O app não inventa fatos, nomes, falas, cenas nem conclusões que ela não deu.
4. **Neutralidade editorial.** O app nunca pondera se uma história vale ser contada por motivos religiosos, culturais ou sociais. Cortes e reordenações têm razão estrutural, e a decisão é sempre da autora.
5. **A autora aprova toda mudança** no livro e no guia de voz. Os agentes só propõem.
6. **Tudo é rastreável.** Cada afirmação factual do livro aponta para o átomo e o áudio de origem.
7. **Funciona offline**, exceto a transcrição.

## Escopo

O MVP cobre o caminho completo do áudio ao livro exportado, em Android, para três pessoas.

**Dentro do MVP**

- Gravar ou importar áudios, transcrever e revisar a transcrição.
- Limpeza, extração de ideias (átomos), mapa de temas e guia de voz com aprovação da autora.
- Proposta de estrutura, redação e revisão por capítulo, com perguntas e edição pela autora.
- Maestro: chat da ghost writer em todas as telas.
- Fechamento: revisão do conjunto, itens editoriais (título, contracapa, orelha, sumário, dedicatória) e exportação.
- Backup exportável do projeto inteiro.

**Fora do MVP**

- iOS, loja de aplicativos, login e sincronização entre aparelhos.
- Mais de um livro por autora.
- Capa, diagramação avançada e leitura do livro em voz alta.
- Edição colaborativa.

## Jornada da autora e telas

A jornada tem três fases, e o maestro acompanha todas.

**Início (uma vez por autora)**

1. Boas-vindas: mini bio, público, tom e o que evitar.
2. Áudios de amostra: de 5 a 10, com sugestões de tema, status por áudio e aviso de qualidade baixa.
3. Revisão da transcrição: a autora corrige os trechos marcados com \[?\].
4. Revisão do perfil de voz: ela aprova ou corrige cada traço ("isso sou eu" / "isso não sou eu").
5. Importar todos os áudios: transcrição e extração das ideias.
6. Escolher a estrutura entre duas ou três propostas.

**Ciclo por capítulo (repete até o fim do livro)**

7. Capítulo entregue, com marcações de lacuna e reorganização, notas do agente e perguntas.
8. A autora edita e aprova. Cada correção vira sinal para o guia.
9. Guia de voz atualizado, só com aprovação dela. Volta ao passo 7 para o próximo capítulo.

**Fechamento (uma vez)**

10. Revisão do conjunto, com relatório de achados.
11. Itens editoriais: título, contracapa, orelha, introdução, sumário, dedicatória e agradecimentos.
12. Exportar o livro.

**Maestro (transversal).** Um chat em toda tela. Explica o que foi feito, recebe pedidos em linguagem natural, delega aos agentes e registra decisões antes de seguir. Nunca altera livro ou guia sozinho.

As telas formais servem às decisões (aprovar, escolher, confirmar), e o chat serve ao que acontece entre elas. A tela de revisão da transcrição (passo 3) foi acrescentada depois do primeiro desenho da jornada.

## Requisitos funcionais

Cada requisito tem um critério de aceite verificável, em boa parte por scripts.

| ID | Requisito | Critério de aceite |
| --- | --- | --- |
| RF1 | Gravar ou importar áudio | O áudio é salvo íntegro e imutável e aparece na lista com a duração. |
| RF2 | Transcrever com o Scribe v2, idioma automático e termos-chave | A transcrição vem com marcas de tempo por parágrafo. Sem rede, o áudio fica na fila e é reenviado depois. |
| RF3 | Revisar a transcrição | Os trechos \[?\] são listados e editáveis, e a transcrição original continua guardada. |
| RF4 | Limpar a transcrição preservando a voz | Há um arquivo limpo por áudio, sem reescrita, resumo ou troca de palavras. |
| RF5 | Extrair átomos | O script de validação passa, e todo trecho literal existe na transcrição limpa. |
| RF6 | Gerar o guia de voz | O rascunho traz exemplos reais com fonte, e a autora aprova ou corrige cada traço. |
| RF7 | Propor estruturas | Nenhum átomo some: cada um fica alocado ou aparece na lista de não alocados. |
| RF8 | Redigir capítulo | Toda passagem factual cita um átomo existente, e as lacunas viram perguntas. |
| RF9 | Revisar capítulo | O relatório traz achados com severidade, e qualquer crítico devolve ao redator. |
| RF10 | Editar e aprovar capítulo | Só mudanças de estilo geram proposta ao guia. Aprovar exige perguntas resolvidas ou adiadas. |
| RF11 | Maestro por chat | Responde sobre o processo, delega e grava cada decisão em decisoes.md antes de seguir. |
| RF12 | Revisão do conjunto | Seis lentes rodam em contexto limpo, e achados críticos reabrem o capítulo. |
| RF13 | Itens editoriais | Cada item traz três variações e o hash do manuscrito usado. Se o manuscrito muda, o item fica desatualizado. |
| RF14 | Gate de fechamento e exportação | O gate libera só com tudo aprovado e atualizado, e o livro sai em Markdown e em um formato de leitura. |
| RF15 | Backup do projeto | A autora gera um arquivo com áudios, transcrições e arquivos de trabalho e o restaura em outro aparelho. |

## Arquitetura

Tudo roda no celular, em TypeScript, com uma única exceção: a transcrição de áudio na ElevenLabs.

| Componente | Escolha | Observação |
| --- | --- | --- |
| Aplicativo | Expo (React Native), development build, APK por EAS Build | As bibliotecas de IA têm código nativo e não rodam no Expo Go. |
| Transcrição | ElevenLabs Scribe v2 (API em lote) | Aceita vários idiomas no mesmo áudio e termos-chave. A cobrança da API é de US$ 0,22 por hora, mais 20% com termos-chave. |
| Chave da ElevenLabs | Armazenamento seguro de cada aparelho | Digitada uma vez na configuração e nunca embutida no APK. |
| Modelo local | llama.rn com modelos GGUF | Um modelo residente por vez, usado por todos os agentes. Piso de 8 GB de RAM. |
| Interface de modelo | ModeloLocal, com cada agente apontando para local ou API em um arquivo de configuração | O motor é trocável (LiteRT-LM é o plano B) e permite mover agentes para API sem refazer o app. |
| Armazenamento | Arquivos em disco, na estrutura do harness | SQLite opcional para fila e índices. |
| Harness | Orquestração e scripts em TypeScript | Portado de harness.py, com os 26 testes como especificação. |
| Execução | Tarefas longas em segundo plano, um agente por vez | Pausa por bateria baixa ou aquecimento (proposta, a validar no teste técnico). |

## Harness: agentes, arquivos e verificações

O harness é o que roda por trás de cada tela: 13 agentes com prompts próprios, um sistema de arquivos como memória e scripts que verificam o que não depende de julgamento. Os prompts estão em prompts-agentes-ghostwriter.md e os scripts em harness.py, com testes.

| Fase | Agentes |
| --- | --- |
| Antes do livro | Limpeza de transcrição, extrator de átomos, mapeador de temas, analista de voz, arquiteto de estrutura, sugestor de temas para áudios |
| Ciclo por capítulo | Redator de capítulos, revisor de capítulo, atualizador do guia de voz |
| Fechamento | Revisor de conjunto (uma instância por lente), redator editorial, entrevistador de itens pessoais |
| Transversal | Maestro, a única voz que a autora ouve |

Todos aplicam a mesma regra de neutralidade editorial e as mesmas regras de fidelidade: nada de fatos inventados, lacunas viram perguntas, contradições são devolvidas à autora.

**Scripts de verificação (sem modelo de linguagem)**

- `atomos`: valida campos e confere que cada trecho literal existe na transcrição.
- `rastreio`: confere que todo ID de átomo citado existe e aponta parágrafos sem origem.
- `montar`: junta os capítulos aprovados, gera o hash do manuscrito, o mapa de átomos e o sumário.
- `gate`: bloqueia o fechamento enquanto houver capítulo não aprovado, item desatualizado, achado crítico ou pergunta em aberto.

**Estrutura de arquivos do projeto**

```
transcricoes/raw/ e clean/      átomos em notas/atoms/
notas/temas.md
livro/outline.md, capitulos/, manuscrito.md
voz/guia-de-voz.md, exemplos/
controle/decisoes.md, perguntas.md, config.json
fechamento/relatorio.md, itens/, status.json
```

## Dados e privacidade

Só o áudio sai do aparelho, e só para ser transcrito. Todo o resto fica no celular.

| Dado | Onde fica | Sai do aparelho? |
| --- | --- | --- |
| Áudios originais | Aparelho | Sim, para a ElevenLabs, no momento da transcrição |
| Transcrições, átomos, capítulos, guia de voz, decisões | Aparelho | Não |
| Conversas com o maestro | Aparelho | Não |
| Chave da ElevenLabs | Armazenamento seguro do aparelho | Não |

- O modo de retenção zero da ElevenLabs existe só para clientes Enterprise. Antes do uso real, conferir nas configurações da conta o que vale para o uso de áudio no treinamento.
- As três autoras são informadas de que o áudio vai para um serviço externo.
- Não há telemetria, análise de uso nem login.
- Não há nuvem própria: a proteção contra perda do aparelho é o backup exportável (RF15), feito pela autora.

## Requisitos não funcionais

As metas de tempo e calor só podem ser fixadas depois do teste técnico nos aparelhos reais.

| Requisito | Meta | Como verificar |
| --- | --- | --- |
| Plataforma | Android nos Samsung S24 e S25 | Teste nos aparelhos |
| Memória | Um modelo residente por vez, com margem para o app dentro de 8 GB | Medição no teste técnico |
| Tempo de redação de um capítulo | A definir; roda em segundo plano, sem travar a tela | Medição no teste técnico |
| Bateria e calor | Tarefas longas pausam com bateria baixa ou aquecimento (proposta) | Medição no teste técnico |
| Offline | Tudo funciona sem internet, menos a transcrição | Teste com o aparelho em modo avião |
| Falha de rede na transcrição | O áudio fica na fila e é reenviado, sem perda | Teste com a rede interrompida |
| Integridade dos dados | Áudios e transcrições originais nunca são alterados | Verificação por hash nos testes |

## Riscos e mitigações

O maior risco é a qualidade da prosa gerada por um modelo local pequeno, e ele é mitigável porque tudo é guardado e reprocessável.

| Risco | Impacto | Mitigação |
| --- | --- | --- |
| Prosa fraca do modelo local no redator e no revisor | Alto | Teste de escrita antes das telas, interface de modelo trocável, e áudios e transcrições guardados para regenerar com modelos melhores |
| Agentes pequenos erram os formatos exatos | Médio | Saída estruturada, validação por script e nova tentativa automática |
| Memória e calor nos celulares | Alto | Um modelo residente, tarefas em sequência, pausa por bateria ou temperatura, medição nos dois aparelhos |
| Transcrição fraca com mistura de idiomas ou ruído | Médio | Scribe v2 com detecção automática e termos-chave, tela de revisão da transcrição e orientação de gravação |
| Áudios em forma de conversa, sem contexto, em vez de monólogo | Médio | Orientação na tela de gravação e sugestões de tema |
| Áudio processado fora do aparelho | Médio | Informar as autoras, conferir as configurações da conta e enviar apenas o áudio |
| Perda do aparelho | Alto | Backup exportável feito pela autora |
| Assinatura de três meses acabar | Médio | O custo da API é baixo (US$ 0,22 por hora de áudio); migrar para a API paga |

## Qualidade e métricas

Quatro testes decidem se o produto serve, e os critérios abaixo são propostas a ajustar com os primeiros resultados.

| Teste | Entrada | Critério (proposta) |
| --- | --- | --- |
| Transcrição | Os três áudios de teste já enviados, comparados com o resultado do Whisper small, que errou termos em inglês | Termos em inglês e nomes próprios saem corretos, e a autora corrige poucos trechos |
| Escrita | Três capítulos curtos gerados pelo modelo local a partir de transcrições boas | Zero afirmações sem átomo, medido por script, e a autora aprova sem reescrever a maior parte do texto |
| Desempenho | Uma tarefa de cada agente em cada aparelho | Tempo, memória e temperatura registrados nos S24 e S25 |
| Uso real | Uma autora levando um capítulo do áudio à aprovação | Concluir o capítulo, com menos correções por capítulo ao longo do livro, sinal de que o guia está aprendendo |

## Plano e marcos

O plano tem seis marcos em sequência, cada um com uma condição de saída. Não há datas, porque elas dependem do resultado do teste técnico.

1. **Teste técnico.** App mínimo com Scribe e llama.rn nos S24 e S25. Saída: tempos, memória e qualidade de escrita medidos, e definição do modelo local e de quais agentes ficam locais.
2. **Esqueleto do app.** Projeto Expo, armazenamento em arquivos, interface ModeloLocal, cliente do Scribe e tela de revisão da transcrição. Saída: áudio gravado, transcrito e corrigido dentro do app.
3. **Harness em TypeScript.** Portar os scripts de verificação e os agentes de pré-livro. Saída: os 26 testes passando e átomos extraídos de áudios reais.
4. **Telas e ciclo por capítulo.** Telas no Claude Design, redação, revisão, perguntas, edição e maestro. Saída: um capítulo completo, do áudio à aprovação.
5. **Fechamento e exportação.** Revisão do conjunto, itens editoriais, gate e exportação. Saída: um livro exportado.
6. **APK de teste.** Build por EAS para as três autoras e uso real.

## Decisões tomadas e questões em aberto

Oito decisões estão fechadas, e doze questões dependem de informação ou de teste.

**Decididas**

- App em Expo (React Native), em TypeScript, com APK por EAS Build, para três usuárias Android.
- Transcrição com o ElevenLabs Scribe v2, único serviço externo.
- Todo o resto roda no aparelho, e cada agente pode apontar para local ou API por configuração.
- Áudios e transcrições são guardados e imutáveis, para permitir refazer etapas com agentes melhores.
- O maestro é uma camada transversal, uma única voz com a autora.
- Neutralidade editorial é regra de todos os agentes.
- A chave da ElevenLabs fica no armazenamento seguro de cada aparelho.
- O código é aberto, em repositório público no GitHub, e nenhuma senha nem arquivo pessoal pode subir.

**Em aberto**

- [ ] Qual é o terceiro aparelho (modelo e RAM)?
- [ ] O recorte proposto para o prazo está bom?
- [ ] Quem é a pessoa para quem o app é feito, e dá para mostrar o resultado a ela antes do post?
- [ ] As horas da assinatura Creative valem para a API do Scribe, ou usamos os créditos de hacktoberfest.com/my?
- [ ] O que as configurações da conta ElevenLabs dizem sobre o uso do áudio no treinamento?
- [ ] Aceitar o whisper.rn como transcrição alternativa, para quem clonar o repositório rodar sem conta paga (depois do prazo)?
- [ ] Qual modelo local usar (família Gemma 4 ou Qwen3), definido após o teste técnico?
- [ ] O llama.rn oferece saída estruturada (JSON imposto) com o modelo escolhido?
- [ ] Qual formato de leitura na exportação: PDF, ePub ou Word?
- [ ] O livro terá só português ou aceita trechos em outros idiomas?
- [ ] O nome do app é Granny Memories, igual ao do repositório?
- [ ] Os agentes de escrita (redator e revisor) ficam locais ou vão para a API após o teste de escrita?

