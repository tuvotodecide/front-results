export type DomainKey =
  | "public"
  | "institutional-private"
  | "results"
  | "admin";

export const routeDomains = {
  public: {
    label: "Publico institucional",
    paths: [
      "/",
      "/login",
      "/registrarse",
      "/pendiente",
      "/rechazado",
      "/verificar-correo",
      "/recuperar",
      "/restablecer",
      "/elections/[electionId]/public",
    ],
  },
  "institutional-private": {
    label: "Voting institucional privado",
    paths: [
      "/elections",
      "/elections/new",
      "/elections/[electionId]/config/cargos",
      "/elections/[electionId]/config/planchas",
      "/elections/[electionId]/config/padron",
      "/elections/[electionId]/config/review",
      "/elections/[electionId]/status",
    ],
  },
  results: {
    label: "Resultados electorales",
    paths: [
      "/resultados",
      "/resultados/mesa",
      "/resultados/mesa/[tableCode]",
      "/resultados/imagen",
      "/resultados/imagen/[id]",
      "/control-personal",
      "/auditoria-tse",
    ],
  },
  admin: {
    label: "Administracion",
    paths: [
      "/panel",
      "/departamentos",
      "/provincias",
      "/municipios",
      "/asientos-electorales",
      "/recintos-electorales",
      "/mesas",
      "/configuraciones",
      "/partidos",
      "/partidos-politicos",
    ],
  },
} as const satisfies Record<DomainKey, { label: string; paths: string[] }>;
