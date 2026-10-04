// Componentes do handoff (design/design_handoff_granny_memories/README.md, "Componentes").
import { AudioLines, ChevronLeft, Lock, Smartphone } from 'lucide-react-native';
import { type ReactNode, useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  type TextStyle,
  TextInput,
  View,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { cor, espaco, fonte, OPACIDADE_DESATIVADO, raio, tamanho, tipo } from './tema';

type Icone = typeof Lock;

// ------------------------------------------------------------------ texto
export const T = ({ s, children, n }: { s?: TextStyle | TextStyle[]; children: ReactNode; n?: number }) => (
  <Text style={[tipo.body, s as TextStyle]} numberOfLines={n}>
    {children}
  </Text>
);

// ------------------------------------------------------------------ botões
export function BotaoPrincipal({
  rotulo,
  onPress,
  icone: Ic,
  desativado,
  alto,
  estilo,
}: {
  rotulo: string;
  onPress: () => void;
  icone?: Icone;
  desativado?: boolean;
  alto?: boolean;
  estilo?: ViewStyle;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={desativado}
      onPress={onPress}
      style={({ pressed }) => [
        e.principal,
        { height: alto ? tamanho.principalInicio : tamanho.principal },
        pressed && { backgroundColor: cor.tawnyPressed },
        desativado && { opacity: OPACIDADE_DESATIVADO },
        estilo,
      ]}
    >
      {Ic && <Ic color={cor.onAccent} size={24} strokeWidth={2} />}
      <Text style={[tipo.button, { color: cor.onAccent, fontSize: alto ? 20 : 19 }]}>{rotulo}</Text>
    </Pressable>
  );
}

export function BotaoSecundario({
  rotulo,
  onPress,
  icone: Ic,
  desativado,
  corTexto = cor.ink,
  corBorda = cor.inkBorder,
  estilo,
  tracejado,
  fundo,
  altura = tamanho.secundario,
}: {
  rotulo: string;
  onPress: () => void;
  icone?: Icone;
  desativado?: boolean;
  corTexto?: string;
  corBorda?: string;
  estilo?: ViewStyle;
  tracejado?: boolean;
  fundo?: string;
  altura?: number;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={desativado}
      onPress={onPress}
      style={({ pressed }) => [
        e.secundario,
        { height: altura, borderColor: corBorda, borderStyle: tracejado ? 'dashed' : 'solid' },
        fundo ? { backgroundColor: fundo } : null,
        pressed && { backgroundColor: cor.paperPressed },
        desativado && { opacity: OPACIDADE_DESATIVADO },
        estilo,
      ]}
    >
      {Ic && <Ic color={corTexto} size={22} strokeWidth={2} />}
      <Text style={[tipo.buttonSecondary, { color: corTexto }]}>{rotulo}</Text>
    </Pressable>
  );
}

export function BotaoPilula({ rotulo, onPress, icone: Ic = AudioLines }: { rotulo: string; onPress: () => void; icone?: Icone }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [e.pilula, pressed && { backgroundColor: cor.paperPressed }]}
    >
      <Ic color={cor.ink} size={20} strokeWidth={2} />
      <Text style={tipo.buttonSmall}>{rotulo}</Text>
    </Pressable>
  );
}

// ------------------------------------------------------------------ estrutura de tela
export function Tela({
  children,
  rodape,
  fundo = cor.paper,
  rolar = true,
}: {
  children: ReactNode;
  rodape?: ReactNode;
  fundo?: string;
  rolar?: boolean;
}) {
  const ins = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: fundo, paddingTop: ins.top }}>
      {rolar ? (
        <ScrollView contentContainerStyle={{ paddingBottom: espaco[6] }}>{children}</ScrollView>
      ) : (
        <View style={{ flex: 1 }}>{children}</View>
      )}
      {rodape && <View style={[e.rodape, { paddingBottom: espaco[3] + ins.bottom }]}>{rodape}</View>}
    </View>
  );
}

/** "Voltar" à esquerda. O botão da ghost writer fica escondido (maestro fora do recorte). */
export function Cabecalho({ onVoltar, titulo }: { onVoltar: () => void; titulo?: string }) {
  return (
    <View style={e.cabecalho}>
      <Pressable
        accessibilityRole="button"
        onPress={onVoltar}
        style={({ pressed }) => [e.voltar, pressed && { backgroundColor: cor.paperPressed }]}
      >
        <ChevronLeft color={cor.ink} size={24} strokeWidth={2} />
        <Text style={[tipo.buttonSecondary, { fontSize: 18 }]}>Voltar</Text>
      </Pressable>
      {titulo && <Text style={[tipo.buttonSmall, { marginLeft: espaco[2] }]}>{titulo}</Text>}
    </View>
  );
}

