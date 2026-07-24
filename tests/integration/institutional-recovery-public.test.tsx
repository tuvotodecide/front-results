import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import InstitutionalRecoveryPublicPage from "@/domains/auth-votacion/screens/InstitutionalRecoveryPublicPage";
import { renderWithAuthStore } from "../utils/renderWithStore";

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const requestFromFetch = (
  fetchMock: ReturnType<
    typeof vi.fn<(input: RequestInfo | URL) => Promise<Response>>
  >,
) => fetchMock.mock.calls.find(([input]) => {
  const request = input instanceof Request ? input : new Request(input);
  return request.method === "POST";
})?.[0];

const fillValidForm = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.type(screen.getByLabelText(/Institución/i), "Tribunal");
  await user.click(screen.getByRole("button", { name: /Buscar institución/i }));
  await user.click(
    await screen.findByRole("option", {
      name: /Tribunal Supremo Electoral/i,
    }),
  );
  await user.type(screen.getByLabelText(/Nombre completo/i), "Ana Gomez");
  await user.type(screen.getByLabelText(/Número de teléfono/i), "70000000");
  await user.type(
    screen.getAllByLabelText(/Nuevo correo/i)[0],
    " Admin.Nuevo@Institucion.BO ",
  );
  await user.type(
    screen.getByLabelText(/Confirmar nuevo correo/i),
    "admin.nuevo@institucion.bo",
  );
  await user.type(
    screen.getByLabelText(/Teléfono del superior inmediato/i),
    "71111111",
  );
};

