type RequestError =
  | {
      status?: number | string;
      data?: {
        message?: string;
      };
      error?: string;
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

  const backendMessage = error?.data?.message;
  if (backendMessage && backendMessage.trim().length > 0) {
    return backendMessage;
  }

  return fallbackMessage;
};

export { OFFLINE_MESSAGE };