export function BlocoTitulo({ passo, titulo, sub }: { passo?: string; titulo: string; sub?: string }) {
  return (
    <View style={{ paddingHorizontal: espaco.tela, paddingTop: espaco[2], paddingBottom: espaco[4], gap: 6 }}>
      {passo && <Text style={[tipo.small, { color: cor.tawnyInk }]}>{passo}</Text>}
      <Text style={tipo.title}>{titulo}</Text>
      {sub && <Text style={[tipo.body, { color: cor.inkSoft }]}>{sub}</Text>}
    </View>
  );
}

// ------------------------------------------------------------------ selos, tags, avisos
export function SeloOrigem({ rotulo, onPress }: { rotulo: string; onPress?: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} hitSlop={7} style={e.seloToque}>
      <View style={e.selo}>
        <AudioLines color={cor.blueInk} size={16} strokeWidth={2} />
        <Text style={[tipo.small, { color: cor.blueInk }]}>{rotulo}</Text>
      </View>
    </Pressable>
  );
}

export type TipoTag = 'pronto' | 'transcrevendo' | 'fila' | 'rascunho' | 'aprovado' | 'neutro';
const CORES_TAG: Record<TipoTag, { fundo: string; texto: string; ponto: string; vazado?: boolean }> = {
  pronto: { fundo: cor.greenTint, texto: cor.greenInk, ponto: cor.green },
  aprovado: { fundo: cor.greenTint, texto: cor.greenInk, ponto: cor.green },
  transcrevendo: { fundo: cor.blueTint, texto: cor.blueInk, ponto: cor.blue },
  fila: { fundo: cor.tagNeutral, texto: cor.inkMuted, ponto: cor.inkBorder, vazado: true },
  rascunho: { fundo: cor.tawnyTint, texto: cor.tawnyInk, ponto: cor.tawny },
  neutro: { fundo: cor.tagNeutral, texto: cor.inkMuted, ponto: cor.inkBorder },
};

export function Tag({ tipo: t, rotulo }: { tipo: TipoTag; rotulo: string }) {
  const c = CORES_TAG[t];
  return (
    <View style={[e.tag, { backgroundColor: c.fundo }]}>
      <View
        style={[
          e.ponto,
          c.vazado ? { borderWidth: 2, borderColor: c.ponto } : { backgroundColor: c.ponto },
        ]}
      />
      <Text style={[tipo.small, { color: c.texto }]}>{rotulo}</Text>
    </View>
  );
}

export function Aviso({
  children,
  tom = 'tawny',
  icone: Ic,
}: {
  children: ReactNode;
  tom?: 'tawny' | 'verde' | 'neutro' | 'erro';
  icone?: Icone;
}) {
  const c = {
    tawny: { fundo: cor.tawnyTint, texto: '#6E3210' },
    verde: { fundo: cor.greenTint, texto: cor.greenInk },
    neutro: { fundo: cor.paperSunk, texto: cor.inkMuted },
    erro: { fundo: cor.errorTint, texto: cor.error },
  }[tom];
  return (
    <View style={[e.aviso, { backgroundColor: c.fundo }]}>
      {Ic && <Ic color={c.texto} size={22} strokeWidth={2} />}
      <View style={{ flex: 1, gap: espaco[3] }}>
        {typeof children === 'string' ? <Text style={[tipo.body, { color: c.texto }]}>{children}</Text> : children}
      </View>
    </View>
  );
}

export function SeloPrivacidade() {
  return (
    <View style={[e.aviso, { backgroundColor: cor.paperSunk, alignItems: 'center' }]}>
      <Lock color={cor.inkMuted} size={20} strokeWidth={2} />
      <Text style={[tipo.body, { color: cor.inkMuted, flex: 1, fontSize: 15, lineHeight: 21 }]}>
        Seus textos ficam no seu celular. Só o áudio é enviado para ser transcrito.
      </Text>
    </View>
  );
}

export function BarraProgresso({ fracao }: { fracao: number }) {
  const pct = Math.round(Math.max(0, Math.min(1, fracao)) * 100);
  return (
    <View style={{ gap: espaco[2] }}>
      <View style={e.trilho}>
        <View style={[e.preenchido, { width: `${pct}%` }]} />
      </View>
      <Text style={[tipo.small, { color: cor.inkSoft }]}>{pct}%</Text>
    </View>
  );
}

export function AvisoCelularAberto() {
  return (
    <Aviso tom="neutro" icone={Smartphone}>
      Isso acontece no seu celular. Deixe o app aberto até terminar.
    </Aviso>
  );
}

// ------------------------------------------------------------------ campo
export function Campo({
  valor,
  onChange,
  placeholder,
  senha,
  livro,
  multilinha,
}: {
  valor: string;
  onChange: (v: string) => void;
  placeholder?: string;
  senha?: boolean;
  livro?: boolean;
  multilinha?: boolean;
}) {
  return (
    <TextInput
      value={valor}
      onChangeText={onChange}
      placeholder={placeholder}
      placeholderTextColor={cor.placeholder}
      secureTextEntry={senha}
      autoCapitalize={senha ? 'none' : 'sentences'}
      autoCorrect={!senha}
      multiline={multilinha}
      style={[
        e.campo,
        livro ? { fontFamily: fonte.livro, fontSize: 22 } : { fontFamily: fonte.ui, fontSize: 19 },
        multilinha && { minHeight: 96, textAlignVertical: 'top', paddingTop: 14 },
      ]}
    />
  );
}

