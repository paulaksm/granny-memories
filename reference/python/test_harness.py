#!/usr/bin/env python3
"""Testes do harness com um projeto sintético (não precisa de áudios reais).

  python test_harness.py            roda os testes
  python test_harness.py --demo DIR cria um projeto de exemplo em DIR para você experimentar
                                    (use --incompleto para gerar um projeto ainda em andamento)
"""
import re
import sys
import tempfile
import unittest
from pathlib import Path

import harness as h

LENTES = ["repetição", "contradição factual", "deriva de voz",
          "ordem e buracos", "abertura e final", "rastreabilidade"]


def escrever(caminho: Path, texto: str) -> None:
    caminho.parent.mkdir(parents=True, exist_ok=True)
    caminho.write_text(texto, encoding="utf-8")


def atomo(raiz, n, fonte, tipo, resumo, literal, relacionado="", conf="alta"):
    aid = f"A-{n:03d}"
    escrever(raiz / "notas" / "atoms" / f"{aid}.md",
             f"---\nid: {aid}\nfonte: {fonte}\ntipo: {tipo}\nresumo: {resumo}\n"
             f"trecho_literal: {literal}\nconfianca_transcricao: {conf}\n"
             f"relacionado: {relacionado}\n---\n")


def criar_projeto_exemplo(raiz: Path, completo: bool = True) -> Path:
    raiz = Path(raiz)
    escrever(raiz / "transcricoes/clean/audio-01.md",
             "---\narquivo: audio-01.m4a\nqualidade: boa\n---\n"
             "[00:00] Eu achava que era só mais uma reunião. Não era.\n\n"
             "[00:20] A conversa com o diretor durou vinte minutos e mudou o rumo dos três anos seguintes.\n\n"
             "[02:15] Na semana seguinte fui falar com a equipe nova e percebi que ninguém ali me conhecia.\n")
    escrever(raiz / "transcricoes/clean/audio-02.md",
             "---\narquivo: audio-02.m4a\nqualidade: boa\n---\n"
             "[00:10] Aprendi mais com um erro de planilha do que com qualquer curso.\n\n"
             "[01:30] Eu sempre cheguei cedo, nem que fosse para tomar café sozinho.\n")
    atomo(raiz, 1, "audio-01 [00:00-00:40]", "história", "A reunião que mudou os três anos seguintes",
          "Eu achava que era só mais uma reunião. Não era. A conversa com o diretor durou vinte minutos "
          "e mudou o rumo dos três anos seguintes.")
    atomo(raiz, 2, "audio-01 [02:15-02:40]", "fato", "Ninguém conhecia a autora na equipe nova",
          "Na semana seguinte fui falar com a equipe nova e percebi que ninguém ali me conhecia.",
          relacionado="A-001 (complementa)")
    atomo(raiz, 3, "audio-02 [00:10-00:50]", "opinião", "Aprendeu mais com um erro do que com cursos",
          "Aprendi mais com um erro de planilha do que com qualquer curso.")
    atomo(raiz, 4, "audio-02 [01:30-01:50]", "fato", "Sempre chegava cedo",
          "Eu sempre cheguei cedo, nem que fosse para tomar café sozinho.",
          relacionado="A-003 (complementa)")
    escrever(raiz / "livro/outline.md",
             "# Estrutura\n\n## C-01 A reunião que mudou tudo\n\n## C-02 O que aprendi errando\n")
    escrever(raiz / "livro/capitulos/C-01.md",
             "---\ntitulo: A reunião que mudou tudo\nstatus: aprovado\n---\n"
             "Eu achava que era só mais uma reunião. Não era. <!-- A-001 -->\n\n"
             "A conversa com o diretor durou vinte minutos e mudou o rumo dos três anos seguintes.\n"
             "<!-- A-001 -->\n\n"
             "Na semana seguinte, fui falar com a equipe nova e percebi que ninguém ali me conhecia. <!-- A-002 -->\n")
    escrever(raiz / "livro/capitulos/C-02.md",
             f"---\ntitulo: O que aprendi errando\nstatus: {'aprovado' if completo else 'rascunho'}\n---\n"
             "Aprendi mais com um erro de planilha do que com qualquer curso. <!-- A-003 -->\n\n"
             "Eu sempre cheguei cedo, nem que fosse para tomar café sozinho. <!-- A-004 -->\n")
    if not completo:
        return raiz
    escrever(raiz / "controle/perguntas.md",
             "- [x] pergunta: Quem era a equipe nova? | origem: A-002 | tipo: lacuna\n"
             "- [~] pergunta: Qual o nome do diretor? | origem: A-001 | tipo: confirmação\n")
    relatorio = "# Relatório de fechamento\n\n"
    for lente in LENTES:
        relatorio += f"## {lente}\n\n"
    relatorio += ("- [x] [crítico] C-02: afirmação sem átomo no segundo parágrafo\n"
                  "- [ ] [sugestão] C-01: abertura poderia ser mais curta\n")
    escrever(raiz / "fechamento/relatorio.md", relatorio)
    proj = h.Projeto(raiz)
    h.montar(proj)
    hash_atual = proj.status()["manuscrito_hash"]
    for nome in ("titulo", "contracapa"):
        escrever(raiz / f"fechamento/itens/{nome}.md",
                 f"---\nitem: {nome}\nstatus: aprovado\nbaseado_em_hash: {hash_atual}\n---\nTexto aprovado.\n")
    escrever(raiz / "fechamento/itens/dedicatoria.md",
             "---\nitem: dedicatoria\nstatus: aprovado\n---\nPara quem esperou.\n")
    return raiz