describe("institutional recovery public request", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("envia la solicitud real con body minimo y respuesta no enumerativa", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const request = input instanceof Request ? input : new Request(input);
      const url = new URL(request.url);
      if (
        request.method === "GET" &&
        url.pathname === "/api/v1/institutional-tenants/public"
      ) {
        expect(url.searchParams.get("search")).toBe("Tribunal");
        expect(url.searchParams.get("limit")).toBe("10");
        return jsonResponse({
          items: [
            {
              institutionId: "64f1a7f4c5e8a8d0b9a12345",
              institutionName: "Tribunal Supremo Electoral",
            },
          ],
          total: 1,
          page: 1,
          limit: 10,
        });
      }
      return jsonResponse({
        requestId: "request-1",
        status: "PENDING",
        requestedAt: "2026-07-22T12:00:00.000Z",
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    renderWithAuthStore(<InstitutionalRecoveryPublicPage />);

    expect(
      screen.getByRole("heading", { name: "Actualizar correo institucional" }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/transferir/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/nuevo administrador/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/ID de la institución/i)).not.toBeInTheDocument();

    await fillValidForm(user);
    await user.click(screen.getByRole("button", { name: /Enviar solicitud/i }));

    expect(await screen.findByText("Solicitud enviada")).toBeInTheDocument();
    expect(
      screen.getByText(/Si la información corresponde a una cuenta institucional válida/i),
    ).toBeInTheDocument();
    expect(screen.queryByText("Tribunal Supremo Electoral")).not.toBeInTheDocument();
    expect(screen.queryByText("admin.nuevo@institucion.bo")).not.toBeInTheDocument();

    const request = requestFromFetch(fetchMock);
    expect(request).toBeInstanceOf(Request);
    if (request instanceof Request) {
      expect(new URL(request.url).pathname).toBe(
        "/api/v1/institutional-access-recovery-requests",
      );
      expect(request.method).toBe("POST");
      expect(request.headers.get("authorization")).toBeNull();
      expect(request.headers.get("x-api-key")).toBeNull();
      const body = (await request.clone().json()) as Record<string, unknown>;
      expect(body).toEqual({
        institutionId: "64f1a7f4c5e8a8d0b9a12345",
        fullName: "Ana Gomez",
        phoneNumber: "70000000",
        newEmail: "admin.nuevo@institucion.bo",
        supervisorPhoneNumber: "71111111",
      });
      expect(body).not.toHaveProperty("wallet");
      expect(body).not.toHaveProperty("institutionName");
      expect(body).not.toHaveProperty("userId");
      expect(body).not.toHaveProperty("assignmentId");
      expect(body).not.toHaveProperty("role");
      expect(body).not.toHaveProperty("authVersion");
      expect(body).not.toHaveProperty("resetToken");
      expect(body).not.toHaveProperty("password");
    }
  });

  it("valida campos invalidos y no ejecuta request", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn(async (_input: RequestInfo | URL) =>
      jsonResponse({}),
    );
    vi.stubGlobal("fetch", fetchMock);

    renderWithAuthStore(<InstitutionalRecoveryPublicPage />);

    await user.click(screen.getByRole("button", { name: /Enviar solicitud/i }));
    expect(screen.getByText("Selecciona una institución.")).toBeInTheDocument();
    expect(screen.getByText("Ingresa el nuevo correo.")).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();

    await user.type(screen.getByLabelText(/Institución/i), "x");
    await user.click(screen.getByRole("button", { name: /Buscar institución/i }));
    await user.type(screen.getByLabelText(/Nombre completo/i), "Ana Gomez");
    await user.type(screen.getByLabelText(/Número de teléfono/i), "70000000");
    await user.type(screen.getAllByLabelText(/Nuevo correo/i)[0], "correo");
    await user.type(
      screen.getByLabelText(/Confirmar nuevo correo/i),
      "otro@institucion.bo",
    );
    await user.type(
      screen.getByLabelText(/Teléfono del superior inmediato/i),
      "71111111",
    );
    await user.click(screen.getByRole("button", { name: /Enviar solicitud/i }));

    expect(
      screen.getByText("Ingresa al menos 2 caracteres para buscar la institución."),
    ).toBeInTheDocument();
    expect(screen.getByText("Selecciona una institución.")).toBeInTheDocument();
    expect(screen.getByText("Ingresa un correo válido.")).toBeInTheDocument();
    expect(screen.getByText("Los correos no coinciden.")).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("maneja busqueda publica de instituciones con error, retry y datos sanitizados", async () => {
    const user = userEvent.setup();
    const fetchMock = vi
      .fn<(input: RequestInfo | URL) => Promise<Response>>()
      .mockResolvedValueOnce(jsonResponse({ message: "database stack" }, 500))
      .mockResolvedValueOnce(
        jsonResponse({
          items: [
            {
              institutionId: "64f1a7f4c5e8a8d0b9a12345",
              institutionName: "Tribunal Supremo Electoral",
              accountAddress: "0xno-render",
              email: "private@example.test",
            },
          ],
          total: 1,
          page: 1,
          limit: 10,
        }),
      );
    vi.stubGlobal("fetch", fetchMock);

    renderWithAuthStore(<InstitutionalRecoveryPublicPage />);

    await user.type(screen.getByLabelText(/Institución/i), "Tribunal");
    await user.click(screen.getByRole("button", { name: /Buscar institución/i }));

    expect(
      await screen.findByText("No pudimos buscar instituciones. Intenta nuevamente."),
    ).toBeInTheDocument();
    expect(screen.queryByText(/database stack/i)).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Buscar institución/i }));

    expect(
      await screen.findByRole("option", {
        name: /Tribunal Supremo Electoral/i,
      }),
    ).toBeInTheDocument();
    expect(screen.queryByText("0xno-render")).not.toBeInTheDocument();
    expect(screen.queryByText("private@example.test")).not.toBeInTheDocument();
  });

  it("evita doble submit mientras la solicitud esta en curso", async () => {
    const user = userEvent.setup();
    let resolveRequest: (response: Response) => void = () => undefined;
    const pendingResponse = new Promise<Response>((resolve) => {
      resolveRequest = resolve;
    });
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      const request = input instanceof Request ? input : new Request(input);
      const url = new URL(request.url);
      if (
        request.method === "GET" &&
        url.pathname === "/api/v1/institutional-tenants/public"
      ) {
        return Promise.resolve(
          jsonResponse({
            items: [
              {
                institutionId: "64f1a7f4c5e8a8d0b9a12345",
                institutionName: "Tribunal Supremo Electoral",
              },
            ],
            total: 1,
            page: 1,
            limit: 10,
          }),
        );
      }
      return pendingResponse;
    });
    vi.stubGlobal("fetch", fetchMock);

    renderWithAuthStore(<InstitutionalRecoveryPublicPage />);
    await fillValidForm(user);

    await user.dblClick(screen.getByRole("button", { name: /Enviar solicitud/i }));
    const postCalls = fetchMock.mock.calls.filter(([input]) => {
      const request = input instanceof Request ? input : new Request(input);
      return request.method === "POST";
    });
    expect(postCalls).toHaveLength(1);

    resolveRequest(
      jsonResponse({
        requestId: "request-1",
        status: "PENDING",
        requestedAt: "2026-07-22T12:00:00.000Z",
      }),
    );
    expect(await screen.findByText("Solicitud enviada")).toBeInTheDocument();
  });

  it("muestra error seguro para duplicado, rate limit o timeout", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const request = input instanceof Request ? input : new Request(input);
      const url = new URL(request.url);
      if (
        request.method === "GET" &&
        url.pathname === "/api/v1/institutional-tenants/public"
      ) {
        return jsonResponse({
          items: [
            {
              institutionId: "64f1a7f4c5e8a8d0b9a12345",
              institutionName: "Tribunal Supremo Electoral",
            },
          ],
          total: 1,
          page: 1,
          limit: 10,
        });
      }
      return jsonResponse({ message: "Email already in use" }, 409);
    });
    vi.stubGlobal("fetch", fetchMock);

    renderWithAuthStore(<InstitutionalRecoveryPublicPage />);
    await fillValidForm(user);
    await user.click(screen.getByRole("button", { name: /Enviar solicitud/i }));

    expect(
      await screen.findByText(/No pudimos registrar la solicitud con esos datos/i),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Email already in use/i)).not.toBeInTheDocument();

    fetchMock.mockResolvedValueOnce(jsonResponse({ message: "Too many" }, 429));
    await user.click(screen.getByRole("button", { name: /Enviar solicitud/i }));
    await waitFor(() => {
      expect(screen.getByText(/demasiados intentos/i)).toBeInTheDocument();
    });
  });
});
