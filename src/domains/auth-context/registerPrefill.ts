type PrefillUser = {
  dni?: string | null;
  email?: string | null;
  name?: string | null;
};

export type RegisterPrefill = {
  dni: string;
  email: string;
  name: string;
  hasExistingIdentity: boolean;
  isCrossAccess: boolean;
};

const pickFirstNonEmpty = (...values: Array<string | null | undefined>) => {
  for (const value of values) {
    const normalized = typeof value === "string" ? value.trim() : "";
    if (normalized) {
      return normalized;
    }
  }

  return "";
};

const getFirstSearchParam = (
  searchParams: URLSearchParams,
  keys: string[],
) => {
  for (const key of keys) {
    const value = searchParams.get(key);
    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }

  return null;
};

export const buildRegisterPathWithPrefill = (
  basePath: string | undefined,
  user?: PrefillUser | null,
) => {
  if (!basePath) return undefined;

  const params = new URLSearchParams();

  const dni = pickFirstNonEmpty(user?.dni);
  const email = pickFirstNonEmpty(user?.email);
  const name = pickFirstNonEmpty(user?.name);

  if (dni) params.set("dni", dni);
  if (email) params.set("email", email);
  if (name) params.set("name", name);
  if (params.size > 0) params.set("crossAccess", "1");

  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
};

export const resolveRegisterPrefill = (
  searchParams: URLSearchParams,
  user?: PrefillUser | null,
) => {
  const dni = pickFirstNonEmpty(
    getFirstSearchParam(searchParams, ["dni", "carnet"]),
    user?.dni,
  );
  const email = pickFirstNonEmpty(
    getFirstSearchParam(searchParams, ["email"]),
    user?.email,
  );
  const name = pickFirstNonEmpty(
    getFirstSearchParam(searchParams, ["name", "fullName"]),
    user?.name,
  );
  const isCrossAccess = searchParams.get("crossAccess") === "1";
  const hasExistingIdentity =
    isCrossAccess || Boolean(dni || email || name);

  return {
    dni,
    email,
    name,
    hasExistingIdentity,
    isCrossAccess,
  };
};
