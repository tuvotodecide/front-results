import { createDomainApiBootstrap } from "../../../shared/api/baseApiBootstrap";

export const votacionBootstrap = createDomainApiBootstrap({
  domain: "votacion",
  canonicalBasePath: "/votacion",
  canonicalLoginPath: "/votacion/login",
  legacyLoginPath: "/login",
  canonicalHomePath: "/votacion",
});
