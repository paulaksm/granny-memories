// Ideias (Passo 3 de 4). Na interface são sempre "ideias", nunca "átomos".
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { BlocoTitulo, BotaoPilula, BotaoPrincipal, Cabecalho, e, SeloOrigem, Tela } from '../componentes';
import { type Ideia, lerIdeias, segundosDe } from '../leitura';
import { capituloDoAudio, definirCapitulo, lerEstado, rotuloAudio, useLoja } from '../loja';
import type { Props } from '../navegacao';
import { usarTocador } from '../tocador';
import { cor, espaco, raio, tamanho, tipo } from '../tema';

const TIPOS: Record<string, string> = {
  história: 'História',
  fato: 'Fato',
  opinião: 'Opinião',
  argumento: 'Argumento',
  citação: 'Citação',
  descrição: 'Descrição',
};

function CartaoIdeia({ ideia }: { ideia: Ideia }) {
  const [aberto, setAberto] = useState(false);
  const tocador = usarTocador(ideia.audio);
  return (
    <Pressable onPress={() => setAberto(!aberto)} style={e.cartao} accessibilityRole="button">
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ backgroundColor: cor.tagNeutral, height: tamanho.tag, borderRadius: raio.pilula, paddingHorizontal: 12, justifyContent: 'center' }}>
          <Text style={[tipo.small, { color: cor.inkMuted }]}>{TIPOS[ideia.tipo] ?? ideia.tipo}</Text>
        </View>
        <Text style={[tipo.small, { color: cor.tawnyInk }]}>{aberto ? 'Fechar' : 'Ver trecho'}</Text>
      </View>
      <Text style={tipo.bookCard}>{ideia.resumo}</Text>
      <SeloOrigem rotulo={`${rotuloAudio(ideia.audio)} · ${ideia.inicio}`} onPress={() => setAberto(true)} />
      {aberto && (
        <View style={{ backgroundColor: cor.paper, borderRadius: raio.campo, padding: espaco[4], gap: espaco[3] }}>
          <Text style={[tipo.small, { color: cor.inkSoft }]}>Trecho original</Text>
          <Text style={tipo.quote}>{ideia.original}</Text>
          <BotaoPilula
            rotulo={tocador.tocando ? 'Tocando…' : 'Ouvir o áudio'}
            onPress={() => tocador.tocar(segundosDe(ideia.inicio))}
          />
        </View>
      )}
    </Pressable>
  );
}

export function Ideias({ route, navigation }: Props<'Ideias'>) {
  const { audioId } = route.params;
  useLoja();
  const [ideias, setIdeias] = useState<Ideia[]>([]);
  useFocusEffect(
    useCallback(() => {
      lerIdeias([audioId]).then(setIdeias);
    }, [audioId]),
  );

  const escrever = async () => {
    const d = lerEstado().dados;
    let cap = capituloDoAudio(d, audioId);
    if (!cap) {
      const audio = d.audios.find((a) => a.id === audioId);
      const livroId = audio?.livroId ?? d.livros[0]?.id;
      const primeiro = d.capitulos.find((c) => c.livroId === livroId);
      if (primeiro) {
        await definirCapitulo(audioId, primeiro.id);
        cap = primeiro;
      }
    }
    if (cap) navigation.navigate('Carregando', { tipo: 'escrever', alvo: cap.id });
  };

  return (
    <Tela rodape={<BotaoPrincipal rotulo="Escrever o capítulo" onPress={escrever} desativado={ideias.length === 0} />}>
      <Cabecalho onVoltar={() => navigation.goBack()} />
      <BlocoTitulo
        passo="Passo 3 de 4"
        titulo="Ideias"
        sub={`O app separou ${ideias.length} ${ideias.length === 1 ? 'ideia' : 'ideias'}. Toque em uma para ver o trecho original.`}
      />
      <View style={[e.conteudo, { gap: 14 }]}>
        {ideias.map((i) => (
          <CartaoIdeia key={i.id} ideia={i} />
        ))}
      </View>
    </Tela>
  );
}