class Base(unittest.TestCase):
    def setUp(self):
        self._tmp = tempfile.TemporaryDirectory()
        self.raiz = Path(self._tmp.name)
        criar_projeto_exemplo(self.raiz, completo=True)
        self.proj = h.Projeto(self.raiz)

    def tearDown(self):
        self._tmp.cleanup()

    def msgs(self, rel):
        return " | ".join(f"{a}: {b}" for a, b in rel.erros)


class TestAtomos(Base):
    def test_projeto_valido(self):
        self.assertEqual(h.validar_atomos(self.proj).erros, [])

    def test_trecho_que_nao_existe_na_transcricao(self):
        arq = self.raiz / "notas/atoms/A-003.md"
        arq.write_text(arq.read_text(encoding="utf-8").replace("erro de planilha", "erro de cálculo"), encoding="utf-8")
        self.assertIn("trecho_literal não encontrado", self.msgs(h.validar_atomos(self.proj)))

    def test_relacionado_para_atomo_inexistente(self):
        arq = self.raiz / "notas/atoms/A-004.md"
        arq.write_text(arq.read_text(encoding="utf-8").replace("A-003 (complementa)", "A-099 (repete)"), encoding="utf-8")
        self.assertIn("átomo inexistente", self.msgs(h.validar_atomos(self.proj)))

    def test_relacao_invalida(self):
        arq = self.raiz / "notas/atoms/A-004.md"
        arq.write_text(arq.read_text(encoding="utf-8").replace("(complementa)", "(parecido)"), encoding="utf-8")
        self.assertIn("inválida", self.msgs(h.validar_atomos(self.proj)))

    def test_campo_obrigatorio_ausente(self):
        arq = self.raiz / "notas/atoms/A-001.md"
        arq.write_text(re.sub(r"resumo: .*\n", "", arq.read_text(encoding="utf-8")), encoding="utf-8")
        self.assertIn("resumo", self.msgs(h.validar_atomos(self.proj)))


