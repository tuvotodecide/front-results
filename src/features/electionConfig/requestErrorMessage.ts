type RequestError =
  | {
      status?: number | string;
      data?: {
        code?: unknown;
        message?: unknown;
      };
      error?: string;
      message?: unknown;
    }
  | null
  | undefined;

const OFFLINE_MESSAGE = 'No hay conexión a internet. Verifica tu red e intenta nuevamente.';

const isOfflineError = (error: RequestError) => {
  if (!error) return false;

  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return true;
  }

  if (error.status === 'FETCH_ERROR') {
    return true;
  }

  const rawError = String(error.error || '').toLowerCase();
  return (
    rawError.includes('failed to fetch') ||
    rawError.includes('networkerror') ||
    rawError.includes('load failed') ||
    rawError.includes('network request failed')
  );
};

export const getRequestErrorMessage = (
  error: RequestError,
  fallbackMessage: string,
) => {
  if (isOfflineError(error)) {
    return OFFLINE_MESSAGE;
  }

  const backendMessage = error?.data?.message ?? error?.message;
  const normalizedMessage =
    typeof backendMessage === 'string'
      ? backendMessage.trim()
      : Array.isArray(backendMessage)
        ? backendMessage
            .map((item) => String(item ?? '').trim())
            .filter(Boolean)
            .join('. ')
        : backendMessage && typeof backendMessage === 'object' && 'message' in backendMessage
          ? String((backendMessage as { message?: unknown }).message ?? '').trim()
          : '';

  if (normalizedMessage.length > 0) {
    const plainMessage = normalizedMessage.toLowerCase();
    if (plainMessage.includes('carnet debe ser alfanumerico')) {
      return 'El carnet debe ser alfanumérico.';
    }
    return normalizedMessage;
  }

  const code = typeof error?.data?.code === 'string' ? error.data.code : '';
  switch (code) {
    case 'TVD_CREDITS_INSUFFICIENT_CAPACITY':
    case 'TVD_INSUFFICIENT_CONTRACT_BALANCE':
      return 'No tienes suficientes $TVD para publicar esta votación.';
    case 'TVD_ALLOWANCE_INSUFFICIENT':
      return 'La wallet institucional no tiene allowance TVD suficiente para publicar esta votación.';
    case 'PUBLICATION_WINDOW_CLOSED':
      return 'El tiempo para publicar oficialmente esta votación ya terminó.';
    case 'TVD_CREDITS_OPERATOR_NOT_AUTHORIZED':
      return 'El contrato de votación no está autorizado para reservar créditos TVD.';
    case 'TVD_CREATE_VOTE_PREFLIGHT_REVERTED':
      return 'La simulación de publicación fue rechazada. Revisa la configuración antes de intentar nuevamente.';
    default:
      break;
  }

  return fallbackMessage;
};

export { OFFLINE_MESSAGE };
