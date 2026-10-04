// JSON Schema da saída de cada agente da fatia. O llama.rn converte em gramática,
// então o modelo não consegue devolver JSON fora deste formato.
import { RELACOES, TIPOS_ATOMO } from './atomos';

const texto = { type: 'string' } as const;
const listaDeTexto = { type: 'array', items: texto } as const;

export const ESQUEMA_LIMPEZA = {
  type: 'object',
  properties: { texto },
  required: ['texto'],
  additionalProperties: false,
};

export const ESQUEMA_EXTRATOR = {
  type: 'object',
  properties: {
    atomos: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          tipo: { type: 'string', enum: TIPOS_ATOMO },
          resumo: texto,
          trecho_literal: texto,
          pessoas: listaDeTexto,
          datas_locais_numeros: listaDeTexto,
          relacionado: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                indice: { type: 'integer', minimum: 0 },
                relacao: { type: 'string', enum: RELACOES },
              },
              required: ['indice', 'relacao'],
              additionalProperties: false,
            },
          },
        },
        required: ['tipo', 'resumo', 'trecho_literal', 'pessoas', 'datas_locais_numeros', 'relacionado'],
        additionalProperties: false,
      },
    },
  },
  required: ['atomos'],
  additionalProperties: false,
};

export const ESQUEMA_ANALISTA = {
  type: 'object',
  properties: {
    tracos: {
      type: 'array',
      maxItems: 3,
      items: {
        type: 'object',
        properties: {
          nome: texto,
          traco: texto,
          evidencia_literal: texto,
          ocorrencias: { type: 'integer', minimum: 1 },
        },
        required: ['nome', 'traco', 'evidencia_literal', 'ocorrencias'],
        additionalProperties: false,
      },
    },
  },
  required: ['tracos'],
  additionalProperties: false,
};

export const ESQUEMA_REDATOR = {
  type: 'object',
  properties: {
    titulo: texto,
    paragrafos: {
      type: 'array',
      minItems: 1,
      items: {
        type: 'object',
        properties: {
          texto,
          atomos: { type: 'array', items: { type: 'string', pattern: '^A-[0-9]{3,}$' } },
        },
        required: ['texto', 'atomos'],
        additionalProperties: false,
      },
    },
    notas: { type: 'array', maxItems: 5, items: texto },
    perguntas: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          texto,
          origem: { type: 'array', items: { type: 'string', pattern: '^(A-[0-9]{3,}|audio-[0-9]{2,})$' } },
          tipo: { type: 'string', enum: ['lacuna', 'contradição', 'confirmação'] },
        },
        required: ['texto', 'origem', 'tipo'],
        additionalProperties: false,
      },
    },
  },
  required: ['titulo', 'paragrafos', 'notas', 'perguntas'],
  additionalProperties: false,
};
