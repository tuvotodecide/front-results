const SESSION_END_REASON_KEY = "tvd_auth_session_end_reason";

export const AUTH_VERSION_MISMATCH_CODE = "AUTH_VERSION_MISMATCH";

export type AuthSessionEndReason = typeof AUTH_VERSION_MISMATCH_CODE;

const isBrowser = () => typeof window !== "undefined";

export const persistAuthSessionEndReason = (reason: AuthSessionEndReason) => {
  if (!isBrowser()) return;
  try {
    window.sessionStorage.setItem(SESSION_END_REASON_KEY, reason);
  } catch {
    // Storage failures should not block logout.
  }
};

export const consumeAuthSessionEndReason = (): AuthSessionEndReason | null => {
  if (!isBrowser()) return null;
  try {
    const reason = window.sessionStorage.getItem(SESSION_END_REASON_KEY);
    window.sessionStorage.removeItem(SESSION_END_REASON_KEY);
    return reason === AUTH_VERSION_MISMATCH_CODE ? reason : null;
  } catch {
    return null;
  }
};

export const getAuthSessionEndMessage = (
  reason: AuthSessionEndReason | null,
) => {
  if (reason === AUTH_VERSION_MISMATCH_CODE) {
    return "Tu sesión fue cerrada porque se actualizó el acceso institucional. Ingresa con tu correo vigente y utiliza el flujo de nueva contraseña si corresponde.";
  }

  return null;
};
