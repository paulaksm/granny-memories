// Livro: linha do tempo, capítulos com ordem por setas, prévia, nome e exclusão.
import { useFocusEffect } from '@react-navigation/native';
import { ArrowDown, ArrowUp, BookOpen, ChevronRight, Mic, Pencil, Trash2 } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import {
  BotaoPrincipal,
  BotaoSecundario,
  Cabecalho,
  Campo,
  e,
  Folha,
  Tela,
  toast,
} from '../componentes';
import {
  type Audio,
  capituloDoAudio,
  definirCapitulo,
  excluirLivro,
  guardarEmLivro,
  moverNoCapitulo,
  renomearLivro,
  rotuloAudio,
  type StatusAudio,
  statusDosAudios,
  useLoja,
} from '../loja';
import type { Props } from '../navegacao';
import { cor, espaco, fonte, raio, tamanho, tipo } from '../tema';

const ROTULO: Record<StatusAudio, string> = { ready: 'Pronto', transcribing: 'Transcrevendo', queued: 'Na fila' };
const ordinal = (n: number) => `${n}º`;

function BotaoSeta({ para, ativo, onPress }: { para: 'cima' | 'baixo'; ativo: boolean; onPress: () => void }) {
  const Ic = para === 'cima' ? ArrowUp : ArrowDown;
  return (
    <Pressable
      accessibilityLabel={para === 'cima' ? 'Subir' : 'Descer'}
      disabled={!ativo}
      onPress={onPress}
      style={{ width: 48, height: 48, borderWidth: 2, borderColor: cor.inkBorder, borderRadius: raio.campo, alignItems: 'center', justifyContent: 'center', opacity: ativo ? 1 : 0.35 }}
    >
      <Ic color={cor.ink} size={22} strokeWidth={2} />
    </Pressable>
  );
}

