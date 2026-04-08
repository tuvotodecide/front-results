import type { NextConfig } from "next";

const resultadosLegacyBases = [
  "control-personal",
  "auditoria-tse",
  "panel",
  "departamentos",
  "provincias",
  "municipios",
  "asientos-electorales",
  "recintos-electorales",
  "mesas",
  "configuraciones",
  "partidos",
  "partidos-politicos",
] as const;

const authVotacionLegacyBases = [
  "login",
  "registrarse",
  "verificar-correo",
  "pendiente",
  "rechazado",
  "recuperar",
  "restablecer",
] as const;

const nextConfig: NextConfig = {
  output: "standalone",
  eslint: {
    dirs: [
      "src/app",
      "src/domains",
      "src/shared",
      "src/components",
      "src/hooks",
      "src/store",
      "src/features",
    ],
  },
  typescript: {
    tsconfigPath: "tsconfig.next.json",
  },
  async redirects() {
    const authVotacionRedirects = authVotacionLegacyBases.map((base) => ({
      source: `/${base}`,
      destination: `/votacion/${base}`,
      permanent: false,
    }));

    const electionsCompatRedirects = [
      {
        source: "/elections/past",
        destination: "/votacion/elecciones/pasadas",
        permanent: false,
      },
      {
        source: "/elections/:electionId/public",
        destination: "/votacion/elecciones/:electionId/publica",
        permanent: false,
      },
      {
        source: "/elections/new",
        destination: "/votacion/elecciones/new",
        permanent: false,
      },
      {
        source: "/elections/:electionId/config/cargos",
        destination: "/votacion/elecciones/:electionId/config/cargos",
        permanent: false,
      },
      {
        source: "/elections/:electionId/config/planchas",
        destination: "/votacion/elecciones/:electionId/config/planchas",
        permanent: false,
      },
      {
        source: "/elections/:electionId/config/padron",
        destination: "/votacion/elecciones/:electionId/config/padron",
        permanent: false,
      },
      {
        source: "/elections/:electionId/config/review",
        destination: "/votacion/elecciones/:electionId/config/review",
        permanent: false,
      },
      {
        source: "/elections/:electionId/status",
        destination: "/votacion/elecciones/:electionId/status",
        permanent: false,
      },
      {
        source: "/elections",
        destination: "/votacion/elecciones",
        permanent: false,
      },
    ];

    const baseRedirects = resultadosLegacyBases.map((base) => ({
      source: `/${base}`,
      destination: `/resultados/${base}`,
      permanent: false,
    }));

    const createRedirects = resultadosLegacyBases
      .filter((base) => base !== "control-personal" && base !== "auditoria-tse" && base !== "panel")
      .map((base) => ({
        source: `/${base}/nuevo`,
        destination: `/resultados/${base}/nuevo`,
        permanent: false,
      }));

    const editRedirects = resultadosLegacyBases
      .filter((base) => base !== "control-personal" && base !== "auditoria-tse" && base !== "panel")
      .map((base) => ({
        source: `/${base}/editar/:id`,
        destination: `/resultados/${base}/editar/:id`,
        permanent: false,
      }));

    return [
      ...authVotacionRedirects,
      ...electionsCompatRedirects,
      ...baseRedirects,
      ...createRedirects,
      ...editRedirects,
      {
        source: "/configuraciones/nueva",
        destination: "/resultados/configuraciones/nuevo",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
