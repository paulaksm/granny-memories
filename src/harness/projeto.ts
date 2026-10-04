// Estrutura de pastas do projeto do livro (docs/harness-fatia.md, "Arquivos no aparelho").
import type { Arquivos } from './arquivos';
import { lerCabecalho } from './texto';

export const PASTAS = {
  audios: 'audios',
  raw: 'transcricoes/raw',
  revisada: 'transcricoes/revisada',
  clean: 'transcricoes/clean',
  atomos: 'notas/atoms',
  capitulos: 'livro/capitulos', // gitleaks:allow (caminho de pasta, falso positivo)
  voz: 'voz',
  controle: 'controle',
} as const;

export const ARQUIVOS = {
  guiaVoz: 'voz/guia-de-voz.md',
  perguntas: 'controle/perguntas.md',
  estado: 'controle/estado.json',
  config: 'controle/config.json',
} as const;

export type Capitulo = {
  id: string;
  num: number;
  campos: Record<string, string>;
  corpo: string;
};

export async function carregarAtomos(arq: Arquivos): Promise<Record<string, Record<string, string>>> {
  const atomos: Record<string, Record<string, string>> = {};
  for (const nome of await arq.listar(PASTAS.atomos)) {
    if (!/^A-.*\.md$/.test(nome)) continue;
    atomos[nome.slice(0, -3)] = lerCabecalho(await arq.ler(`${PASTAS.atomos}/${nome}`))[0];
  }
  return atomos;
}

export async function carregarCapitulos(arq: Arquivos): Promise<Capitulo[]> {
  const caps: Capitulo[] = [];
  for (const nome of await arq.listar(PASTAS.capitulos)) {
    const m = /^C-(\d{2,})\.md$/.exec(nome);
    if (!m) continue;
    const [campos, corpo] = lerCabecalho(await arq.ler(`${PASTAS.capitulos}/${nome}`));
    caps.push({ id: nome.slice(0, -3), num: Number(m[1]), campos, corpo });
  }
  return caps.sort((a, b) => a.num - b.num);
}
