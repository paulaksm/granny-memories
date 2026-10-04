// Teste de fumaça do development build: confirma que o llama.rn (nativo)
// e o armazenamento seguro funcionam no aparelho. Será substituído pela
// tela da fatia vertical.
import { StatusBar } from 'expo-status-bar';
import * as SecureStore from 'expo-secure-store';
import { BuildInfo, getBackendDevicesInfo } from 'llama.rn';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';

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

  useEffect(() => {
    runChecks().then(setChecks);
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
      <StatusBar style="auto" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, paddingTop: 64, gap: 16 },
  title: { fontSize: 20, fontWeight: '600' },
  check: { fontSize: 16 },
  result: { fontFamily: 'monospace', fontSize: 12 },
});
