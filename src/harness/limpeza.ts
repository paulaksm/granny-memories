// Verificação `limpeza` (nova, docs/harness-fatia.md): a limpeza não pode trazer palavra
// que não estava no texto revisado, nem encolher demais um parágrafo.
import { Relatorio } from './relatorio';

function palavras(texto: string): string[] {
  const semMarcas = texto.replace(/\[\?[^\]]*\]/g, ' ');
  return (semMarcas.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? []);
}

/**
 * Compara parágrafo a parágrafo (a limpeza roda por parágrafo, então as listas
 * têm o mesmo tamanho). Palavras dentro de marcas [?...] são ignoradas dos dois lados.
 */
export function verificarLimpeza(audio: string, revisados: string[], limpos: string[]): Relatorio {
  const rel = new Relatorio('limpeza');
  if (revisados.length !== limpos.length) {
    rel.erro(audio, `${limpos.length} parágrafo(s) limpos para ${revisados.length} revisados`);
    return rel;
  }
  revisados.forEach((revisado, i) => {
    const local = `${audio} §${i + 1}`;
    const origem = palavras(revisado);
    const conhecidas = new Set(origem);
    const limpo = palavras(limpos[i]);
    const novas = [...new Set(limpo.filter((p) => !conhecidas.has(p)))];
    if (novas.length) rel.erro(local, `palavra(s) que não estavam no áudio: ${novas.join(', ')}`);
    if (origem.length >= 8 && limpo.length < origem.length / 2) {
      rel.aviso(local, `ficou com ${limpo.length} de ${origem.length} palavras (possível resumo)`);
    }
  });
  return rel;
}