export function Livro({ route, navigation }: Props<'Livro'>) {
  const { livroId, guardarAudio } = route.params;
  const { dados, tarefa } = useLoja();
  const livro = dados.livros.find((l) => l.id === livroId);
  const capitulos = dados.capitulos.filter((c) => c.livroId === livroId);
  const audios = dados.audios.filter((a) => a.livroId === livroId);
  const [aba, setAba] = useState<'tempo' | 'capitulos'>('tempo');
  const [status, setStatus] = useState<Record<string, StatusAudio>>({});
  const [editarNome, setEditarNome] = useState(false);
  const [nome, setNome] = useState(livro?.titulo ?? '');
  const [excluir, setExcluir] = useState(false);
  const [apagarAudios, setApagarAudios] = useState(false);
  const [capituloDe, setCapituloDe] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      statusDosAudios().then(setStatus);
    }, [tarefa]),
  );
  useEffect(() => {
    statusDosAudios().then(setStatus);
  }, [tarefa, dados]);
  useEffect(() => {
    if (guardarAudio) {
      guardarEmLivro(guardarAudio, livroId).then(() => setCapituloDe(guardarAudio));
      navigation.setParams({ guardarAudio: undefined });
    }
  }, [guardarAudio, livroId, navigation]);

  if (!livro) {
    return (
      <Tela>
        <Cabecalho onVoltar={() => navigation.navigate('Inicio')} />
      </Tela>
    );
  }

  const abrirAudio = (a: Audio) => {
    const s = status[a.id];
    if (s === 'ready') navigation.navigate('Transcricao', { audioId: a.id });
    else if (s === 'transcribing') navigation.navigate('Carregando', { tipo: 'transcrever', alvo: a.id });
    else if (!tarefa) navigation.navigate('Carregando', { tipo: 'transcrever', alvo: a.id });
    else toast(`O ${rotuloAudio(a.id)} está na fila. Ele será transcrito depois do áudio atual.`);
  };

  const botaoCapitulo = (a: Audio) => {
    const cap = capituloDoAudio(dados, a.id);
    if (cap) {
      const pos = cap.audios.indexOf(a.id) + 1;
      return (
        <BotaoSecundario
          rotulo={`${cap.titulo} · ${ordinal(pos)} de ${cap.audios.length}`}
          icone={BookOpen}
          altura={48}
          onPress={() => setCapituloDe(a.id)}
          estilo={{ alignSelf: 'flex-start' }}
        />
      );
    }
    return (
      <BotaoSecundario
        rotulo="Escolher o capítulo"
        tracejado
        corBorda={cor.tawny}
        corTexto={cor.tawnyInk}
        fundo={cor.tawnyTint}
        altura={48}
        onPress={() => setCapituloDe(a.id)}
        estilo={{ alignSelf: 'flex-start' }}
      />
    );
  };

  const semCapitulo = audios.filter((a) => !capituloDoAudio(dados, a.id));
  const capAtual = capituloDe ? capituloDoAudio(dados, capituloDe) : undefined;

  return (
    <Tela rodape={<BotaoPrincipal rotulo="Gravar para este livro" icone={Mic} onPress={() => navigation.navigate('Gravar', { livroId })} />}>
      <Cabecalho onVoltar={() => navigation.navigate('Inicio')} />
      <View style={[e.conteudo, { gap: espaco[4] }]}>
        <View style={{ gap: 6 }}>
          <Text style={[tipo.small, { color: cor.tawnyInk }]}>Livro</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: espaco[3] }}>
            <Text style={[tipo.bookTitle, { flex: 1 }]}>{livro.titulo}</Text>
            <Pressable
              accessibilityLabel="Mudar o nome do livro"
              onPress={() => {
                setNome(livro.titulo);
                setEditarNome(true);
              }}
              style={{ width: 48, height: 48, borderWidth: 2, borderColor: cor.inkBorder, borderRadius: raio.campo, alignItems: 'center', justifyContent: 'center' }}
            >
              <Pencil color={cor.ink} size={20} strokeWidth={2} />
            </Pressable>
          </View>
          <Text style={[tipo.body, { color: cor.inkSoft }]}>
            {capitulos.length} {capitulos.length === 1 ? 'capítulo' : 'capítulos'} · {audios.length}{' '}
            {audios.length === 1 ? 'áudio' : 'áudios'}
          </Text>
        </View>

        <Pressable
          onPress={() => navigation.navigate('Previa', { livroId })}
          style={({ pressed }) => [e.cartao, { flexDirection: 'row', alignItems: 'center', gap: espaco[4] }, pressed && { backgroundColor: cor.paperPressed }]}
        >
          <View style={{ width: 54, height: 70, backgroundColor: cor.paperPage, borderWidth: 1, borderColor: cor.line, padding: 6, gap: 4 }}>
            <Text style={{ fontFamily: fonte.livroSemi, fontSize: 18, color: cor.tawny, lineHeight: 20 }}>T</Text>
            {[1, 2, 3].map((i) => (
              <View key={i} style={{ height: 3, backgroundColor: cor.line, borderRadius: 2 }} />
            ))}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[tipo.buttonSecondary, { fontSize: 19 }]}>Ver prévia do livro</Text>
            <Text style={[tipo.body, { color: cor.inkSoft }]}>Como o livro está hoje, na sua voz.</Text>
          </View>
          <ChevronRight color={cor.ink} size={22} />
        </Pressable>

        <View style={{ flexDirection: 'row', height: tamanho.abas, backgroundColor: cor.tagNeutral, borderRadius: raio.botao, padding: 4 }}>
          {(['tempo', 'capitulos'] as const).map((a) => (
            <Pressable
              key={a}
              onPress={() => setAba(a)}
              style={[{ flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 10 }, aba === a && { backgroundColor: cor.paperRaised, elevation: 1 }]}
            >
              <Text style={tipo.buttonSmall}>{a === 'tempo' ? 'Linha do tempo' : 'Capítulos'}</Text>
            </Pressable>
          ))}
        </View>

        {aba === 'tempo' ? (
          <View style={{ gap: espaco[2] }}>
            <Text style={[tipo.body, { color: cor.inkSoft }]}>Na ordem em que você gravou.</Text>
            {audios.length === 0 && (
              <Text style={[tipo.bookCard, { fontSize: 22 }]}>Conte a primeira história. Pode ser curta.</Text>
            )}
            {audios.map((a, i) => {
              const s = status[a.id] ?? 'queued';
              return (
                <View key={a.id} style={{ flexDirection: 'row', gap: espaco[4] }}>
                  <View style={{ alignItems: 'center', width: 16 }}>
                    <View
                      style={[
                        { width: 16, height: 16, borderRadius: 8, marginTop: 8 },
                        s === 'ready' && { backgroundColor: cor.green },
                        s === 'transcribing' && { backgroundColor: cor.blue, borderWidth: 5, borderColor: cor.blueTint, width: 26, height: 26, borderRadius: 13, marginTop: 3 },
                        s === 'queued' && { borderWidth: 3, borderColor: cor.inkBorder },
                      ]}
                    />
                    {i < audios.length - 1 && <View style={{ flex: 1, width: 2, backgroundColor: cor.line }} />}
                  </View>
                  <View style={{ flex: 1, gap: espaco[2], paddingBottom: espaco[5] }}>
                    <Pressable onPress={() => abrirAudio(a)}>
                      <Text style={{ fontFamily: fonte.livroSemi, fontSize: 21, lineHeight: 28, color: cor.ink }}>{a.nome}</Text>
                      <Text style={[tipo.small, { color: cor.inkSoft }]}>
                        {rotuloAudio(a.id)}
                        {a.duracao ? ` · ${a.duracao}` : ''} · {ROTULO[s]}
                      </Text>
                    </Pressable>
                    {botaoCapitulo(a)}
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          <View style={{ gap: espaco[5] }}>
            <Text style={[tipo.body, { color: cor.inkSoft }]}>Use as setas para mudar a ordem dos áudios dentro da história.</Text>
            {capitulos.map((c, n) => (
              <View key={c.id} style={{ gap: espaco[3] }}>
                <Pressable onPress={() => navigation.navigate('Capitulo', { capituloId: c.id })}>
                  <Text style={[tipo.small, { color: cor.tawnyInk }]}>Capítulo {n + 1}</Text>
                  <Text style={{ fontFamily: fonte.livroSemi, fontSize: 23, lineHeight: 30, color: cor.ink }}>{c.titulo}</Text>
                </Pressable>
                {c.audios.length === 0 && <Text style={[tipo.body, { color: cor.inkSoft }]}>Nenhum áudio neste capítulo ainda.</Text>}
                {c.audios.map((id, i) => {
                  const a = dados.audios.find((x) => x.id === id);
                  return (
                    <View key={id} style={{ flexDirection: 'row', alignItems: 'center', gap: espaco[3] }}>
                      <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: cor.ink, alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={[tipo.small, { color: cor.paper }]}>{i + 1}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontFamily: fonte.livroSemi, fontSize: 19, lineHeight: 25, color: cor.ink }}>{a?.nome}</Text>
                        <Text style={[tipo.small, { color: cor.inkSoft }]}>{rotuloAudio(id)}</Text>
                      </View>
                      <BotaoSeta para="cima" ativo={i > 0} onPress={() => moverNoCapitulo(c.id, id, -1)} />
                      <BotaoSeta para="baixo" ativo={i < c.audios.length - 1} onPress={() => moverNoCapitulo(c.id, id, 1)} />
                    </View>
                  );
                })}
              </View>
            ))}
            {semCapitulo.length > 0 && (
              <View style={{ gap: espaco[3] }}>
                <Text style={[tipo.small, { color: cor.tawnyInk }]}>Sem capítulo · Ainda sem lugar</Text>
                {semCapitulo.map((a) => (
                  <View key={a.id} style={{ flexDirection: 'row', alignItems: 'center', gap: espaco[3] }}>
                    <Text style={{ flex: 1, fontFamily: fonte.livroSemi, fontSize: 19, color: cor.ink }}>{a.nome}</Text>
                    <BotaoSecundario rotulo="Escolher" altura={48} onPress={() => setCapituloDe(a.id)} />
                  </View>
                ))}
              </View>
            )}
            <BotaoSecundario rotulo="Novo capítulo" tracejado onPress={() => toast('Em breve: novos capítulos.')} />
          </View>
        )}

        <View style={{ height: 1, backgroundColor: cor.line, marginTop: espaco[5] }} />
        <BotaoSecundario rotulo="Excluir este livro" icone={Trash2} corBorda={cor.error} corTexto={cor.error} onPress={() => setExcluir(true)} />
      </View>

      <Folha visivel={editarNome} onFechar={() => setEditarNome(false)} titulo="Nome do livro">
        <Campo valor={nome} onChange={setNome} livro />
        <BotaoPrincipal
          rotulo="Salvar nome"
          desativado={!nome.trim()}
          onPress={async () => {
            await renomearLivro(livroId, nome.trim());
            setEditarNome(false);
            toast('Nome do livro salvo.');
          }}
        />
        <BotaoSecundario rotulo="Cancelar" onPress={() => setEditarNome(false)} />
      </Folha>

      <Folha visivel={!!capituloDe} onFechar={() => setCapituloDe(null)} titulo="Em qual capítulo?">
        {capituloDe && (
          <>
            {[...capitulos.map((c) => ({ id: c.id as string | null, t: c.titulo, s: `${c.audios.length} ${c.audios.length === 1 ? 'áudio' : 'áudios'}` })), { id: null, t: 'Sem capítulo', s: 'Decido depois' }].map((op) => {
              const marcado = (capAtual?.id ?? null) === op.id;
              return (
                <Pressable
                  key={op.id ?? 'nenhum'}
                  onPress={() => definirCapitulo(capituloDe, op.id)}
                  style={{ minHeight: 60, flexDirection: 'row', alignItems: 'center', gap: espaco[3], borderWidth: 2, borderColor: marcado ? cor.tawny : cor.line, borderRadius: raio.botao, paddingHorizontal: espaco[4] }}
                >
                  <View style={{ width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: cor.inkBorder, alignItems: 'center', justifyContent: 'center' }}>
                    {marcado && <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: cor.tawny }} />}
                  </View>
                  <View>
                    <Text style={tipo.buttonSmall}>{op.t}</Text>
                    <Text style={[tipo.body, { color: cor.inkSoft, fontSize: 15 }]}>{op.s}</Text>
                  </View>
                </Pressable>
              );
            })}
            {capAtual && (
              <View style={{ gap: espaco[2] }}>
                <Text style={tipo.section}>Ordem dentro do capítulo</Text>
                {capAtual.audios.map((id, i) => (
                  <View key={id} style={[{ flexDirection: 'row', alignItems: 'center', gap: espaco[3], padding: espaco[2], borderRadius: raio.campo }, id === capituloDe && { backgroundColor: cor.tawnyTint }]}>
                    <Text style={[tipo.small, { width: 24 }]}>{i + 1}</Text>
                    <Text style={[tipo.body, { flex: 1 }]}>{dados.audios.find((a) => a.id === id)?.nome}</Text>
                    {id === capituloDe && (
                      <>
                        <BotaoSeta para="cima" ativo={i > 0} onPress={() => moverNoCapitulo(capAtual.id, id, -1)} />
                        <BotaoSeta para="baixo" ativo={i < capAtual.audios.length - 1} onPress={() => moverNoCapitulo(capAtual.id, id, 1)} />
                      </>
                    )}
                  </View>
                ))}
              </View>
            )}
            <BotaoPrincipal rotulo="Pronto" onPress={() => setCapituloDe(null)} />
          </>
        )}
      </Folha>

      <Folha visivel={excluir} onFechar={() => setExcluir(false)} titulo={`Excluir "${livro.titulo}"?`}>
        <Trash2 color={cor.error} size={32} />
        <Text style={tipo.body}>
          O que fazer com os {audios.length} {audios.length === 1 ? 'áudio' : 'áudios'} deste livro?
        </Text>
        {[
          { v: false, t: 'Excluir só o livro', s: 'Os áudios voltam para Rascunhos sem livro.' },
          { v: true, t: 'Excluir o livro e os áudios', s: 'Os áudios e os textos saem do seu celular. Não dá para desfazer.' },
        ].map((op) => (
          <Pressable
            key={String(op.v)}
            onPress={() => setApagarAudios(op.v)}
            style={{ minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: espaco[3], borderWidth: 2, borderColor: apagarAudios === op.v ? cor.error : cor.line, borderRadius: raio.botao, padding: espaco[3] }}
          >
            <View style={{ width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: cor.inkBorder, alignItems: 'center', justifyContent: 'center' }}>
              {apagarAudios === op.v && <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: cor.error }} />}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={tipo.buttonSmall}>{op.t}</Text>
              <Text style={[tipo.body, { color: cor.inkSoft, fontSize: 15 }]}>{op.s}</Text>
            </View>
          </Pressable>
        ))}
        <Pressable
          onPress={async () => {
            await excluirLivro(livroId, apagarAudios);
            setExcluir(false);
            navigation.navigate('Inicio');
            toast('Livro excluído.');
          }}
          style={{ height: tamanho.principal, backgroundColor: cor.error, borderRadius: raio.botao, alignItems: 'center', justifyContent: 'center' }}
        >
          <Text style={[tipo.button, { color: cor.onAccent }]}>{apagarAudios ? 'Excluir o livro e os áudios' : 'Excluir só o livro'}</Text>
        </Pressable>
        <BotaoSecundario rotulo="Cancelar" onPress={() => setExcluir(false)} />
      </Folha>
    </Tela>
  );
}

