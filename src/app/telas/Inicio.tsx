// Meus livros (início): livros, rascunhos sem livro e "Gravar uma história".
import { useFocusEffect } from '@react-navigation/native';
import { BookOpen, ChevronRight, Mic, SlidersHorizontal } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import {
  BotaoPrincipal,
  BotaoSecundario,
  e,
  Folha,
  SeloPrivacidade,
  Tela,
  toast,
} from '../componentes';
import { type Livro, rotuloAudio, type StatusAudio, statusDosAudios, useLoja } from '../loja';
import type { Props } from '../navegacao';
import { cor, espaco, fonte, raio, tamanho, tipo } from '../tema';

const ROTULO_STATUS: Record<StatusAudio, string> = { ready: 'Pronto', transcribing: 'Transcrevendo', queued: 'Na fila' };

export function Capa({ titulo, largura = 76 }: { titulo: string; largura?: number }) {
  return (
    <View
      style={{
        width: largura,
        height: largura * 1.37,
        backgroundColor: cor.blue,
        borderTopLeftRadius: 3,
        borderBottomLeftRadius: 3,
        borderTopRightRadius: 10,
        borderBottomRightRadius: 10,
        borderLeftWidth: 6,
        borderLeftColor: '#005B73',
        padding: 6,
        justifyContent: 'center',
      }}
    >
      <Text numberOfLines={4} style={{ fontFamily: fonte.livroSemi, fontSize: largura > 50 ? 15 : 9, color: cor.paperRaised, textAlign: 'center' }}>
        {titulo}
      </Text>
    </View>
  );
}

