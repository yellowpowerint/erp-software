import axios from 'axios';

type ApiErrorKind = 'http' | 'network' | 'timeout' | 'unknown';

export type ApiError = {
  kind: ApiErrorKind;
  message: string;
  status?: number;
  url?: string;
  raw?: unknown;
};

function normalizeApiMessage(value: unknown): string | undefined {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) {
    const strings = value.filter((v) => typeof v === 'string') as string[];
    if (strings.length > 0) return strings.join('\n');
  }
  return undefined;
}

export function parseApiError(error: unknown, apiBaseUrl?: string): ApiError {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const url = error.config?.url;

    if (!error.response) {
      const code = (error as any).code as string | undefined;
      if (code === 'ECONNABORTED') {
        return {
          kind: 'timeout',
          message: `Request timed out. API: ${apiBaseUrl ?? 'unknown'}`,
          url,
          raw: error,
        };
      }

      return {
        kind: 'network',
        message: `Network error. API: ${apiBaseUrl ?? 'unknown'}`,
        url,
        raw: error,
      };
    }

    const data = error.response?.data as any;
    const apiMessage = normalizeApiMessage(data?.message) ?? normalizeApiMessage(data?.error);
    const fallbackMessage = typeof error.message === 'string' && error.message.trim().length > 0 ? error.message : 'Request failed';

    return {
      kind: 'http',
      status,
      url,
      message: apiMessage ?? fallbackMessage,
      raw: error,
    };
  }

  if (typeof (error as any)?.message === 'string' && (error as any).message.trim().length > 0) {
    return {
      kind: 'unknown',
      message: (error as any).message,
      raw: error,
    };
  }

  return {
    kind: 'unknown',
    message: String(error),
    raw: error,
  };
}
