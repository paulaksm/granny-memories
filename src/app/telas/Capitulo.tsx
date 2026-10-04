// Capítulo (Passo 4 de 4). Cada passagem leva o selo de origem; as lacunas aparecem
// como perguntas (responder e editar ficam fora do recorte). "Aprovar" só muda o status.
import { useFocusEffect } from '@react-navigation/native';
import { Feather } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import {
  Aviso,
  BotaoPilula,
  BotaoPrincipal,
  BotaoSecundario,
  Cabecalho,
  e,
  Folha,
  SeloOrigem,
  Tag,
  Tela,
} from '../componentes';
import { type CapituloTela, type Ideia, lerCapitulo, lerIdeias, segundosDe } from '../leitura';
import { aprovarCapitulo, rotuloAudio, useLoja } from '../loja';
import type { Props } from '../navegacao';
import { usarTocador } from '../tocador';
import { cor, espaco, raio, tipo } from '../tema';

export function Capitulo({ route, navigation }: Props<'Capitulo'>) {
  const { capituloId } = route.params;
  const { dados } = useLoja();
  const capMeta = dados.capitulos.find((c) => c.id === capituloId);
  const [cap, setCap] = useState<CapituloTela | null>(null);
  const [ideias, setIdeias] = useState<Record<string, Ideia>>({});
  const [origem, setOrigem] = useState<Ideia | null>(null);
  const tocador = usarTocador(origem?.audio);

  const carregar = useCallback(() => {
    lerCapitulo(capituloId).then(setCap);
    lerIdeias().then((l) => setIdeias(Object.fromEntries(l.map((i) => [i.id, i]))));
  }, [capituloId]);
  useFocusEffect(carregar);

  const aprovado = cap?.status === 'aprovado';
  const voltarAoLivro = () =>
    capMeta ? navigation.navigate('Livro', { livroId: capMeta.livroId }) : navigation.navigate('Inicio');

  const aprovar = async () => {
    await aprovarCapitulo(capituloId);
    carregar();
  };

  return (
    <Tela
      rodape={
        aprovado ? (
          <BotaoPrincipal rotulo="Voltar para o livro" onPress={voltarAoLivro} />
        ) : (
          <BotaoPrincipal rotulo="Aprovar capítulo" onPress={aprovar} desativado={!cap} />
        )
      }
    >
      <Cabecalho onVoltar={() => navigation.goBack()} />
      <View style={[e.conteudo, { gap: espaco[3] }]}>
        <Text style={[tipo.small, { color: cor.tawnyInk }]}>Passo 4 de 4 · Capítulo</Text>
        <Text style={tipo.bookTitle}>{cap?.titulo || capMeta?.titulo || 'Capítulo'}</Text>
        <View style={{ flexDirection: 'row', gap: espaco[2], flexWrap: 'wrap', alignItems: 'center' }}>
          <Pressable
            onPress={() => navigation.navigate('Voz', { origem: 'capitulo', capituloId })}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 6, height: 32, paddingHorizontal: 12, borderRadius: raio.pilula, backgroundColor: cor.paperSunk }}
          >
            <Feather color={cor.inkMuted} size={16} strokeWidth={2} />
            <Text style={[tipo.small, { color: cor.inkMuted }]}>Escrito no seu jeito de contar</Text>
          </Pressable>
          <Tag tipo={aprovado ? 'aprovado' : 'rascunho'} rotulo={aprovado ? 'Aprovado' : 'Rascunho'} />
        </View>
        {aprovado && <Aviso tom="verde">Capítulo aprovado. Ele já faz parte do seu livro.</Aviso>}
        {cap === null ? (
          <Text style={tipo.body}>Este capítulo ainda não foi escrito.</Text>
        ) : (
          <>
            <Text style={[tipo.body, { color: cor.inkSoft }]}>Toque em um selo para ver de onde veio cada trecho.</Text>
            {cap.passagens.map((p, i) => (
              <View key={i} style={{ gap: 4, marginBottom: espaco[2] }}>
                <Text style={tipo.book}>{p.texto}</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: espaco[2] }}>
                  {p.atomos.map((id) => {
                    const ideia = ideias[id];
                    return ideia ? (
                      <SeloOrigem
                        key={id}
                        rotulo={`${rotuloAudio(ideia.audio)} · ${ideia.inicio}`}
                        onPress={() => setOrigem(ideia)}
                      />
                    ) : null;
                  })}
                </View>
              </View>
            ))}
            {cap.perguntas
              .filter((q) => q.aberta)
              .map((q, i) => (
                <View
                  key={`q${i}`}
                  style={{ backgroundColor: cor.gap, borderColor: cor.gapLine, borderWidth: 2, borderRadius: raio.cartao, padding: espaco[4], gap: espaco[2] }}
                >
                  <Text style={[tipo.small, { color: cor.gapInk }]}>Falta uma parte</Text>
                  <Text style={[tipo.bookCard, { color: cor.gapInk }]}>{q.texto}</Text>
                  <Text style={[tipo.body, { color: cor.gapInk }]}>
                    {q.tipo === 'contradição'
                      ? 'Dois trechos parecem dizer coisas diferentes.'
                      : 'Isso não apareceu nos seus áudios. Você pode contar em uma nova gravação.'}
                  </Text>
                </View>
              ))}
          </>
        )}
      </View>

      <Folha visivel={!!origem} onFechar={() => setOrigem(null)} titulo="De onde veio este trecho">
        {origem && (
          <>
            <SeloOrigem rotulo={`${rotuloAudio(origem.audio)} · ${origem.inicio}`} />
            <Text style={tipo.quote}>{origem.original}</Text>
            <BotaoPilula
              rotulo={tocador.tocando ? 'Tocando…' : 'Ouvir este trecho'}
              onPress={() => tocador.tocar(segundosDe(origem.inicio))}
            />
            <BotaoSecundario rotulo="Fechar" onPress={() => setOrigem(null)} />
          </>
        )}
      </Folha>
    </Tela>
  );
}
