import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const docsRoot = join(
  process.cwd(),
  "docs/testing/official-publication-mobile-signature",
);

const readDoc = (name: string) => readFileSync(join(docsRoot, name), "utf8");

describe("official publication mobile signature coverage registry", () => {
  it("OPMS-FE-DOC-001 keeps the master matrix aligned with the documented total", () => {
    const matrix = readDoc("02A-matriz-tecnica-detallada.md");
    const summary = readDoc("08-resumen-cobertura.md");
    const caseRows = matrix
      .split("\n")
      .filter((line) => line.startsWith("| OPMS-"));

    expect(caseRows).toHaveLength(160);
    expect(summary).toContain("| Casos de matriz | 160 |");
    expect(summary).toContain("| IMPLEMENTED_PENDING_RUN | 137 |");
    expect(summary).toContain("| EXTERNAL_PENDING | 15 |");
  });

  it("OPMS-FE-DOC-002 documents every required system and accepted limitation", () => {
    const report = readDoc("01-informe-integral-implementacion.md");

    [
      "Frontend administrativo",
      "Backend Results",
      "Aplicacion movil",
      "Backend Identity",
      "Firebase/FCM",
      "Wira SDK",
      "Pimlico",
      "Paymaster",
      "Coinbase Smart Account",
      "EntryPoint",
      "Vote proxy",
      "TVDCredits",
      "TVDToken",
      "MongoDB",
      "READ_STATE_LOCAL_ONLY",
      "PERSONAL_TOPIC_NOT_SINGLE_TOKEN_GUARANTEE",
      "E2E_REAL_BASE_SEPOLIA_PENDING",
    ].forEach((requiredText) => {
      expect(report).toContain(requiredText);
    });
  });

  it("OPMS-FE-DOC-003 preserves the legacy boundary in the closure package", () => {
    const report = readDoc("01-informe-integral-implementacion.md");
    const traceability = readDoc("03-trazabilidad-implementacion-pruebas.md");

    expect(report).toContain("confirmOfficialPublication");
    expect(report).toContain("publishEvent");
    expect(report).toContain("El frontend administrativo nuevo debe utilizar");
    expect(traceability).toContain("OPMS-FE-LEG-001");
  });
});
