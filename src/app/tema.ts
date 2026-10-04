// Tokens do design (design/design_handoff_granny_memories/tokens.json).
import { type TextStyle } from 'react-native';

export const cor = {
  paper: '#F6EFEC',
  paperRaised: '#FCF8F6',
  paperPage: '#FFFCFB',
  paperSunk: '#EFE4E1',
  paperPressed: '#EDE1DE',
  desk: '#EADCDA',
  tagNeutral: '#ECE0DE',
  line: '#E4D5D2',
  lineSoft: '#CDB8B6',
  ink: '#2E2322',
  inkMuted: '#4F3D3C',
  inkSoft: '#66504F',
  inkBorder: '#8E716F',
  placeholder: '#7F6866',
  tawny: '#C56127',
  tawnyPressed: '#A3501F',
  tawnyTint: '#F6E1D3',
  tawnyInk: '#8A3F14',
  blue: '#007190',
  blueTint: '#DCEEF3',
  blueInk: '#00586F',
  green: '#6D7E77',
  greenTint: '#E3E9E6',
  greenInk: '#3F4D47',
  gap: '#FAEDB5',
  gapLine: '#E2C866',
  gapInk: '#5C4709',
  error: '#9A2E22',
  errorTint: '#F5DAD3',
  onAccent: '#FFFFFF',
  scrim: 'rgba(46,35,34,0.45)',
} as const;

export const fonte = {
  ui: 'AtkinsonHyperlegible_400Regular',
  uiBold: 'AtkinsonHyperlegible_700Bold',
  livro: 'Literata_400Regular',
  livroSemi: 'Literata_600SemiBold',
  livroItalico: 'Literata_400Regular_Italic',
} as const;

const t = (fontFamily: string, fontSize: number, lineHeight: number): TextStyle => ({
  fontFamily,
  fontSize,
  lineHeight,
  color: cor.ink,
});

export const tipo = {
  display: t(fonte.uiBold, 32, 38),
  title: t(fonte.uiBold, 30, 36),
  sheetTitle: t(fonte.uiBold, 24, 30),
  section: t(fonte.uiBold, 20, 26),
  bookTitle: t(fonte.livroSemi, 30, 38),
  book: t(fonte.livro, 21, 35),
  bookCard: t(fonte.livro, 21, 30),
  traitQuote: t(fonte.livro, 23, 35),
  quote: t(fonte.livroItalico, 19, 30),
  body: t(fonte.ui, 17, 24),
  bodyLarge: t(fonte.ui, 19, 28),
  button: t(fonte.uiBold, 19, 24),
  buttonSecondary: t(fonte.uiBold, 18, 22),
  buttonSmall: t(fonte.uiBold, 17, 22),
  small: t(fonte.uiBold, 15, 20),
} as const;

export const espaco = { 1: 4, 2: 8, 3: 12, 4: 16, 5: 24, 6: 32, 7: 48, tela: 24, secao: 36 } as const;
export const raio = { campo: 12, botao: 14, cartao: 18, folha: 24, pilula: 999 } as const;
export const tamanho = {
  toque: 48,
  principal: 60,
  principalInicio: 64,
  secundario: 56,
  campo: 56,
  traco: 52,
  abas: 52,
  selo: 34,
  tag: 30,
  progresso: 14,
} as const;
export const OPACIDADE_DESATIVADO = 0.45;
