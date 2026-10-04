// Seu jeito de contar (Passo 2 de 4). Só os traços aprovados ("Isso sou eu") entram
// na escrita; o botão principal fica desativado até a autora decidir todos.
import { useFocusEffect } from '@react-navigation/native';
import { Check, Info } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import type { Marcador, Traco } from '../../harness/serializar';
import { Aviso, BlocoTitulo, BotaoPrincipal, Cabecalho, e, SeloOrigem, Tela, toast } from '../componentes';
import { decidirTraco, lerVoz } from '../leitura';
import { capituloDoAudio, rotuloAudio, useLoja } from '../loja';
import type { Props } from '../navegacao';
import { usarTocador } from '../tocador';
import { cor, espaco, OPACIDADE_DESATIVADO, raio, tamanho, tipo } from '../tema';

const rotuloFonte = (fonte: string) => {
  const m = /^(audio-\d+)\s*\[([\d:]+)\]/.exec(fonte);
  return m ? { audio: m[1], marca: m[2], rotulo: `${rotuloAudio(m[1])} · ${m[2]}` } : null;
};

function CartaoTraco({ t, onDecidir }: { t: Traco; onDecidir: (m: Marcador) => void }) {
  const f = rotuloFonte(t.fonte);
  const tocador = usarTocador(f?.audio);
  const aprovado = t.marcador === 'x';
  const recusado = t.marcador === '-';
  return (
    <View style={[e.cartao, { borderWidth: 2, borderColor: aprovado ? cor.tawny : cor.line, gap: 14 }]}>
      <View style={{ gap: 14, opacity: recusado ? OPACIDADE_DESATIVADO : 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: espaco[2] }}>
          <Text style={[tipo.small, { color: cor.tawnyInk, textTransform: 'uppercase' }]}>{t.nome}</Text>
          {aprovado && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: cor.tawny, borderRadius: raio.pilula, paddingHorizontal: 10, height: 26 }}>
              <Check color={cor.onAccent} size={16} strokeWidth={3} />
              <Text style={[tipo.small, { color: cor.onAccent }]}>É você</Text>
            </View>
          )}
        </View>
        <Text style={[tipo.body, { fontSize: 18, lineHeight: 26 }]}>{t.traco}</Text>
        <Text style={tipo.traitQuote}>“{t.evidencia}”</Text>
        {f && <SeloOrigem rotulo={f.rotulo} onPress={() => tocador.tocar(Number(f.marca.split(':')[0]) * 60 + Number(f.marca.split(':')[1]))} />}
      </View>
      {recusado ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={[tipo.buttonSmall, { color: cor.inkMuted }]}>Este traço não será usado</Text>
          <Pressable onPress={() => onDecidir(' ')} style={{ minHeight: tamanho.toque, justifyContent: 'center' }}>
            <Text style={[tipo.buttonSmall, { color: cor.tawnyInk, textDecorationLine: 'underline' }]}>Desfazer</Text>
          </Pressable>
        </View>
      ) : (
        <View style={{ flexDirection: 'row', gap: espaco[3] }}>
          <Pressable
            onPress={() => onDecidir(aprovado ? ' ' : 'x')}
            style={[botaoTraco, aprovado && { backgroundColor: cor.tawny, borderColor: cor.tawny }]}
          >
            <Text numberOfLines={1} style={[tipo.buttonSmall, aprovado && { color: cor.onAccent }]}>Isso sou eu</Text>
          </Pressable>
          <Pressable onPress={() => onDecidir('-')} style={botaoTraco}>
            <Text numberOfLines={1} style={tipo.buttonSmall}>Não sou eu</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const botaoTraco = {
  flex: 1,
  height: tamanho.traco,
  borderWidth: 2,
  borderColor: cor.inkBorder,
  borderRadius: raio.campo,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
};

export function Voz({ route, navigation }: Props<'Voz'>) {
  const { origem, audioId, capituloId } = route.params;
  const { dados } = useLoja();
  const [voz, setVoz] = useState<{ tracos: Traco[]; audios: string[] } | null>(null);

  const carregar = useCallback(() => {
    lerVoz().then(setVoz);
  }, []);
  useFocusEffect(carregar);

  const decidir = async (i: number, m: Marcador) => {
    await decidirTraco(i, m);
    carregar();
  };

  const tracos = voz?.tracos ?? [];
  const todosDecididos = tracos.length > 0 && tracos.every((t) => t.marcador !== ' ');
  const nenhumAprovado = todosDecididos && !tracos.some((t) => t.marcador === 'x');
  const n = voz?.audios.length ?? 0;

  const usar = () => {
    if (origem === 'ajustes') {
      navigation.navigate('Configuracao');
      toast('Seu jeito de contar foi salvo.');
    } else if (origem === 'capitulo' && capituloId) {
      navigation.navigate('Capitulo', { capituloId });
    } else if (audioId) {
      navigation.navigate('Ideias', { audioId });
    }
  };

  return (
    <Tela
      rodape={
        <>
          {!todosDecididos && tracos.length > 0 && (
            <Text style={[tipo.body, { color: cor.inkSoft, textAlign: 'center' }]}>
              Responda cada cartão para continuar.
            </Text>
          )}
          <BotaoPrincipal rotulo="Usar meu jeito de contar" onPress={usar} desativado={!todosDecididos} />
        </>
      }
    >
      <Cabecalho onVoltar={() => navigation.goBack()} />
      <BlocoTitulo
        passo={origem === 'ajustes' ? 'Ajustes' : 'Passo 2 de 4'}
        titulo="Como você conta suas histórias"
        sub={
          n
            ? `Baseado em ${n} ${n === 1 ? 'áudio' : 'áudios'}. Quanto mais você gravar, mais o app aprende.`
            : undefined
        }
      />
      <View style={[e.conteudo, { gap: 14 }]}>
        {n === 1 && (
          <Aviso tom="neutro" icone={Info}>
            Com um áudio só, ainda é um palpite. Confirme o que for seu.
          </Aviso>
        )}
        {voz === null && <Text style={tipo.body}>O app ainda não leu nenhum áudio seu.</Text>}
        {tracos.map((t, i) => (
          <CartaoTraco key={i} t={t} onDecidir={(m) => decidir(i, m)} />
        ))}
        {nenhumAprovado && (
          <Aviso tom="neutro" icone={Info}>
            Nenhum traço foi aprovado. O app vai escrever só com os seus trechos reais como exemplo.
          </Aviso>
        )}
        {audioId && capituloDoAudio(dados, audioId) === undefined && origem === 'fluxo' && (
          <Text style={[tipo.body, { color: cor.inkSoft }]}>
            Este áudio ainda não está em um capítulo. Ele vai para o primeiro capítulo do livro.
          </Text>
        )}
      </View>
    </Tela>
  );
}
