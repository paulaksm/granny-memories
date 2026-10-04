// Granny Memories: navegação e carga inicial. Telas em src/app/telas, seguindo o
// protótipo do Claude Design (design/design_handoff_granny_memories).
import {
  AtkinsonHyperlegible_400Regular,
  AtkinsonHyperlegible_700Bold,
} from '@expo-google-fonts/atkinson-hyperlegible';
import {
  Literata_400Regular,
  Literata_400Regular_Italic,
  Literata_600SemiBold,
} from '@expo-google-fonts/literata';
import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Toast } from './src/app/componentes';
import { iniciar, useLoja } from './src/app/loja';
import type { Rotas } from './src/app/navegacao';
import { cor } from './src/app/tema';
import { Capitulo } from './src/app/telas/Capitulo';
import { Carregando } from './src/app/telas/Carregando';
import { Configuracao } from './src/app/telas/Configuracao';
import { Gravar } from './src/app/telas/Gravar';
import { Ideias } from './src/app/telas/Ideias';
import { Inicio } from './src/app/telas/Inicio';
import { Livro } from './src/app/telas/Livro';
import { Previa } from './src/app/telas/Previa';
import { SemRede } from './src/app/telas/SemRede';
import { Transcricao } from './src/app/telas/Transcricao';
import { Voz } from './src/app/telas/Voz';

const Pilha = createNativeStackNavigator<Rotas>();
const tema = { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: cor.paper } };

export default function App() {
  const [fontes] = useFonts({
    AtkinsonHyperlegible_400Regular,
    AtkinsonHyperlegible_700Bold,
    Literata_400Regular,
    Literata_400Regular_Italic,
    Literata_600SemiBold,
  });
  const { pronto } = useLoja();

  useEffect(() => {
    iniciar();
  }, []);

  if (!fontes || !pronto) {
    return (
      <View style={{ flex: 1, backgroundColor: cor.paper, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={cor.tawny} size="large" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer theme={tema}>
        <StatusBar style="dark" />
        <Pilha.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: cor.paper } }}>
          <Pilha.Screen name="Inicio" component={Inicio} />
          <Pilha.Screen name="Livro" component={Livro} />
          <Pilha.Screen name="Gravar" component={Gravar} />
          <Pilha.Screen name="Transcricao" component={Transcricao} />
          <Pilha.Screen name="Carregando" component={Carregando} options={{ gestureEnabled: false }} />
          <Pilha.Screen name="Voz" component={Voz} />
          <Pilha.Screen name="Ideias" component={Ideias} />
          <Pilha.Screen name="Capitulo" component={Capitulo} />
          <Pilha.Screen name="Previa" component={Previa} />
          <Pilha.Screen name="Configuracao" component={Configuracao} />
          <Pilha.Screen name="SemRede" component={SemRede} />
        </Pilha.Navigator>
        <Toast />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