export function Inicio({ navigation }: Props<'Inicio'>) {
  const { dados } = useLoja();
  const [status, setStatus] = useState<Record<string, StatusAudio>>({});
  const [ondeGuardar, setOndeGuardar] = useState(false);
  const [guardar, setGuardar] = useState<string | null>(null);
  useFocusEffect(
    useCallback(() => {
      statusDosAudios().then(setStatus);
    }, []),
  );

  const rascunhos = dados.audios.filter((a) => a.livroId === null);
  const livroPadrao: Livro | undefined = dados.livros[0];

  return (
    <Tela
      rodape={
        <>
          <BotaoPrincipal rotulo="Gravar uma história" icone={Mic} alto onPress={() => setOndeGuardar(true)} />
          <SeloPrivacidade />
        </>
      }
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: espaco.tela, height: 64 }}>
        <Text style={{ fontFamily: fonte.livroItalico, fontSize: 18, color: cor.tawnyInk }}>Granny Memories</Text>
        <Pressable
          onPress={() => navigation.navigate('Configuracao')}
          style={({ pressed }) => [{ height: tamanho.toque, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, borderRadius: raio.botao }, pressed && { backgroundColor: cor.paperPressed }]}
        >
          <SlidersHorizontal color={cor.ink} size={22} strokeWidth={2} />
          <Text style={tipo.buttonSmall}>Ajustes</Text>
        </Pressable>
      </View>
      <View style={[e.conteudo, { gap: espaco[5] }]}>
        <Text style={tipo.display}>Meus livros</Text>

        {dados.livros.length === 0 && <Text style={[tipo.bookCard, { fontSize: 22, lineHeight: 31 }]}>Você ainda não tem livros.</Text>}
        {dados.livros.map((l) => {
          const caps = dados.capitulos.filter((c) => c.livroId === l.id).length;
          const auds = dados.audios.filter((a) => a.livroId === l.id).length;
          return (
            <Pressable
              key={l.id}
              onPress={() => navigation.navigate('Livro', { livroId: l.id })}
              style={({ pressed }) => [e.cartao, { flexDirection: 'row', gap: espaco[4], alignItems: 'center' }, pressed && { backgroundColor: cor.paperPressed }]}
            >
              <Capa titulo={l.titulo} />
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={{ fontFamily: fonte.livroSemi, fontSize: 24, lineHeight: 30, color: cor.ink }}>{l.titulo}</Text>
                <Text style={[tipo.body, { color: cor.inkSoft, fontSize: 16 }]}>
                  {caps} {caps === 1 ? 'capítulo' : 'capítulos'} · {auds} {auds === 1 ? 'áudio' : 'áudios'}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={[tipo.buttonSmall, { color: cor.tawnyInk, fontSize: 16 }]}>Abrir o livro</Text>
                  <ChevronRight color={cor.tawnyInk} size={20} />
                </View>
              </View>
            </Pressable>
          );
        })}
        <BotaoSecundario rotulo="Começar um livro novo" tracejado onPress={() => toast('Em breve: por enquanto, um livro por vez.')} />

        <View style={{ gap: espaco[2] }}>
          <Text style={tipo.section}>Rascunhos sem livro</Text>
          <Text style={[tipo.body, { color: cor.inkSoft }]}>Áudios que ainda não estão em nenhum livro.</Text>
        </View>
        {rascunhos.length === 0 ? (
          <Text style={[tipo.body, { color: cor.inkSoft }]}>Nenhum rascunho solto agora.</Text>
        ) : (
          rascunhos.map((a) => (
            <View key={a.id} style={[e.cartao, { gap: espaco[2] }]}>
              <Text style={[tipo.small, { color: cor.inkSoft }]}>
                {rotuloAudio(a.id)}
                {a.duracao ? ` · ${a.duracao}` : ''} · {ROTULO_STATUS[status[a.id] ?? 'queued']}
              </Text>
              <Text style={{ fontFamily: fonte.livroSemi, fontSize: 21, lineHeight: 28, color: cor.ink }}>{a.nome}</Text>
              <BotaoSecundario rotulo="Guardar em um livro" icone={BookOpen} altura={48} onPress={() => setGuardar(a.id)} />
            </View>
          ))
        )}
      </View>

      <Folha visivel={ondeGuardar} onFechar={() => setOndeGuardar(false)} titulo="Onde guardar esta história?">
        {livroPadrao && (
          <Pressable
            onPress={() => {
              setOndeGuardar(false);
              navigation.navigate('Gravar', { livroId: livroPadrao.id });
            }}
            style={[e.cartao, { flexDirection: 'row', gap: espaco[4], alignItems: 'center' }]}
          >
            <Capa titulo={livroPadrao.titulo} largura={40} />
            <View style={{ flex: 1 }}>
              <Text style={tipo.buttonSecondary}>{livroPadrao.titulo}</Text>
              <Text style={[tipo.body, { color: cor.inkSoft }]}>Você escolhe o capítulo depois</Text>
            </View>
          </Pressable>
        )}
        <Pressable
          onPress={() => {
            setOndeGuardar(false);
            navigation.navigate('Gravar', { livroId: null });
          }}
          style={[e.cartao, { borderStyle: 'dashed', borderWidth: 2, borderColor: cor.inkBorder }]}
        >
          <Text style={tipo.buttonSecondary}>Rascunho sem livro</Text>
          <Text style={[tipo.body, { color: cor.inkSoft }]}>Fica guardado até você decidir</Text>
        </Pressable>
        <BotaoSecundario rotulo="Cancelar" onPress={() => setOndeGuardar(false)} />
      </Folha>

      <Folha visivel={!!guardar} onFechar={() => setGuardar(null)} titulo="Guardar em um livro">
        {guardar && livroPadrao && (
          <>
            <Text style={tipo.body}>
              {rotuloAudio(guardar)} · {dados.audios.find((a) => a.id === guardar)?.nome}
            </Text>
            <View style={[e.cartao, { flexDirection: 'row', gap: espaco[4], alignItems: 'center' }]}>
              <Capa titulo={livroPadrao.titulo} largura={40} />
              <Text style={tipo.buttonSecondary}>{livroPadrao.titulo}</Text>
            </View>
            <BotaoPrincipal
              rotulo="Guardar e escolher o capítulo"
              onPress={() => {
                const id = guardar;
                setGuardar(null);
                navigation.navigate('Livro', { livroId: livroPadrao.id, guardarAudio: id });
              }}
            />
          </>
        )}
      </Folha>
    </Tela>
  );
}
