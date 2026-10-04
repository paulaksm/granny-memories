import type { NativeStackScreenProps } from '@react-navigation/native-stack';

export type Rotas = {
  Inicio: undefined;
  Livro: { livroId: string; guardarAudio?: string };
  Gravar: { livroId: string | null };
  Transcricao: { audioId: string };
  Carregando: { tipo: 'transcrever' | 'ler' | 'escrever'; alvo: string; livroId?: string };
  Voz: { origem: 'fluxo' | 'capitulo' | 'ajustes'; audioId?: string; capituloId?: string };
  Ideias: { audioId: string };
  Capitulo: { capituloId: string };
  Previa: { livroId: string };
  Configuracao: undefined;
  SemRede: { audioId: string };
};

export type Props<R extends keyof Rotas> = NativeStackScreenProps<Rotas, R>;
