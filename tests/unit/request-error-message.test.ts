import { getRequestErrorMessage } from "@/features/electionConfig/requestErrorMessage";

describe("request error message mapper", () => {
  it("normalizes backend validation arrays into a human message", () => {
    expect(
      getRequestErrorMessage(
        { data: { message: ["carnet debe ser alfanumerico"] } },
        "No se pudo guardar.",
      ),
    ).toBe("El carnet debe ser alfanumérico.");
  });

  it("normalizes nested backend validation objects without exposing technical errors", () => {
    expect(
      getRequestErrorMessage(
        { data: { message: { message: "carnet debe ser alfanumerico" } } },
        "No se pudo guardar.",
      ),
    ).toBe("El carnet debe ser alfanumérico.");
  });

  it("falls back when backend does not provide a usable message", () => {
    expect(getRequestErrorMessage({ data: { message: [] } }, "Intenta nuevamente.")).toBe(
      "Intenta nuevamente.",
    );
  });
});