class TestRastreio(Base):
    def test_projeto_valido(self):
        self.assertEqual(h.validar_rastreio(self.proj).erros, [])

    def test_id_inexistente(self):
        arq = self.raiz / "livro/capitulos/C-02.md"
        arq.write_text(arq.read_text(encoding="utf-8") + "\nUm fato novo. <!-- A-099 -->\n", encoding="utf-8")
        self.assertIn("A-099 citado mas não existe", self.msgs(h.validar_rastreio(self.proj)))

    def test_id_malformado(self):
        arq = self.raiz / "livro/capitulos/C-02.md"
        arq.write_text(arq.read_text(encoding="utf-8") + "\nOutro fato. <!-- A-4 -->\n", encoding="utf-8")
        self.assertIn("malformado", self.msgs(h.validar_rastreio(self.proj)))

    def test_paragrafo_sem_atomo_e_aviso_ou_erro_no_modo_estrito(self):
        arq = self.raiz / "livro/capitulos/C-02.md"
        arq.write_text(arq.read_text(encoding="utf-8") + "\nUma frase sem origem.\n", encoding="utf-8")
        normal = h.validar_rastreio(self.proj)
        self.assertEqual(normal.erros, [])
        self.assertTrue(any("sem átomo" in m for _, m in normal.avisos))
        self.assertIn("sem átomo", self.msgs(h.validar_rastreio(self.proj, estrito=True)))

    def test_atomo_nao_usado_vira_aviso(self):
        arq = self.raiz / "livro/capitulos/C-02.md"
        arq.write_text(arq.read_text(encoding="utf-8").replace(" <!-- A-004 -->", ""), encoding="utf-8")
        self.assertTrue(any("A-004" in m for _, m in h.validar_rastreio(self.proj).avisos))


class TestMontador(Base):
    def test_manuscrito_sem_comentarios_e_rastreavel_com_comentarios(self):
        limpo = (self.raiz / "livro/manuscrito.md").read_text(encoding="utf-8")
        rastreavel = (self.raiz / "livro/manuscrito-rastreavel.md").read_text(encoding="utf-8")
        self.assertNotIn("<!--", limpo)
        self.assertIn("<!-- A-001 -->", rastreavel)
        self.assertIn("## A reunião que mudou tudo", limpo)

    def test_mapa_e_sumario(self):
        import json
        mapa = json.loads((self.raiz / "fechamento/mapa-atomos.json").read_text(encoding="utf-8"))
        self.assertEqual(mapa["capitulos"]["C-01"], ["A-001", "A-002"])
        self.assertEqual(mapa["nao_usados"], [])
        sumario = (self.raiz / "fechamento/itens/sumario.md").read_text(encoding="utf-8")
        self.assertIn("1. A reunião que mudou tudo", sumario)
        self.assertIn(self.proj.status()["manuscrito_hash"], sumario)

    def test_hash_estavel_e_muda_com_o_texto(self):
        h1 = self.proj.status()["manuscrito_hash"]
        h.montar(self.proj)
        self.assertEqual(h1, self.proj.status()["manuscrito_hash"])
        arq = self.raiz / "livro/capitulos/C-02.md"
        arq.write_text(arq.read_text(encoding="utf-8").replace("sempre cheguei", "quase sempre cheguei"), encoding="utf-8")
        h.montar(self.proj)
        self.assertNotEqual(h1, self.proj.status()["manuscrito_hash"])

    def test_mudar_so_o_comentario_de_atomo_nao_muda_o_hash(self):
        h1 = self.proj.status()["manuscrito_hash"]
        arq = self.raiz / "livro/capitulos/C-02.md"
        arq.write_text(arq.read_text(encoding="utf-8").replace("<!-- A-004 -->", "<!-- A-003 -->"), encoding="utf-8")
        h.montar(self.proj)
        self.assertEqual(h1, self.proj.status()["manuscrito_hash"])

    def test_capitulo_nao_aprovado_fica_fora(self):
        arq = self.raiz / "livro/capitulos/C-02.md"
        arq.write_text(arq.read_text(encoding="utf-8").replace("status: aprovado", "status: revisado"), encoding="utf-8")
        h.montar(self.proj)
        self.assertNotIn("O que aprendi errando", (self.raiz / "livro/manuscrito.md").read_text(encoding="utf-8"))

    def test_dry_run_nao_grava(self):
        antes = (self.raiz / "livro/manuscrito.md").read_text(encoding="utf-8")
        arq = self.raiz / "livro/capitulos/C-02.md"
        arq.write_text(arq.read_text(encoding="utf-8").replace("sempre cheguei", "nunca cheguei"), encoding="utf-8")
        h.montar(self.proj, dry_run=True)
        self.assertEqual(antes, (self.raiz / "livro/manuscrito.md").read_text(encoding="utf-8"))


