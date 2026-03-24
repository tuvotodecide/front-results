// Configuración del modo de aplicación
// "results" = Flujo de resultados electorales (anterior)
// "voting" = Flujo de votación institucional (nuevo)

export type AppMode = "results" | "voting";

const { VITE_APP_MODE } = import.meta.env;

export const APP_MODE: AppMode = (VITE_APP_MODE as AppMode) || "voting";

export const isResultsMode = () => APP_MODE === "results";
export const isVotingMode = () => APP_MODE === "voting";
