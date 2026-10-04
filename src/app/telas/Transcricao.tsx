// Transcrição (Passo 1 de 4), com a correção mínima das palavras duvidosas (RF3 mínimo).
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import {
  Aviso,
  BlocoTitulo,
  BotaoPilula,
  BotaoPrincipal,
  BotaoSecundario,
  Cabecalho,
  Campo,
  e,
  Folha,
  SeloOrigem,
  Tela,
} from '../componentes';
import { audioLimpo, corrigirPalavra, lerTranscricao, type ParagrafoTela, segundosDe } from '../leitura';
import { rotuloAudio, useLoja } from '../loja';
import type { Props } from '../navegacao';
import { usarTocador } from '../tocador';
import { cor, espaco, fonte, raio, tipo } from '../tema';

export function Transcricao({ route, navigation }: Props<'Transcricao'>) {
  const { audioId } = route.params;
  const { dados } = useLoja();
  const audio = dados.audios.find((a) => a.id === audioId);
  const [paragrafos, setParagrafos] = useState<ParagrafoTela[] | null>(null);
  const [corrigindo, setCorrigindo] = useState<{ indice: number; palavra: string; marca: string } | null>(null);
  const [nova, setNova] = useState('');
  const [corrigidas, setCorrigidas] = useState(0);
  const [jaLimpo, setJaLimpo] = useState(false);
  const tocador = usarTocador(audioId);

  const carregar = useCallback(() => {
    lerTranscricao(audioId).then(setParagrafos);
    audioLimpo(audioId).then(setJaLimpo);
  }, [audioId]);
  useFocusEffect(carregar);

  const duvidas = (paragrafos ?? []).flatMap((p) => p.trechos.filter((t) => t.duvida)).length;

  const salvar = async () => {
    if (!corrigindo || !nova.trim()) return;
    await corrigirPalavra(audioId, corrigindo.indice, nova);
    setCorrigindo(null);
    setNova('');
    setCorrigidas((n) => n + 1);
    carregar();
  };

  const voltar = () =>
    audio?.livroId ? navigation.navigate('Livro', { livroId: audio.livroId }) : navigation.navigate('Inicio');

  const primeiraDuvida = () => {
    for (const p of paragrafos ?? []) {
      const t = p.trechos.find((x) => x.duvida);
      if (t?.duvida) return setCorrigindo({ ...t.duvida, marca: p.marca });
    }
  };

  return (
    <Tela
      rodape={
        <BotaoPrincipal
          rotulo="Está certo, continuar"
          onPress={() =>
            jaLimpo
              ? navigation.navigate('Voz', { origem: 'fluxo', audioId })
              : navigation.navigate('Carregando', { tipo: 'ler', alvo: audioId })
          }
          desativado={!paragrafos}
        />
      }
    >
      <Cabecalho onVoltar={voltar} />
      <BlocoTitulo passo="Passo 1 de 4" titulo="Transcrição" sub="O que o app ouviu no seu áudio." />
      <View style={e.conteudo}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: espaco[3] }}>
          <View style={{ flex: 1 }}>
            <Text style={[tipo.small, { color: cor.inkSoft }]}>
              {rotuloAudio(audioId)}
              {audio?.duracao ? ` · ${audio.duracao}` : ''}
            </Text>
            <Text style={[tipo.bookCard, { fontFamily: fonte.livroSemi, fontSize: 19 }]}>{audio?.nome}</Text>
          </View>
          <BotaoPilula rotulo={tocador.tocando ? 'Tocando…' : 'Ouvir o áudio'} onPress={() => tocador.tocar(0)} />
        </View>

        {duvidas > 0 ? (
          <Aviso tom="tawny">
            <Text style={[tipo.body, { color: '#6E3210' }]}>
              {duvidas === 1
                ? 'Uma palavra não ficou clara. Toque nela para corrigir.'
                : `${duvidas} palavras não ficaram claras. Toque nelas para corrigir.`}
            </Text>
            <BotaoSecundario rotulo="Corrigir a palavra" onPress={primeiraDuvida} fundo={cor.paperRaised} altura={48} />
          </Aviso>
        ) : corrigidas > 0 ? (
          <Aviso tom="verde">Palavra corrigida. Confira o resto e continue.</Aviso>
        ) : null}

        {paragrafos === null ? (
          <Text style={tipo.body}>Ainda não há transcrição deste áudio.</Text>
        ) : (
          paragrafos.map((p, i) => (
            <Text key={i} style={[tipo.book, { lineHeight: 36 }]}>
              {p.trechos.map((t, j) =>
                t.duvida ? (
                  <Text
                    key={j}
                    onPress={() => setCorrigindo({ ...t.duvida!, marca: p.marca })}
                    style={{
                      backgroundColor: cor.tawnyTint,
                      color: cor.tawnyInk,
                      textDecorationLine: 'underline',
                      textDecorationStyle: 'dashed',
                    }}
                  >
                    {' [?] '}
                  </Text>
                ) : (
                  <Text key={j}>{t.texto}</Text>
                ),
              )}
            </Text>
          ))
        )}
      </View>

      <Folha visivel={!!corrigindo} onFechar={() => setCorrigindo(null)} titulo="Qual palavra você disse aqui?">
        {corrigindo && (
          <>
            <View
              style={{
                borderWidth: 2,
                borderStyle: 'dashed',
                borderColor: cor.tawny,
                borderRadius: raio.campo,
                padding: espaco[3],
              }}
            >
              <Text style={[tipo.body, { color: cor.inkSoft }]}>O app ouviu algo parecido com:</Text>
              <Text style={tipo.bookCard}>“{corrigindo.palavra}”</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: espaco[3], alignItems: 'center' }}>
              <SeloOrigem rotulo={`${rotuloAudio(audioId)} · ${corrigindo.marca}`} />
              <Pressable onPress={() => tocador.tocar(segundosDe(corrigindo.marca))}>
                <Text style={[tipo.buttonSmall, { color: cor.tawnyInk, textDecorationLine: 'underline' }]}>
                  Ouvir este trecho
                </Text>
              </Pressable>
            </View>
            <Campo valor={nova} onChange={setNova} placeholder="Escreva a palavra certa" livro />
            <BotaoPrincipal rotulo="Salvar correção" onPress={salvar} desativado={!nova.trim()} />
          </>
        )}
      </Folha>
    </Tela>
  );
}
