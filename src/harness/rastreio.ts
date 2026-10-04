// Verificação `rastreio`, portada de validar_rastreio em reference/python/harness.py.
import type { Arquivos } from './arquivos';
import { carregarAtomos, carregarCapitulos, PASTAS } from './projeto';
import { Relatorio } from './relatorio';
import { atomosEmTexto, COMENTARIO, comentarios, ID_ATOMO_CURTO } from './texto';

export const STATUS_CAPITULO = ['rascunho', 'revisado', 'aprovado'];

export async function validarRastreio(arq: Arquivos, estrito = false): Promise<Relatorio> {
  const rel = new Relatorio('rastreio');
  const atomos = await carregarAtomos(arq);
  const caps = await carregarCapitulos(arq);
  if (caps.length === 0) {
    rel.aviso(PASTAS.capitulos, 'nenhum capítulo encontrado');
    return rel;
  }
  const usados: Record<string, Set<string>> = {};

  for (const cap of caps) {
    const local = `${cap.id}.md`;
    const status = cap.campos.status ?? '';
    if (!STATUS_CAPITULO.includes(status)) {
      rel.erro(local, `status '${status}' inválido; use ${[...STATUS_CAPITULO].sort().join(', ')}`);
    }
    for (const coment of comentarios(cap.corpo)) {
      const curtos = coment.match(ID_ATOMO_CURTO) ?? [];
      if (curtos.length) rel.erro(local, `ID malformado em comentário: ${curtos.join(', ')} (use A-NNN)`);
    }

    const blocos: { texto: string; ids: Set<string> }[] = [];
    for (const bloco of cap.corpo.split(/\n\s*\n/)) {
      const ids = new Set(atomosEmTexto(bloco));
      const texto = bloco.replace(COMENTARIO, '').trim();
      if (!texto) {
        if (blocos.length) ids.forEach((i) => blocos[blocos.length - 1].ids.add(i));
        continue;
      }
      if (texto.startsWith('#')) continue;
      blocos.push({ texto, ids });
    }

    for (const { texto, ids } of blocos) {
      const inicio = texto.slice(0, 50).replace(/\n/g, ' ');
      if (ids.size === 0) {
        (estrito ? rel.erro : rel.aviso).call(rel, local, `parágrafo sem átomo: "${inicio}..."`);
      }
      for (const aid of [...ids].sort()) {
        if (!(aid in atomos)) {
          rel.erro(local, `${aid} citado mas não existe`);
        } else {
          (usados[aid] ??= new Set()).add(cap.id);
          if ((atomos[aid].confianca_transcricao ?? '').toLowerCase() === 'baixa') {
            rel.aviso(local, `${aid} tem transcrição de baixa confiança`);
          }
        }
      }
    }
  }

  const naoUsados = Object.keys(atomos)
    .filter((a) => !(a in usados))
    .sort();
  if (naoUsados.length) {
    rel.aviso(
      'átomos',
      `${naoUsados.length} não usado(s) em nenhum capítulo: ${naoUsados.slice(0, 15).join(', ')}`,
    );
  }
  for (const [aid, lista] of Object.entries(usados).sort()) {
    if (lista.size > 1) {
      rel.info(aid, `usado em mais de um capítulo: ${[...lista].sort().join(', ')} (possível repetição)`);
    }
  }
  return rel;
}
