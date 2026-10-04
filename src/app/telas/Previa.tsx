// Prévia do livro: capa, sumário e uma página por capítulo, na ordem do Livro.
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { BotaoPrincipal, BotaoSecundario, Cabecalho, e, SeloOrigem, Tag, Tela } from '../componentes';
import { type CapituloTela, type Ideia, lerCapitulo, lerIdeias } from '../leitura';
import { rotuloAudio, type StatusAudio, statusDosAudios, useLoja } from '../loja';
import type { Props } from '../navegacao';
import { cor, espaco, fonte, raio, tipo } from '../tema';

export function Previa({ route, navigation }: Props<'Previa'>) {
  const { livroId } = route.params;
  const { dados, versao } = useLoja();
  const livro = dados.livros.find((l) => l.id === livroId);
  const capitulos = dados.capitulos.filter((c) => c.livroId === livroId);
  const [textos, setTextos] = useState<Record<string, CapituloTela | null>>({});
  const [ideias, setIdeias] = useState<Record<string, Ideia>>({});
  const [status, setStatus] = useState<Record<string, StatusAudio>>({});
  const [pagina, setPagina] = useState(0);

  useFocusEffect(
    useCallback(() => {
      Promise.all(capitulos.map(async (c) => [c.id, await lerCapitulo(c.id)] as const)).then((l) =>
        setTextos(Object.fromEntries(l)),
      );
      lerIdeias().then((l) => setIdeias(Object.fromEntries(l.map((i) => [i.id, i]))));
      statusDosAudios().then(setStatus);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [livroId, versao]),
  );

  const total = capitulos.length + 2;
  const estadoCap = (id: string) => {
    const c = capitulos.find((x) => x.id === id)!;
    const t = textos[id];
    if (t) return t.status === 'aprovado' ? { tag: 'aprovado' as const, r: 'Aprovado' } : { tag: 'rascunho' as const, r: 'Rascunho' };
    if (c.audios.length === 0) return { tag: 'neutro' as const, r: 'Sem áudios' };
    return { tag: 'fila' as const, r: 'Esperando a transcrição' };
  };

  const conteudo = () => {
    if (pagina === 0) {
      return (
        <View style={{ alignItems: 'center', gap: espaco[4], paddingVertical: espaco[7] }}>
          <Text style={[tipo.small, { color: cor.inkSoft }]}>Prévia de hoje</Text>
          <Text style={{ fontFamily: fonte.livroSemi, fontSize: 46, lineHeight: 52, color: cor.ink, textAlign: 'center' }}>{livro?.titulo}</Text>
          <View style={{ width: 48, height: 3, backgroundColor: cor.tawny }} />
          <Text style={[tipo.quote, { textAlign: 'center' }]}>Escrito a partir dos seus áudios, na sua voz.</Text>
          <Text style={[tipo.body, { color: cor.inkSoft }]}>
            {capitulos.length} {capitulos.length === 1 ? 'capítulo' : 'capítulos'}
          </Text>
        </View>
      );
    }
    if (pagina === 1) {
      return (
        <View style={{ gap: espaco[3] }}>
          <Text style={tipo.section}>Sumário</Text>
          {capitulos.map((c, i) => {
            const s = estadoCap(c.id);
            return (
              <Pressable key={c.id} onPress={() => setPagina(i + 2)} style={{ gap: 6, paddingVertical: espaco[2], borderBottomWidth: 1, borderBottomColor: cor.line }}>
                <View style={{ flexDirection: 'row' }}>
                  <Text style={[tipo.bookCard, { flex: 1 }]}>
                    {i + 1}. {textos[c.id]?.titulo || c.titulo}
                  </Text>
                  <Text style={tipo.bookCard}>{i + 3}</Text>
                </View>
                <Tag tipo={s.tag} rotulo={s.r} />
              </Pressable>
            );
          })}
        </View>
      );
    }
    const c = capitulos[pagina - 2];
    const t = textos[c.id];
    const pendentes = c.audios.filter((a) => status[a] !== 'ready');
    return (
      <View style={{ gap: espaco[3] }}>
        <Text style={[tipo.small, { color: cor.tawnyInk, letterSpacing: 1 }]}>CAPÍTULO {pagina - 1}</Text>
        <Text style={tipo.bookTitle}>{t?.titulo || c.titulo}</Text>
        {!t && <Text style={[tipo.body, { color: cor.inkSoft }]}>Este capítulo ainda não foi escrito.</Text>}
        {t?.passagens.map((p, i) => (
          <View key={i} style={{ gap: 4 }}>
            <Text style={tipo.book}>
              {i === 0 ? (
                <>
                  <Text style={{ fontFamily: fonte.livroSemi, fontSize: 62, lineHeight: 62, color: cor.tawny }}>{p.texto[0]}</Text>
                  {p.texto.slice(1)}
                </>
              ) : (
                `      ${p.texto}`
              )}
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: espaco[2] }}>
              {p.atomos.map((id) => (ideias[id] ? <SeloOrigem key={id} rotulo={`${rotuloAudio(ideias[id].audio)} · ${ideias[id].inicio}`} /> : null))}
            </View>
          </View>
        ))}
        {t?.perguntas
          .filter((q) => q.aberta)
          .map((q, i) => (
            <View key={i} style={{ backgroundColor: cor.gap, borderColor: cor.gapLine, borderWidth: 2, borderRadius: raio.campo, padding: espaco[3], gap: 6 }}>
              <Text style={[tipo.small, { color: cor.gapInk }]}>Falta uma parte</Text>
              <Text style={[tipo.body, { color: cor.gapInk }]}>{q.texto}</Text>
              <Pressable onPress={() => navigation.navigate('Capitulo', { capituloId: c.id })}>
                <Text style={[tipo.buttonSmall, { color: cor.tawnyInk, textDecorationLine: 'underline' }]}>Ver no capítulo</Text>
              </Pressable>
            </View>
          ))}
        {pendentes.map((a) => (
          <Text key={a} style={[tipo.body, { color: cor.inkSoft }]}>
            O {rotuloAudio(a)} · {dados.audios.find((x) => x.id === a)?.nome} ainda não foi transcrito…
          </Text>
        ))}
      </View>
    );
  };

  return (
    <Tela
      fundo={cor.desk}
      rodape={
        <View style={{ flexDirection: 'row', gap: espaco[3] }}>
          <BotaoSecundario rotulo="Anterior" onPress={() => setPagina((p) => Math.max(0, p - 1))} desativado={pagina === 0} estilo={{ flex: 1 }} />
          <BotaoPrincipal rotulo="Próxima página" onPress={() => setPagina((p) => Math.min(total - 1, p + 1))} desativado={pagina === total - 1} estilo={{ flex: 1.7 }} />
        </View>
      }
    >
      <Cabecalho onVoltar={() => navigation.navigate('Livro', { livroId })} titulo="Prévia do livro" />
      <View style={[e.conteudo]}>
        <View style={{ backgroundColor: cor.paperPage, borderTopLeftRadius: 4, borderBottomLeftRadius: 4, borderTopRightRadius: 10, borderBottomRightRadius: 10, padding: espaco[5], gap: espaco[4], elevation: 2, borderBottomWidth: 2, borderBottomColor: '#DCCAC7' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontFamily: fonte.livroItalico, fontSize: 15, color: cor.inkSoft }}>{livro?.titulo}</Text>
            <Text style={{ fontFamily: fonte.livroItalico, fontSize: 15, color: cor.inkSoft }}>
              Página {pagina + 1} de {total}
            </Text>
          </View>
          {conteudo()}
          <Text style={[tipo.body, { textAlign: 'center', color: cor.inkSoft }]}>{pagina + 1}</Text>
        </View>
      </View>
    </Tela>
  );
}
