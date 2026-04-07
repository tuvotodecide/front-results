// Configuración del modo de aplicación
// "results" = Flujo de resultados electorales (anterior)
// "voting" = Flujo de votación institucional (nuevo)

export type AppMode = "results" | "voting";

import { publicEnv } from "@/shared/env/public";

export const APP_MODE: AppMode = publicEnv.appMode;

export const isResultsMode = () => APP_MODE === "results";
export const isVotingMode = () => APP_MODE === "voting";