class TestGate(Base):
    def test_projeto_completo_e_liberado(self):
        rel = h.gate_fechamento(self.proj)
        self.assertEqual(rel.erros, [], self.msgs(rel))

    def test_item_desatualizado_depois_de_mudar_capitulo(self):
        arq = self.raiz / "livro/capitulos/C-01.md"
        arq.write_text(arq.read_text(encoding="utf-8").replace("vinte minutos", "meia hora"), encoding="utf-8")
        montagem, res = h.montar(self.proj)
        self.assertIn("contracapa", res["desatualizados"])
        self.assertIn("desatualizado", self.msgs(h.gate_fechamento(self.proj)))

    def test_manuscrito_nao_remontado_bloqueia(self):
        arq = self.raiz / "livro/capitulos/C-01.md"
        arq.write_text(arq.read_text(encoding="utf-8").replace("vinte minutos", "meia hora"), encoding="utf-8")
        self.assertIn("rode 'montar'", self.msgs(h.gate_fechamento(self.proj)))

    def test_achado_critico_aberto_bloqueia(self):
        rp = self.raiz / "fechamento/relatorio.md"
        rp.write_text(rp.read_text(encoding="utf-8").replace("- [x] [crítico]", "- [ ] [crítico]"), encoding="utf-8")
        self.assertIn("achado crítico aberto", self.msgs(h.gate_fechamento(self.proj)))

    def test_pergunta_em_aberto_bloqueia_mas_adiada_nao(self):
        pq = self.raiz / "controle/perguntas.md"
        pq.write_text(pq.read_text(encoding="utf-8") + "- [ ] pergunta: Qual a data? | origem: A-001 | tipo: lacuna\n", encoding="utf-8")
        self.assertIn("pergunta em aberto", self.msgs(h.gate_fechamento(self.proj)))

    def test_item_obrigatorio_ausente_e_lente_sem_secao(self):
        (self.raiz / "fechamento/itens/contracapa.md").unlink()
        rp = self.raiz / "fechamento/relatorio.md"
        rp.write_text(rp.read_text(encoding="utf-8").replace("## deriva de voz", "## outra coisa"), encoding="utf-8")
        msg = self.msgs(h.gate_fechamento(self.proj))
        self.assertIn("item obrigatório ausente", msg)
        self.assertIn("lente 'deriva de voz' sem seção", msg)

    def test_capitulo_do_outline_sem_arquivo(self):
        (self.raiz / "livro/outline.md").write_text("# Estrutura\n\n## C-01 A\n## C-02 B\n## C-03 C\n", encoding="utf-8")
        self.assertIn("C-03 previsto no outline", self.msgs(h.gate_fechamento(self.proj)))

    def test_obrigatorio_nao_pode_ser_dispensado(self):
        arq = self.raiz / "fechamento/itens/titulo.md"
        arq.write_text(arq.read_text(encoding="utf-8").replace("status: aprovado", "status: dispensado"), encoding="utf-8")
        self.assertIn("não pode ser dispensado", self.msgs(h.gate_fechamento(self.proj)))

    def test_projeto_incompleto_e_bloqueado(self):
        with tempfile.TemporaryDirectory() as tmp:
            criar_projeto_exemplo(Path(tmp), completo=False)
            self.assertTrue(h.gate_fechamento(h.Projeto(tmp)).erros)


class TestCLI(Base):
    def test_codigos_de_saida(self):
        self.assertEqual(h.main(["gate", "--raiz", str(self.raiz)]), 0)
        (self.raiz / "controle/perguntas.md").write_text("- [ ] pergunta: aberta | origem: A-001 | tipo: lacuna\n", encoding="utf-8")
        self.assertEqual(h.main(["gate", "--raiz", str(self.raiz)]), 1)


if __name__ == "__main__":
    if "--demo" in sys.argv:
        destino = Path(sys.argv[sys.argv.index("--demo") + 1])
        criar_projeto_exemplo(destino, completo="--incompleto" not in sys.argv)
        print(f"Projeto de exemplo criado em {destino}")
        print(f"Experimente: python harness.py tudo --raiz {destino}")
    else:
        unittest.main(verbosity=1)
