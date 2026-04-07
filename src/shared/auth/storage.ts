import { isBrowser } from "@/shared/platform/browser";

export type PendingReason = "VERIFY_EMAIL" | "SUPERADMIN_APPROVAL";

const SESSION_KEYS = [
  "token",
  "user",
  "selectedElectionId",
  "selectedElectionName",
  "pendingEmail",
  "pendingReason",
] as const;

export const readStorageItem = (key: string) => {
  if (!isBrowser()) return null;
  return window.localStorage.getItem(key);
};

export const writeStorageItem = (key: string, value: string | null) => {
  if (!isBrowser()) return;
  if (value === null) {
    window.localStorage.removeItem(key);
    return;
  }
  window.localStorage.setItem(key, value);
};

export const readStoredToken = () => readStorageItem("token");

export const writeStoredToken = (token: string | null) => {
  writeStorageItem("token", token);
};

export const readStoredUser = () => {
  const value = readStorageItem("user");
  if (!value) return null;

  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

export const writeStoredUser = (user: unknown | null) => {
  if (user === null) {
    writeStorageItem("user", null);
    return;
  }
  writeStorageItem("user", JSON.stringify(user));
};

export const clearSessionStorage = () => {
  if (!isBrowser()) return;
  SESSION_KEYS.forEach((key) => window.localStorage.removeItem(key));
};

export const readPendingEmail = () => readStorageItem("pendingEmail") ?? "";

export const readPendingReason = (): PendingReason => {
  const value = readStorageItem("pendingReason");
  return value === "VERIFY_EMAIL" ? "VERIFY_EMAIL" : "SUPERADMIN_APPROVAL";
};

export const writePendingContext = ({
  email,
  reason,
}: {
  email: string;
  reason: PendingReason;
}) => {
  writeStorageItem("pendingEmail", email);
  writeStorageItem("pendingReason", reason);
};

export const clearPendingContext = () => {
  writeStorageItem("pendingEmail", null);
  writeStorageItem("pendingReason", null);
};
