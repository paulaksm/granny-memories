// Configuração (fora do fluxo): chave da ElevenLabs, jeito de contar, modelo e privacidade.
import * as SecureStore from 'expo-secure-store';
import { ChevronRight, Download } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Aviso, BarraProgresso, BotaoPrincipal, BotaoSecundario, Cabecalho, Campo, e, Tag, Tela } from '../componentes';
import { baixarModelo, CHAVE_ELEVENLABS, TAMANHO_MODELO, useLoja } from '../loja';
import type { Props } from '../navegacao';
import { cor, espaco, tipo } from '../tema';

export function Configuracao({ navigation }: Props<'Configuracao'>) {
  const { modelo, progressoModelo, erro } = useLoja();
  const [chave, setChave] = useState('');
  const [guardada, setGuardada] = useState(false);
  const [mostrar, setMostrar] = useState(false);

  useEffect(() => {
    SecureStore.getItemAsync(CHAVE_ELEVENLABS).then((v) => setGuardada(!!v));
  }, []);

  const salvarChave = async () => {
    await SecureStore.setItemAsync(CHAVE_ELEVENLABS, chave.trim());
    setChave('');
    setGuardada(true);
  };

  return (
    <Tela>
      <Cabecalho onVoltar={() => navigation.navigate('Inicio')} />
      <View style={[e.conteudo, { gap: espaco.secao }]}>
        <Text style={tipo.display}>Ajustes</Text>

        <View style={{ gap: espaco[3] }}>
          <Text style={tipo.section}>Chave da ElevenLabs</Text>
          <Text style={[tipo.body, { color: cor.inkSoft }]}>Serve para transcrever seus áudios.</Text>
          <View style={{ flexDirection: 'row', gap: espaco[2] }}>
            <View style={{ flex: 1 }}>
              <Campo valor={chave} onChange={setChave} placeholder={guardada ? '••••••••••••' : 'Cole a chave aqui'} senha={!mostrar} />
            </View>
            <BotaoSecundario rotulo={mostrar ? 'Ocultar' : 'Mostrar'} onPress={() => setMostrar(!mostrar)} />
          </View>
          {chave.trim() ? <BotaoPrincipal rotulo="Guardar a chave" onPress={salvarChave} /> : null}
          {guardada && <Text style={[tipo.buttonSmall, { color: cor.greenInk }]}>Chave guardada no seu celular</Text>}
        </View>

        <Pressable onPress={() => navigation.navigate('Voz', { origem: 'ajustes' })} style={{ gap: espaco[2] }}>
          <Text style={tipo.section}>Seu jeito de contar</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={[tipo.body, { flex: 1, color: cor.inkSoft }]}>Veja e ajuste como o app escreve na sua voz.</Text>
            <ChevronRight color={cor.ink} size={22} />
          </View>
        </Pressable>

        <View style={{ gap: espaco[3] }}>
          <Text style={tipo.section}>Modelo no aparelho</Text>
          <Text style={[tipo.body, { color: cor.inkSoft }]}>
            Escreve os capítulos no seu celular, sem usar a internet. Gemma 4 E2B, um modelo aberto do Google.
          </Text>
          <Tag
            tipo={modelo === 'baixado' ? 'pronto' : modelo === 'baixando' ? 'transcrevendo' : 'fila'}
            rotulo={modelo === 'baixado' ? 'Baixado' : modelo === 'baixando' ? `Baixando · ${Math.round(progressoModelo * 100)}%` : 'Não baixado'}
          />
          <Text style={[tipo.body, { color: cor.inkSoft }]}>Tamanho: {TAMANHO_MODELO}. Use o Wi-Fi.</Text>
          {modelo === 'ausente' && <BotaoPrincipal rotulo="Baixar modelo" icone={Download} onPress={baixarModelo} />}
          {modelo === 'baixando' && (
            <>
              <BarraProgresso fracao={progressoModelo} />
              <Aviso tom="neutro">Deixe o app aberto até o download terminar.</Aviso>
            </>
          )}
          {erro && modelo === 'ausente' && <Aviso tom="erro">{erro}</Aviso>}
        </View>

        <View style={{ gap: espaco[3] }}>
          <Text style={tipo.section}>O que sai do seu celular</Text>
          <View style={[e.cartao, { gap: espaco[2] }]}>
            <Text style={tipo.buttonSmall}>Sai: só o áudio</Text>
            <Text style={[tipo.body, { color: cor.inkSoft }]}>E só durante a transcrição.</Text>
          </View>
          <View style={[e.cartao, { gap: espaco[2] }]}>
            <Text style={tipo.buttonSmall}>Fica no celular</Text>
            <Text style={[tipo.body, { color: cor.inkSoft }]}>Seus textos, ideias e capítulos.</Text>
          </View>
        </View>
      </View>
    </Tela>
  );
}
