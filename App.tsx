// Teste de fumaça do development build: confirma que o llama.rn (nativo)
// e o armazenamento seguro funcionam no aparelho. Será substituído pela
// tela da fatia vertical.
import { StatusBar } from 'expo-status-bar';
import * as SecureStore from 'expo-secure-store';
import { BuildInfo, getBackendDevicesInfo } from 'llama.rn';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { ESQUEMA_EXTRATOR, ESQUEMA_LIMPEZA } from './src/harness/esquemas';
import { verificarLimpeza } from './src/harness/limpeza';
import { TEMPERATURAS } from './src/harness/modelo';
import { EXTRATOR, LIMPEZA, sistema } from './src/harness/prompts';
import { ModeloLlama } from './src/modelo/llama';

// Teste técnico do modelo (etapa 3): o GGUF é copiado pelo cabo para esta pasta.
const CAMINHO_MODELO = '/data/user/0/com.paulaksm.grannymemories/files/gemma-4-E2B-it-Q4_K_M.gguf';
const PARAGRAFO_SINTETICO =
  'É... toda sexta-feira, né, a casa, a casa cheirava a laranja. Hum, era dia de bolo, sabe, ' +
  'e a gente ficava na porta da cozinha esperando a forma sair do forno, e a vó dizia que ainda não tava no ponto.';

async function testarModelo(log: (c: Check) => void) {
  const modelo = new ModeloLlama(CAMINHO_MODELO);
  const t0 = Date.now();
  await modelo.carregar();
  log({ label: 'Gemma carregado', result: `${((Date.now() - t0) / 1000).toFixed(1)} s`, ok: true });

  const t1 = Date.now();
  const limpo = (await modelo.gerar({
    sistema: sistema(LIMPEZA),
    usuario: PARAGRAFO_SINTETICO,
    esquema: ESQUEMA_LIMPEZA,
    maxTokens: 256,
    temperatura: TEMPERATURAS.limpeza,
  })) as { texto: string };
  const verif = verificarLimpeza('audio-teste', [PARAGRAFO_SINTETICO], [limpo.texto]);
  log({
    label: 'Limpeza',
    result: `${((Date.now() - t1) / 1000).toFixed(1)} s | ${JSON.stringify(modelo.ultimaMedida)}\n${limpo.texto}\nverificação: ${verif.ok ? 'ok' : verif.errosComoTexto()}`,
    ok: verif.ok,
  });

  const t2 = Date.now();
  const atomos = await modelo.gerar({
    sistema: sistema(EXTRATOR),
    usuario: `[00:00] ${limpo.texto}`,
    esquema: ESQUEMA_EXTRATOR,
    maxTokens: 1024,
    temperatura: TEMPERATURAS.extrator,
  });
  log({
    label: 'Extrator',
    result: `${((Date.now() - t2) / 1000).toFixed(1)} s | ${JSON.stringify(modelo.ultimaMedida)}\n${JSON.stringify(atomos, null, 1)}`,
    ok: true,
  });
  await modelo.liberar();
}

type Check = { label: string; result: string; ok: boolean | null };

async function runChecks(): Promise<Check[]> {
  const checks: Check[] = [];

  checks.push({
    label: 'llama.rn (build)',
    result: `${BuildInfo.number} (${BuildInfo.commit})`,
    ok: true,
  });

  try {
    const devices = await getBackendDevicesInfo();
    checks.push({
      label: 'llama.rn (nativo)',
      result: JSON.stringify(devices, null, 2),
      ok: true,
    });
  } catch (e) {
    checks.push({ label: 'llama.rn (nativo)', result: String(e), ok: false });
  }

  try {
    const key = 'teste_fumaca';
    const value = `valor-ficticio-${Date.now()}`;
    await SecureStore.setItemAsync(key, value);
    const read = await SecureStore.getItemAsync(key);
    await SecureStore.deleteItemAsync(key);
    checks.push({
      label: 'Armazenamento seguro',
      result: read === value ? 'gravou, leu e apagou' : 'valor lido difere',
      ok: read === value,
    });
  } catch (e) {
    checks.push({ label: 'Armazenamento seguro', result: String(e), ok: false });
  }

  return checks;
}

export default function App() {
  const [checks, setChecks] = useState<Check[]>([]);
  const [rodando, setRodando] = useState(false);

  const rodarModelo = () => {
    setRodando(true);
    const log = (c: Check) => {
      console.log('[modelo]', JSON.stringify(c));
      setChecks((atual) => [...atual, c]);
    };
    testarModelo(log)
      .catch((e) => log({ label: 'Modelo', result: String(e), ok: false }))
      .finally(() => setRodando(false));
  };

  useEffect(() => {
    runChecks().then((resultado) => {
      console.log('[fumaca]', JSON.stringify(resultado));
      setChecks(resultado);
    });
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Granny Memories: teste de fumaça</Text>
      {checks.length === 0 && <Text>Verificando…</Text>}
      {checks.map((c) => (
        <Text key={c.label} style={styles.check}>
          {c.ok ? '✅' : '❌'} {c.label}
          {'\n'}
          <Text style={styles.result}>{c.result}</Text>
        </Text>
      ))}
      <Pressable style={styles.botao} onPress={rodarModelo} disabled={rodando}>
        <Text style={styles.botaoTexto}>{rodando ? 'Rodando o modelo…' : 'Testar modelo'}</Text>
      </Pressable>
      <StatusBar style="auto" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, paddingTop: 64, gap: 16 },
  title: { fontSize: 20, fontWeight: '600' },
  check: { fontSize: 16 },
  result: { fontFamily: 'monospace', fontSize: 12 },
  botao: { backgroundColor: '#C56127', borderRadius: 14, padding: 18, alignItems: 'center' },
  botaoTexto: { color: '#fff', fontSize: 19, fontWeight: '700' },
});
