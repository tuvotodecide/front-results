import { createDomainApiBootstrap } from "../../../shared/api/baseApiBootstrap";

export const resultadosBootstrap = createDomainApiBootstrap({
  domain: "resultados",
  canonicalBasePath: "/resultados",
  canonicalLoginPath: "/resultados/login",
  legacyLoginPath: "/login",
  canonicalHomePath: "/resultados",
});
