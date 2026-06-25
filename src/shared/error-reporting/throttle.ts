const DEFAULT_COOLDOWN_MS = 5 * 60 * 1000;
const DEFAULT_MAX_PER_SESSION = 10;

export interface RuntimeErrorThrottleState {
  sentSignatures: Map<string, number>;
  sentCount: number;
}

export const createRuntimeErrorThrottleState = (): RuntimeErrorThrottleState => ({
  sentSignatures: new Map<string, number>(),
  sentCount: 0,
});

export const shouldSendRuntimeError = (
  signature: string,
  state: RuntimeErrorThrottleState,
  now = Date.now(),
  cooldownMs = DEFAULT_COOLDOWN_MS,
  maxPerSession = DEFAULT_MAX_PER_SESSION,
): boolean => {
  if (state.sentCount >= maxPerSession) return false;

  const lastSentAt = state.sentSignatures.get(signature);
  if (lastSentAt && now - lastSentAt < cooldownMs) return false;

  state.sentSignatures.set(signature, now);
  state.sentCount += 1;
  return true;
};
