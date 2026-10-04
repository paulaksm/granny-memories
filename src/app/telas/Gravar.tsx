// Gravar ou escolher um áudio (sem tela no protótipo; versão simples com os tokens).
import * as DocumentPicker from 'expo-document-picker';
import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import { FolderOpen, Mic, Square } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Aviso, BlocoTitulo, BotaoPrincipal, BotaoSecundario, Cabecalho, Campo, e, Tela } from '../componentes';
import { importarAudio } from '../loja';
import type { Props } from '../navegacao';
import { cor, espaco, tipo } from '../tema';

const relogio = (ms: number) => {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

export function Gravar({ route, navigation }: Props<'Gravar'>) {
  const { livroId } = route.params;
  const gravador = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const estado = useAudioRecorderState(gravador, 250);
  const [nome, setNome] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [gravado, setGravado] = useState<string | null>(null);

  const comecar = async () => {
    setErro(null);
    const p = await requestRecordingPermissionsAsync();
    if (!p.granted) return setErro('Sem permissão para usar o microfone.');
    await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
    await gravador.prepareToRecordAsync();
    gravador.record();
  };

  const parar = async () => {
    await gravador.stop();
    await setAudioModeAsync({ allowsRecording: false });
    setGravado(gravador.uri);
  };

  const guardar = async (uri: string, nomeArquivo?: string) => {
    const id = await importarAudio(uri, nome.trim() || (nomeArquivo ?? '').replace(/\.[^.]+$/, ''), livroId);
    navigation.replace('Carregando', { tipo: 'transcrever', alvo: id, livroId: livroId ?? undefined });
  };

  const escolher = async () => {
    const r = await DocumentPicker.getDocumentAsync({ type: 'audio/*', copyToCacheDirectory: true });
    if (r.canceled || !r.assets?.[0]) return;
    await guardar(r.assets[0].uri, r.assets[0].name);
  };

  return (
    <Tela
      rodape={
        gravado ? (
          <BotaoPrincipal rotulo="Guardar e transcrever" onPress={() => guardar(gravado)} />
        ) : (
          <BotaoSecundario rotulo="Escolher um áudio do celular" icone={FolderOpen} onPress={escolher} />
        )
      }
    >
      <Cabecalho onVoltar={() => navigation.goBack()} />
      <BlocoTitulo titulo="Gravar uma história" sub="Conte como se estivesse conversando. Pode ser curta." />
      <View style={[e.conteudo, { alignItems: 'center', gap: espaco[5] }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={estado.isRecording ? 'Parar' : 'Gravar'}
          onPress={estado.isRecording ? parar : comecar}
          style={({ pressed }) => ({
            width: 160,
            height: 160,
            borderRadius: 80,
            backgroundColor: pressed ? cor.tawnyPressed : cor.tawny,
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: espaco[5],
          })}
        >
          {estado.isRecording ? <Square color={cor.onAccent} size={56} fill={cor.onAccent} /> : <Mic color={cor.onAccent} size={64} strokeWidth={2} />}
        </Pressable>
        <Text style={tipo.display}>{relogio(estado.durationMillis)}</Text>
        <Text style={[tipo.body, { color: cor.inkSoft }]}>
          {estado.isRecording ? 'Gravando… toque para parar.' : gravado ? 'Gravação pronta.' : 'Toque para começar.'}
        </Text>
        <View style={{ alignSelf: 'stretch', gap: espaco[2] }}>
          <Text style={tipo.buttonSmall}>Nome da história (opcional)</Text>
          <Campo valor={nome} onChange={setNome} placeholder="Por exemplo: O bolo de laranja" livro />
        </View>
        {erro && <Aviso tom="erro">{erro}</Aviso>}
      </View>
    </Tela>
  );
}
