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

  it("maps official publication TVD and window codes to safe functional messages", () => {
    expect(
      getRequestErrorMessage(
        { data: { code: "TVD_CREDITS_INSUFFICIENT_CAPACITY" } },
        "Intenta nuevamente.",
      ),
    ).toBe("No tienes suficientes $TVD para publicar esta votación.");

    expect(
      getRequestErrorMessage(
        { data: { code: "PUBLICATION_WINDOW_CLOSED" } },
        "Intenta nuevamente.",
      ),
    ).toBe("El tiempo para publicar oficialmente esta votación ya terminó.");
  });
});