// ------------------------------------------------------------------ folha e toast
export function Folha({
  visivel,
  onFechar,
  titulo,
  children,
}: {
  visivel: boolean;
  onFechar: () => void;
  titulo?: string;
  children: ReactNode;
}) {
  const ins = useSafeAreaInsets();
  return (
    <Modal visible={visivel} transparent animationType="slide" onRequestClose={onFechar} statusBarTranslucent>
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
      <Pressable style={e.scrim} onPress={onFechar} accessibilityLabel="Fechar" />
      <View style={[e.folha, { paddingBottom: espaco[5] + ins.bottom }]}>
        <View style={e.alca} />
        <ScrollView contentContainerStyle={{ gap: espaco[4] }} keyboardShouldPersistTaps="handled">
          {titulo && <Text style={tipo.sheetTitle}>{titulo}</Text>}
          {children}
        </ScrollView>
      </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

let mostrarToastGlobal: (texto: string) => void = () => {};
export const toast = (texto: string) => mostrarToastGlobal(texto);

export function Toast() {
  const [texto, setTexto] = useState<string | null>(null);
  const ins = useSafeAreaInsets();
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    mostrarToastGlobal = (t) => {
      clearTimeout(timer);
      setTexto(t);
      timer = setTimeout(() => setTexto(null), 2800);
    };
    return () => clearTimeout(timer);
  }, []);
  if (!texto) return null;
  return (
    <View pointerEvents="none" style={[e.toast, { bottom: 16 + ins.bottom + 76 }]}>
      <Text style={[tipo.body, { color: cor.paper }]}>{texto}</Text>
    </View>
  );
}

// ------------------------------------------------------------------ estilos
export const e = StyleSheet.create({
  principal: {
    backgroundColor: cor.tawny,
    borderRadius: raio.botao,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 20,
  },
  secundario: {
    borderWidth: 2,
    borderRadius: raio.botao,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 16,
  },
  pilula: {
    height: tamanho.toque,
    borderRadius: raio.pilula,
    borderWidth: 2,
    borderColor: cor.inkBorder,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
  },
  rodape: {
    borderTopWidth: 1,
    borderTopColor: cor.line,
    paddingHorizontal: espaco.tela,
    paddingTop: espaco[3],
    backgroundColor: cor.paper,
    gap: espaco[3],
  },
  cabecalho: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: espaco[4],
  },
  voltar: {
    height: tamanho.toque,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingLeft: 8,
    paddingRight: 14,
    borderRadius: raio.botao,
  },
  seloToque: { minHeight: tamanho.toque, justifyContent: 'center', alignSelf: 'flex-start' },
  selo: {
    height: tamanho.selo,
    borderRadius: raio.pilula,
    backgroundColor: cor.blueTint,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
  },
  tag: {
    height: tamanho.tag,
    borderRadius: raio.pilula,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
  },
  ponto: { width: 10, height: 10, borderRadius: 5 },
  aviso: { borderRadius: raio.campo, padding: espaco[4], flexDirection: 'row', gap: espaco[3] },
  trilho: { height: tamanho.progresso, borderRadius: raio.pilula, backgroundColor: cor.line, overflow: 'hidden' },
  preenchido: { height: '100%', backgroundColor: cor.tawny, borderRadius: raio.pilula },
  campo: {
    minHeight: tamanho.campo,
    borderWidth: 2,
    borderColor: cor.inkBorder,
    borderRadius: raio.campo,
    backgroundColor: cor.paperRaised,
    paddingHorizontal: espaco[4],
    color: cor.ink,
  },
  scrim: { flex: 1, backgroundColor: cor.scrim },
  folha: {
    maxHeight: '92%',
    backgroundColor: cor.paperRaised,
    borderTopLeftRadius: raio.folha,
    borderTopRightRadius: raio.folha,
    paddingHorizontal: espaco.tela,
    paddingTop: espaco[3],
    elevation: 12,
  },
  alca: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: cor.lineSoft,
    alignSelf: 'center',
    marginBottom: espaco[4],
  },
  toast: {
    position: 'absolute',
    left: 16,
    right: 16,
    backgroundColor: cor.ink,
    borderRadius: raio.botao,
    padding: espaco[4],
    elevation: 8,
  },
  cartao: {
    backgroundColor: cor.paperRaised,
    borderWidth: 1,
    borderColor: cor.line,
    borderRadius: raio.cartao,
    paddingVertical: 18,
    paddingHorizontal: 20,
    gap: espaco[3],
  },
  conteudo: { paddingHorizontal: espaco.tela, gap: espaco[4] },
});
