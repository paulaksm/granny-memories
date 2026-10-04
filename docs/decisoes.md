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
