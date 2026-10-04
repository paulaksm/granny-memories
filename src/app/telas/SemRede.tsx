// Erro de rede na transcrição. Sem fila automática: "Tentar agora" reenvia.
import { CloudOff } from 'lucide-react-native';
import { Text, View } from 'react-native';
import { BotaoPrincipal, BotaoSecundario, Cabecalho, e, Tag, Tela } from '../componentes';
import { rotuloAudio, useLoja } from '../loja';
import type { Props } from '../navegacao';
import { cor, espaco, fonte, tipo } from '../tema';

export function SemRede({ route, navigation }: Props<'SemRede'>) {
  const { audioId } = route.params;
  const { dados } = useLoja();
  const audio = dados.audios.find((a) => a.id === audioId);
  const voltar = () =>
    audio?.livroId ? navigation.navigate('Livro', { livroId: audio.livroId }) : navigation.navigate('Inicio');
  return (
    <Tela
      rodape={
        <>
          <BotaoPrincipal rotulo="Voltar para o livro" onPress={voltar} />
          <BotaoSecundario
            rotulo="Tentar agora"
            onPress={() => navigation.replace('Carregando', { tipo: 'transcrever', alvo: audioId })}
          />
        </>
      }
    >
      <Cabecalho onVoltar={voltar} />
      <View style={[e.conteudo, { gap: espaco[5] }]}>
        <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: cor.errorTint, alignItems: 'center', justifyContent: 'center' }}>
          <CloudOff color={cor.error} size={36} strokeWidth={2} />
        </View>
        <Text style={tipo.title}>Sem internet</Text>
        <Text style={tipo.bodyLarge}>
          Sem internet. O áudio ficou guardado na fila. Quando voltar a ficar online, toque em “Tentar agora”.
        </Text>
        <View style={[e.cartao, { gap: espaco[2] }]}>
          <Text style={[tipo.small, { color: cor.inkSoft }]}>
            {rotuloAudio(audioId)}
            {audio?.duracao ? ` · ${audio.duracao}` : ''}
          </Text>
          <Text style={{ fontFamily: fonte.livroSemi, fontSize: 21, color: cor.ink }}>{audio?.nome}</Text>
          <Tag tipo="fila" rotulo="Na fila" />
        </View>
      </View>
    </Tela>
  );
}
