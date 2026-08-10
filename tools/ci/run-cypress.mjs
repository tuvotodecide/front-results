import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { existsSync } from "node:fs";
import path from "node:path";

const require = createRequire(import.meta.url);
const cypressPackage = require.resolve("cypress/package.json");
const cypressBin = path.join(path.dirname(cypressPackage), "bin", "cypress");
const args = process.argv.slice(2);

const matrix0306Specs = [
  "cypress/e2e/smoke/auth-and-guards.cy.ts",
  "cypress/e2e/smoke/election-management.cy.ts",
  "cypress/e2e/matrix-05-padron.cy.ts",
  "cypress/e2e/matrix-06-tvd-qr-publication.cy.ts",
];
const specArgumentIndex = args.indexOf("--spec");
const requestedSpecs = specArgumentIndex >= 0 ? args[specArgumentIndex + 1] ?? "" : "";

if (matrix0306Specs.every((spec) => requestedSpecs.split(",").includes(spec))) {
  const missingSpecs = matrix0306Specs.filter((spec) => !existsSync(spec));
  if (missingSpecs.length) {
    console.error(`Missing required MX-03 to MX-06 Cypress specs:\n${missingSpecs.map((spec) => `- ${spec}`).join("\n")}`);
    process.exit(1);
  }
}

const env = { ...process.env };
delete env.ELECTRON_RUN_AS_NODE;

const result = spawnSync(process.execPath, [cypressBin, ...args], {
  stdio: "inherit",
  env,
  shell: false,
});

if (result.error) {
  console.error(result.error);
  process.exit(1);
}

process.exit(result.status ?? 1);
