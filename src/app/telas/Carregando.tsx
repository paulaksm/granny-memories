// Estado "Carregando" do handoff: transcrevendo, lendo como você fala, escrevendo.
import { useKeepAwake } from 'expo-keep-awake';
import { useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import {
  Aviso,
  AvisoCelularAberto,
  BarraProgresso,
  BotaoPrincipal,
  BotaoSecundario,
  Cabecalho,
  e,
  Tela,
} from '../componentes';
import { capituloDoAudio, escreverCapitulo, lerComoFala, lerEstado, transcreverAudio, useLoja } from '../loja';
import type { Props } from '../navegacao';
import { cor, espaco, tipo } from '../tema';

const TITULOS = {
  transcrever: 'Transcrevendo seu áudio',
  ler: 'Lendo como você fala…',
  escrever: 'Escrevendo o capítulo no seu celular',
};
const FONTES = {
  transcrever: 'O áudio vai para a ElevenLabs só para virar texto.',
  ler: 'O app separa as ideias e aprende o seu jeito de contar.',
  escrever: 'O capítulo é escrito no seu celular, sem internet.',
};

export function Carregando({ route, navigation }: Props<'Carregando'>) {
  useKeepAwake();
  const { tipo: t, alvo } = route.params;
  const { tarefa, dados } = useLoja();
  const [erro, setErro] = useState<string | null>(null);
  const iniciado = useRef(false);

  const livroId =
    route.params.livroId ??
    (t === 'escrever'
      ? dados.capitulos.find((c) => c.id === alvo)?.livroId
      : dados.audios.find((a) => a.id === alvo)?.livroId) ??
    undefined;

  const voltarAoLivro = () =>
    livroId ? navigation.navigate('Livro', { livroId }) : navigation.navigate('Inicio');

  const rodar = async () => {
    setErro(null);
    try {
      if (t === 'transcrever') {
        await transcreverAudio(alvo);
        const s = lerEstado();
        if (s.semRede.includes(alvo)) return navigation.replace('SemRede', { audioId: alvo });
        if (s.erro) throw new Error(s.erro);
        navigation.replace('Transcricao', { audioId: alvo });
      } else if (t === 'ler') {
        await lerComoFala(alvo);
        navigation.replace('Voz', { origem: 'fluxo', audioId: alvo });
      } else {
        await escreverCapitulo(alvo);
        navigation.replace('Capitulo', { capituloId: alvo });
      }
    } catch (err) {
      setErro(err instanceof Error ? err.message : String(err));
    }
  };

  useEffect(() => {
    if (iniciado.current) return;
    iniciado.current = true;
    rodar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fracao = tarefa && tarefa.tipo === t && tarefa.alvo === alvo ? tarefa.fracao : erro ? 0 : 0.02;
  const capitulo = t !== 'escrever' ? capituloDoAudio(dados, alvo) : undefined;

  return (
    <Tela rodape={<BotaoSecundario rotulo="Voltar para o livro" onPress={voltarAoLivro} />}>
      <Cabecalho onVoltar={voltarAoLivro} />
      <View style={[e.conteudo, { gap: espaco[5] }]}>
        <Text style={[tipo.small, { color: cor.tawnyInk }]}>{FONTES[t]}</Text>
        <Text style={tipo.title}>{TITULOS[t]}</Text>
        {erro ? (
          <Aviso tom="erro">
            <Text style={[tipo.body, { color: cor.error }]}>{erro}</Text>
            <BotaoPrincipal rotulo="Tentar de novo" onPress={rodar} />
          </Aviso>
        ) : (
          <>
            <BarraProgresso fracao={fracao} />
            <AvisoCelularAberto />
          </>
        )}
        {capitulo && <Text style={[tipo.body, { color: cor.inkSoft }]}>Vai para o {capitulo.titulo}.</Text>}
      </View>
    </Tela>
  );
}
