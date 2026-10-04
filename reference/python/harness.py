#!/usr/bin/env python3
"""Scripts de verificação do harness da ghost writer (sem LLM, só biblioteca padrão).

Uso:
  python harness.py atomos   --raiz PASTA   valida átomos contra as transcrições limpas
  python harness.py rastreio --raiz PASTA   confere os IDs de átomos citados nos capítulos
  python harness.py montar   --raiz PASTA   monta manuscrito, mapa de átomos, hash e sumário
  python harness.py gate     --raiz PASTA   gate de fechamento (saída 1 = bloqueado)
  python harness.py tudo     --raiz PASTA   montar + gate

Opções: --estrito (parágrafo sem átomo vira erro), --dry-run (montar sem gravar), --json
Saída: 0 = ok, 1 = há erros.

Estrutura esperada dentro de --raiz:
  transcricoes/clean/audio-NN.md      notas/atoms/A-NNN.md
  livro/capitulos/C-NN.md             livro/outline.md (opcional)
  controle/perguntas.md               controle/config.json (opcional)
  fechamento/relatorio.md             fechamento/itens/<item>.md
Gerados pelo montador: livro/manuscrito.md, livro/manuscrito-rastreavel.md,
  fechamento/mapa-atomos.json, fechamento/itens/sumario.md, fechamento/status.json
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
import unicodedata
from datetime import datetime, timezone
from pathlib import Path

ID_ATOMO = re.compile(r"\bA-\d{3,}\b")
ID_ATOMO_CURTO = re.compile(r"\bA-\d{1,2}\b")
ID_CAPITULO = re.compile(r"\bC-(\d{2,})\b")
TIMESTAMP = re.compile(r"\[\d{1,2}:\d{2}(?::\d{2})?\]")
COMENTARIO = re.compile(r"<!--(.*?)-->", re.S)
FONTE = re.compile(
    r"^(audio-\d{2,})\s*\[(\d{1,2}:\d{2}(?::\d{2})?)\s*-\s*(\d{1,2}:\d{2}(?::\d{2})?)\]$"
)
ACHADO = re.compile(
    r"^\s*-\s*\[( |x|X)\]\s*\[(crítico|critico|atenção|atencao|sugestão|sugestao)\]\s*(.*)$",
    re.I,
)
PERGUNTA = re.compile(r"^\s*-\s*\[( |x|X|~)\]\s*(.*)$")

TIPOS_ATOMO = {"história", "argumento", "opinião", "fato", "citação", "descrição"}
RELACOES = {"repete", "complementa", "contradiz"}
OBRIGATORIOS_ATOMO = ["id", "fonte", "tipo", "resumo", "trecho_literal"]
STATUS_CAPITULO = {"rascunho", "revisado", "aprovado"}
STATUS_ITEM_OK = {"aprovado", "gerado"}

CONFIG_PADRAO = {
    "itens_obrigatorios": ["titulo", "contracapa", "sumario"],
    "itens_derivados": ["titulo", "contracapa", "orelha", "introducao", "sobre-a-autora", "sumario"],
    "lentes": [
        "repetição", "contradição factual", "deriva de voz",
        "ordem e buracos", "abertura e final", "rastreabilidade",
    ],
}


# ---------------------------------------------------------------- utilidades
def ler(caminho: Path) -> str:
    return caminho.read_text(encoding="utf-8").replace("\r\n", "\n")


def sem_acentos(texto: str) -> str:
    return "".join(
        c for c in unicodedata.normalize("NFD", texto) if unicodedata.category(c) != "Mn"
    )


def normalizar(texto: str) -> str:
    """Tira marcas de tempo, uniformiza aspas e espaços, para comparar trechos."""
    texto = TIMESTAMP.sub(" ", texto)
    for velho, novo in (("“", '"'), ("”", '"'), ("‘", "'"), ("’", "'"), ("…", "...")):
        texto = texto.replace(velho, novo)
    return re.sub(r"\s+", " ", texto).strip()


def hash_texto(texto: str) -> str:
    linhas = [linha.rstrip() for linha in texto.strip().split("\n")]
    canonico = re.sub(r"\n{3,}", "\n\n", "\n".join(linhas))
    return hashlib.sha256(canonico.encode("utf-8")).hexdigest()[:16]


def ler_cabecalho(texto: str) -> tuple[dict, str]:
    """Lê um cabeçalho simples '---' com linhas 'chave: valor' (continuação com recuo)."""
    if not texto.startswith("---\n"):
        return {}, texto
    fim = texto.find("\n---", 4)
    if fim == -1:
        return {}, texto
    campos: dict[str, str] = {}
    chave = None
    for linha in texto[4:fim].split("\n"):
        if not linha.strip():
            continue
        if linha[0] in " \t" and chave:
            campos[chave] += " " + linha.strip()
        elif ":" in linha:
            chave, valor = linha.split(":", 1)
            chave = chave.strip()
            campos[chave] = valor.strip()
    for k, v in campos.items():
        if len(v) >= 2 and v[0] == v[-1] and v[0] in "\"'":
            campos[k] = v[1:-1]
    return campos, texto[fim + 4:].lstrip("\n")


def atomos_em_texto(texto: str) -> list[str]:
    return sorted(set(ID_ATOMO.findall(" ".join(COMENTARIO.findall(texto)))))


class Relatorio:
    def __init__(self, titulo: str):
        self.titulo = titulo
        self.erros: list[tuple[str, str]] = []
        self.avisos: list[tuple[str, str]] = []
        self.infos: list[tuple[str, str]] = []

    def erro(self, local: str, msg: str) -> None:
        self.erros.append((local, msg))

    def aviso(self, local: str, msg: str) -> None:
        self.avisos.append((local, msg))

    def info(self, local: str, msg: str) -> None:
        self.infos.append((local, msg))

    def juntar(self, outro: "Relatorio") -> None:
        for lista, destino in (
            (outro.erros, self.erros), (outro.avisos, self.avisos), (outro.infos, self.infos)
        ):
            destino.extend((f"{outro.titulo}/{loc}", msg) for loc, msg in lista)

    def como_dict(self) -> dict:
        return {
            "titulo": self.titulo,
            "ok": not self.erros,
            "erros": [{"local": a, "msg": b} for a, b in self.erros],
            "avisos": [{"local": a, "msg": b} for a, b in self.avisos],
            "infos": [{"local": a, "msg": b} for a, b in self.infos],
        }

    def imprimir(self) -> None:
        print(f"== {self.titulo}")
        for rotulo, lista in (("ERRO", self.erros), ("AVISO", self.avisos), ("INFO", self.infos)):
            for local, msg in lista:
                print(f"  [{rotulo}] {local}: {msg}")
        print(f"  -> {len(self.erros)} erro(s), {len(self.avisos)} aviso(s)")


class Projeto:
    def __init__(self, raiz: str | Path):
        self.raiz = Path(raiz).resolve()
        self.clean = self.raiz / "transcricoes" / "clean"
        self.atomos = self.raiz / "notas" / "atoms"
        self.livro = self.raiz / "livro"
        self.capitulos = self.livro / "capitulos"
        self.fechamento = self.raiz / "fechamento"
        self.itens = self.fechamento / "itens"
        self.controle = self.raiz / "controle"

    def config(self) -> dict:
        cfg = dict(CONFIG_PADRAO)
        arq = self.controle / "config.json"
        if arq.exists():
            cfg.update(json.loads(arq.read_text(encoding="utf-8")))
        return cfg

    def status(self) -> dict:
        arq = self.fechamento / "status.json"
        return json.loads(arq.read_text(encoding="utf-8")) if arq.exists() else {}

    def salvar_status(self, dados: dict) -> None:
        self.fechamento.mkdir(parents=True, exist_ok=True)
        (self.fechamento / "status.json").write_text(
            json.dumps(dados, ensure_ascii=False, indent=2), encoding="utf-8"
        )


def carregar_atomos(proj: Projeto) -> dict[str, dict]:
    return {
        arq.stem: ler_cabecalho(ler(arq))[0] for arq in sorted(proj.atomos.glob("A-*.md"))
    }


def carregar_capitulos(proj: Projeto) -> list[dict]:
    caps = []
    for arq in proj.capitulos.glob("C-*.md"):
        m = re.fullmatch(r"C-(\d{2,})", arq.stem)
        if not m:
            continue
        campos, corpo = ler_cabecalho(ler(arq))
        caps.append({"id": arq.stem, "num": int(m.group(1)), "arquivo": arq,
                     "campos": campos, "corpo": corpo})
    return sorted(caps, key=lambda c: c["num"])


# ------------------------------------------------------------------- átomos
def validar_atomos(proj: Projeto) -> Relatorio:
    rel = Relatorio("atomos")
    arquivos = sorted(proj.atomos.glob("A-*.md"))
    if not arquivos:
        rel.aviso("notas/atoms", "nenhum átomo encontrado")
        return rel
    limpas = {p.stem: normalizar(ler(p)) for p in proj.clean.glob("audio-*.md")}
    campos_por_id: dict[str, dict] = {}
    vistos: dict[str, str] = {}

    for arq in arquivos:
        campos, _ = ler_cabecalho(ler(arq))
        campos_por_id[arq.stem] = campos
        local = arq.name
        for c in OBRIGATORIOS_ATOMO:
            if not campos.get(c):
                rel.erro(local, f"campo obrigatório ausente ou vazio: {c}")
        aid = campos.get("id", "")
        if aid and aid != arq.stem:
            rel.erro(local, f"id '{aid}' diferente do nome do arquivo")
        if aid:
            if aid in vistos:
                rel.erro(local, f"id duplicado (já usado em {vistos[aid]})")
            vistos[aid] = arq.name
        tipo = campos.get("tipo", "").lower()
        if tipo and tipo not in TIPOS_ATOMO:
            rel.erro(local, f"tipo '{tipo}' inválido; use um de {sorted(TIPOS_ATOMO)}")
        conf = campos.get("confianca_transcricao", "").lower()
        if conf and conf not in {"alta", "baixa"}:
            rel.erro(local, "confianca_transcricao deve ser alta ou baixa")

        fonte = campos.get("fonte", "")
        literal = campos.get("trecho_literal", "")
        m = FONTE.match(fonte) if fonte else None
        if fonte and not m:
            rel.erro(local, "fonte fora do formato 'audio-NN [mm:ss-mm:ss]'")
        if m:
            audio = m.group(1)
            if audio not in limpas:
                rel.erro(local, f"transcrição limpa de {audio} não encontrada")
            elif literal and normalizar(literal) not in limpas[audio]:
                rel.erro(local, f"trecho_literal não encontrado em {audio}")
            def seg(t: str) -> int:
                p = [int(x) for x in t.split(":")]
                return p[0] * 60 + p[1] if len(p) == 2 else p[0] * 3600 + p[1] * 60 + p[2]
            if seg(m.group(2)) > seg(m.group(3)):
                rel.erro(local, "marca de início maior que a de fim")
        if "[?" in literal and conf != "baixa":
            rel.aviso(local, "trecho com [?] mas confianca_transcricao não é 'baixa'")

    contradicoes = 0
    for aid, campos in campos_por_id.items():
        bruto = campos.get("relacionado", "").strip()
        if bruto in ("", "[]", "nenhum"):
            continue
        pares = re.findall(r"(A-\d{3,})\s*\(\s*([^)]+?)\s*\)", bruto)
        if len(pares) != len(ID_ATOMO.findall(bruto)):
            rel.erro(f"{aid}.md", "relacionado fora do formato 'A-002 (repete), A-005 (contradiz)'")
        for outro, relacao in pares:
            if relacao.lower() not in RELACOES:
                rel.erro(f"{aid}.md", f"relação '{relacao}' inválida; use {sorted(RELACOES)}")
            if outro == aid:
                rel.erro(f"{aid}.md", "átomo relacionado a si mesmo")
            elif outro not in campos_por_id:
                rel.erro(f"{aid}.md", f"relacionado aponta para átomo inexistente: {outro}")
            if relacao.lower() == "contradiz":
                contradicoes += 1
    if contradicoes:
        rel.info("relacionado", f"{contradicoes} relação(ões) 'contradiz' registrada(s); devem virar perguntas")

    numeros = sorted(int(i.split("-")[1]) for i in campos_por_id if re.fullmatch(r"A-\d+", i))
    if numeros:
        faltando = [f"A-{n:03d}" for n in range(1, numeros[-1] + 1) if n not in set(numeros)]
        if faltando:
            rel.aviso("notas/atoms", f"IDs ausentes na sequência: {', '.join(faltando[:10])}")
    rel.info("notas/atoms", f"{len(arquivos)} átomo(s) verificados")
    return rel


# --------------------------------------------------------------- rastreio
def validar_rastreio(proj: Projeto, estrito: bool = False) -> Relatorio:
    rel = Relatorio("rastreio")
    atomos = carregar_atomos(proj)
    caps = carregar_capitulos(proj)
    if not caps:
        rel.aviso("livro/capitulos", "nenhum capítulo encontrado")
        return rel
    usados: dict[str, set[str]] = {}

    for cap in caps:
        local = f"{cap['id']}.md"
        status = cap["campos"].get("status", "")
        if status not in STATUS_CAPITULO:
            rel.erro(local, f"status '{status}' inválido; use {sorted(STATUS_CAPITULO)}")
        for coment in COMENTARIO.findall(cap["corpo"]):
            curtos = [i for i in ID_ATOMO_CURTO.findall(coment)]
            if curtos:
                rel.erro(local, f"ID malformado em comentário: {', '.join(curtos)} (use A-NNN)")

        blocos: list[list] = []
        for bloco in re.split(r"\n\s*\n", cap["corpo"]):
            ids = set(atomos_em_texto(bloco))
            texto = COMENTARIO.sub("", bloco).strip()
            if not texto:
                if blocos:
                    blocos[-1][1] |= ids
                continue
            if texto.startswith("#"):
                continue
            blocos.append([texto, ids])

        for texto, ids in blocos:
            inicio = texto[:50].replace("\n", " ")
            if not ids:
                (rel.erro if estrito else rel.aviso)(local, f"parágrafo sem átomo: \"{inicio}...\"")
            for aid in sorted(ids):
                if aid not in atomos:
                    rel.erro(local, f"{aid} citado mas não existe")
                else:
                    usados.setdefault(aid, set()).add(cap["id"])
                    if atomos[aid].get("confianca_transcricao", "").lower() == "baixa":
                        rel.aviso(local, f"{aid} tem transcrição de baixa confiança")

    nao_usados = sorted(set(atomos) - set(usados))
    if nao_usados:
        rel.aviso("átomos", f"{len(nao_usados)} não usado(s) em nenhum capítulo: {', '.join(nao_usados[:15])}")
    em_varios = {a: sorted(c) for a, c in usados.items() if len(c) > 1}
    for aid, lista in sorted(em_varios.items()):
        rel.info(aid, f"usado em mais de um capítulo: {', '.join(lista)} (possível repetição)")
    return rel


# ----------------------------------------------------------------- montador
def _limpar_corpo(corpo: str) -> str:
    corpo = COMENTARIO.sub("", corpo)
    corpo = re.sub(r"[ \t]+\n", "\n", corpo)
    return re.sub(r"\n{3,}", "\n\n", corpo).strip() + "\n"


def _com_titulo(cap: dict, corpo: str) -> str:
    primeira = next((l for l in corpo.split("\n") if l.strip()), "")
    if primeira.lstrip().startswith("#"):
        return corpo
    return f"## {cap['campos'].get('titulo') or cap['id']}\n\n{corpo}"


def montar(proj: Projeto, dry_run: bool = False) -> tuple[Relatorio, dict]:
    rel = Relatorio("montador")
    caps = carregar_capitulos(proj)
    aprovados = [c for c in caps if c["campos"].get("status") == "aprovado"]
    pendentes = [c["id"] for c in caps if c not in aprovados]
    if pendentes:
        rel.info("capítulos", f"não aprovados e fora do manuscrito: {', '.join(pendentes)}")
    if not aprovados:
        rel.aviso("capítulos", "nenhum capítulo aprovado; nada a montar")
        return rel, {}

    nums = [c["num"] for c in aprovados]
    buracos = [f"C-{n:02d}" for n in range(1, nums[-1] + 1) if n not in set(nums)]
    if buracos:
        rel.aviso("capítulos", f"sequência com capítulos não aprovados no meio: {', '.join(buracos)}")

    limpo = "\n".join(_com_titulo(c, _limpar_corpo(c["corpo"])) for c in aprovados)
    rastreavel = "\n".join(
        _com_titulo(c, re.sub(r"\n{3,}", "\n\n", c["corpo"]).strip() + "\n") for c in aprovados
    )
    h = hash_texto(limpo)
    mapa = {c["id"]: atomos_em_texto(c["corpo"]) for c in aprovados}
    todos = set(carregar_atomos(proj))
    usados = {a for lista in mapa.values() for a in lista}
    contagem: dict[str, list[str]] = {}
    for cid, lista in mapa.items():
        for a in lista:
            contagem.setdefault(a, []).append(cid)
    resultado = {
        "hash": h,
        "capitulos": [c["id"] for c in aprovados],
        "mapa": {
            "capitulos": mapa,
            "nao_usados": sorted(todos - usados),
            "usados_em_varios": {a: c for a, c in contagem.items() if len(c) > 1},
        },
    }

    status = proj.status()
    antigo = status.get("manuscrito_hash")
    desatualizados = []
    if proj.itens.exists():
        derivados = set(proj.config()["itens_derivados"]) - {"sumario"}
        for arq in sorted(proj.itens.glob("*.md")):
            campos, _ = ler_cabecalho(ler(arq))
            if arq.stem in derivados and campos.get("status") != "dispensado" \
                    and campos.get("baseado_em_hash") not in (None, "", h):
                desatualizados.append(arq.stem)
    if antigo and antigo != h:
        rel.aviso("manuscrito", f"manuscrito mudou ({antigo} -> {h})")
    for nome in desatualizados:
        rel.aviso(f"itens/{nome}", "baseado em versão anterior do manuscrito; precisa ser refeito")
    resultado["desatualizados"] = desatualizados

    if dry_run:
        return rel, resultado

    proj.livro.mkdir(parents=True, exist_ok=True)
    (proj.livro / "manuscrito.md").write_text(limpo, encoding="utf-8")
    (proj.livro / "manuscrito-rastreavel.md").write_text(rastreavel, encoding="utf-8")
    proj.fechamento.mkdir(parents=True, exist_ok=True)
    (proj.fechamento / "mapa-atomos.json").write_text(
        json.dumps(resultado["mapa"], ensure_ascii=False, indent=2), encoding="utf-8"
    )
    proj.itens.mkdir(parents=True, exist_ok=True)
    linhas = [f"{i}. {c['campos'].get('titulo') or c['id']}" for i, c in enumerate(aprovados, 1)]
    (proj.itens / "sumario.md").write_text(
        f"---\nitem: sumario\nstatus: gerado\nbaseado_em_hash: {h}\n---\n" + "\n".join(linhas) + "\n",
        encoding="utf-8",
    )
    status.update({
        "manuscrito_hash": h,
        "capitulos_no_manuscrito": resultado["capitulos"],
        "itens_desatualizados": desatualizados,
        "gerado_em": datetime.now(timezone.utc).isoformat(timespec="seconds"),
    })
    proj.salvar_status(status)
    rel.info("manuscrito", f"montado com {len(aprovados)} capítulo(s); hash {h}")
    return rel, resultado


# --------------------------------------------------------------------- gate
def gate_fechamento(proj: Projeto, estrito: bool = False) -> Relatorio:
    rel = Relatorio("gate")
    cfg = proj.config()
    rel.juntar(validar_atomos(proj))
    rel.juntar(validar_rastreio(proj, estrito))

    caps = carregar_capitulos(proj)
    if not caps:
        rel.erro("livro/capitulos", "nenhum capítulo")
    for c in caps:
        st = c["campos"].get("status", "")
        if st != "aprovado":
            rel.erro(c["id"], f"capítulo não aprovado (status: {st or 'vazio'})")
    outline = proj.livro / "outline.md"
    if outline.exists():
        previstos = set()
        for linha in ler(outline).splitlines():
            if linha.lstrip().startswith("#"):
                previstos |= {f"C-{m}" for m in ID_CAPITULO.findall(linha)}
        for falta in sorted(previstos - {c["id"] for c in caps}):
            rel.erro("outline", f"{falta} previsto no outline e sem arquivo de capítulo")

    _, res = montar(proj, dry_run=True)
    hash_atual = res.get("hash")
    ms = proj.livro / "manuscrito.md"
    if not ms.exists():
        rel.erro("livro/manuscrito.md", "não gerado; rode 'montar'")
    elif hash_atual and hash_texto(ler(ms)) != hash_atual:
        rel.erro("livro/manuscrito.md", "desatualizado em relação aos capítulos aprovados; rode 'montar'")
    elif hash_atual and proj.status().get("manuscrito_hash") != hash_atual:
        rel.erro("fechamento/status.json", "hash desatualizado; rode 'montar'")

    existentes: dict[str, dict] = {}
    if proj.itens.exists():
        for arq in sorted(proj.itens.glob("*.md")):
            existentes[arq.stem] = ler_cabecalho(ler(arq))[0]
    for nome in cfg["itens_obrigatorios"]:
        if nome not in existentes:
            rel.erro(f"itens/{nome}", "item obrigatório ausente")
        elif existentes[nome].get("status", "").lower() == "dispensado":
            rel.erro(f"itens/{nome}", "item obrigatório não pode ser dispensado")
    for nome, campos in existentes.items():
        st = campos.get("status", "").lower()
        if st == "dispensado":
            continue
        if st not in STATUS_ITEM_OK:
            rel.erro(f"itens/{nome}", f"status '{st or 'vazio'}': precisa estar aprovado ou dispensado")
        elif nome in cfg["itens_derivados"] and hash_atual \
                and campos.get("baseado_em_hash") != hash_atual:
            rel.erro(f"itens/{nome}", "desatualizado: baseado em outra versão do manuscrito")

    rp = proj.fechamento / "relatorio.md"
    if not rp.exists():
        rel.erro("fechamento/relatorio.md", "revisão do conjunto não executada")
    else:
        texto = ler(rp)
        titulos = [sem_acentos(l.lstrip("# ").strip()).lower() for l in texto.splitlines() if l.startswith("#")]
        for lente in cfg["lentes"]:
            if not any(sem_acentos(lente).lower() in t for t in titulos):
                rel.erro("relatorio.md", f"lente '{lente}' sem seção")
        for linha in texto.splitlines():
            m = ACHADO.match(linha)
            if not m or m.group(1) != " ":
                continue
            sev = sem_acentos(m.group(2)).lower()
            resumo = m.group(3)[:80]
            if sev == "critico":
                rel.erro("relatorio.md", f"achado crítico aberto: {resumo}")
            elif sev == "atencao":
                rel.aviso("relatorio.md", f"achado de atenção aberto: {resumo}")

    pq = proj.controle / "perguntas.md"
    if pq.exists():
        adiadas = 0
        for linha in ler(pq).splitlines():
            m = PERGUNTA.match(linha)
            if not m:
                continue
            if m.group(1) == " ":
                rel.erro("controle/perguntas.md", f"pergunta em aberto: {m.group(2)[:80]}")
            elif m.group(1) == "~":
                adiadas += 1
        if adiadas:
            rel.info("controle/perguntas.md", f"{adiadas} pergunta(s) adiada(s) explicitamente pela autora")
    return rel


# ---------------------------------------------------------------------- CLI
def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description="Verificações do harness da ghost writer")
    ap.add_argument("comando", choices=["atomos", "rastreio", "montar", "gate", "tudo"])
    ap.add_argument("--raiz", default=".", help="pasta raiz do projeto do livro")
    ap.add_argument("--estrito", action="store_true", help="parágrafo sem átomo vira erro")
    ap.add_argument("--dry-run", action="store_true", help="montar sem gravar arquivos")
    ap.add_argument("--json", action="store_true", help="saída em JSON")
    args = ap.parse_args(argv)
    proj = Projeto(args.raiz)

    if args.comando == "atomos":
        relatorios = [validar_atomos(proj)]
    elif args.comando == "rastreio":
        relatorios = [validar_rastreio(proj, args.estrito)]
    elif args.comando == "montar":
        relatorios = [montar(proj, args.dry_run)[0]]
    elif args.comando == "gate":
        relatorios = [gate_fechamento(proj, args.estrito)]
    else:
        relatorios = [montar(proj, args.dry_run)[0], gate_fechamento(proj, args.estrito)]

    if args.json:
        print(json.dumps([r.como_dict() for r in relatorios], ensure_ascii=False, indent=2))
    else:
        for r in relatorios:
            r.imprimir()
        if args.comando in ("gate", "tudo"):
            print("FECHAMENTO LIBERADO" if not relatorios[-1].erros else "FECHAMENTO BLOQUEADO")
    return 1 if any(r.erros for r in relatorios) else 0


if __name__ == "__main__":
    sys.exit(main())
