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
        {
          data: {
            code: "OFFICIAL_PUBLICATION_BALANCE_INSUFFICIENT",
            message: "Saldo TVD insuficiente para publicar.",
            details: {
              requiredTvd: "3000000000000000000",
              availableTvd: "1000000000000000000",
              deficitTvd: "2000000000000000000",
            },
          },
        },
        "Intenta nuevamente.",
      ),
    ).toBe(
      "No tienes suficientes $TVD para publicar esta votación. Requerido: 3 TVD. Disponible: 1 TVD. Déficit: 2 TVD.",
    );

    expect(
      getRequestErrorMessage(
        { data: { code: "OFFICIAL_PUBLICATION_MAX_TOKEN_EXCEEDED", message: "max" } },
        "Intenta nuevamente.",
      ),
    ).toBe(
      "La votación supera el máximo permitido por elección. Comprar más tokens no resolverá este límite.",
    );

    expect(
      getRequestErrorMessage(
        { data: { code: "PUBLICATION_WINDOW_CLOSED" } },
        "Intenta nuevamente.",
      ),
    ).toBe("El tiempo para publicar oficialmente esta votación ya terminó.");
  });
});
