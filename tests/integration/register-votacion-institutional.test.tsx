import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import RegisterVotacionPage from "@/domains/auth-votacion/screens/RegisterVotacionPage";
import { renderWithAuthStore } from "../utils/renderWithStore";

const navigate = vi.fn();
const createInstitutionalAdminApplication = vi.fn();
const resolveInstitutionalWalletByDni = vi.fn();
const listPublicInstitutionalTenants = vi.fn();
let currentSearchParams = new URLSearchParams();

vi.mock("@/store/auth/authEndpoints", () => ({
  useCreateInstitutionalAdminApplicationMutation: () => [
    createInstitutionalAdminApplication,
  ],
}));

vi.mock("@/store/institutionalWallets", () => ({
  useResolveInstitutionalWalletByDniMutation: () => [
    resolveInstitutionalWalletByDni,
  ],
}));

vi.mock("@/store/institutionalTenants", () => ({
  useLazyListPublicInstitutionalTenantsQuery: () => [
    listPublicInstitutionalTenants,
  ],
}));

vi.mock("@/domains/auth-votacion/navigation/compat", () => ({
  Link: ({ children, href, to }: { children: ReactNode; href?: string; to?: string }) => (
    <a href={href ?? to}>{children}</a>
  ),
  useNavigate: () => navigate,
  useSearchParams: () => [currentSearchParams],
}));

const wallet = "0x1234567890abcdef1234567890abcdef12345678";
const secondWallet = "0x2222222222222222222222222222222222222222";
const activeInstitution = {
  institutionId: "64b000000000000000000101",
  institutionName: "Colegio Activo",
};

const successfulResolve = (accountAddress = wallet) => ({
  unwrap: vi.fn().mockResolvedValue({
    registered: true,
    accountAddress,
  }),
});

const getInput = (container: HTMLElement, selector: string) =>
  container.querySelector(selector) as HTMLInputElement;

const submitForm = async (container: HTMLElement) => {
  const user = userEvent.setup();
  await user.type(getInput(container, '[data-cy="register-dni"]'), "12345678");
  expect(await screen.findByDisplayValue(wallet)).toBeInTheDocument();
  await user.type(getInput(container, '[data-cy="register-name"]'), "Admin Tenant");
  await user.type(getInput(container, '[data-cy="register-email"]'), "admin@test.com");
  await user.type(
    getInput(container, '[data-cy="register-tenant-name"]'),
    "Institución Test",
  );
  await user.type(getInput(container, '[data-cy="register-password"]'), "12345678");
  await user.type(
    getInput(container, '[data-cy="register-confirm-password"]'),
    "12345678",
  );
  await user.click(screen.getByRole("button", { name: "Registrarse" }));
};

const fillBaseFields = async (container: HTMLElement) => {
  const user = userEvent.setup();
  await user.type(getInput(container, '[data-cy="register-dni"]'), "12345678");
  expect(await screen.findByDisplayValue(wallet)).toBeInTheDocument();
  await user.type(getInput(container, '[data-cy="register-name"]'), "Admin Tenant");
  await user.type(getInput(container, '[data-cy="register-email"]'), "admin@test.com");
  await user.type(getInput(container, '[data-cy="register-password"]'), "12345678");
  await user.type(
    getInput(container, '[data-cy="register-confirm-password"]'),
    "12345678",
  );
  return user;
};

const selectExistingInstitution = async (container: HTMLElement) => {
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", {
    name: "Solicitar acceso a una institución existente",
  }));
  await user.type(
    getInput(container, '[data-cy="register-institution-search"]'),
    "Colegio",
  );
  await user.click(screen.getByRole("button", { name: "Buscar" }));
  await user.click(await screen.findByRole("button", { name: "Colegio Activo" }));
};

describe("MX-02 | Gestión de instituciones, administradores y wallets | Frontend Admin | Registro institucional", () => {
  beforeEach(() => {
    navigate.mockReset();
    createInstitutionalAdminApplication.mockReset();
    resolveInstitutionalWalletByDni.mockReset();
    currentSearchParams = new URLSearchParams();
    createInstitutionalAdminApplication.mockReturnValue({
      unwrap: vi.fn().mockResolvedValue({ ok: true }),
    });
    resolveInstitutionalWalletByDni.mockReturnValue(successfulResolve());
    listPublicInstitutionalTenants.mockReset();
    listPublicInstitutionalTenants.mockReturnValue({
      unwrap: vi.fn().mockResolvedValue({
        items: [activeInstitution],
        total: 1,
        page: 1,
        limit: 10,
      }),
    });
  });

  it("D-NEW-001 / D-NEW-006 / D-NEW-007 | resuelve wallet por DNI, la muestra completa y no la envia en el registro final", async () => {
    const { container } = renderWithAuthStore(<RegisterVotacionPage />);
    await submitForm(container);

    await waitFor(() => {
      expect(createInstitutionalAdminApplication).toHaveBeenCalledWith({
        dni: "12345678",
        name: "Admin Tenant",
        email: "admin@test.com",
        password: "12345678",
        institutionName: "Institución Test",
      });
    });
    expect(resolveInstitutionalWalletByDni).toHaveBeenCalledWith({
      dni: "12345678",
    });
    expect(getInput(container, '[data-cy="register-account-address"]')).toHaveAttribute(
      "readonly",
    );
    expect(createInstitutionalAdminApplication.mock.calls[0][0]).not.toHaveProperty(
      "accountAddress",
    );
    expect(navigate).toHaveBeenCalledWith("/votacion/pendiente", {
      replace: true,
    });
  });

  it("D-NEW-002 / D-NEW-003 / D-NEW-004 | muestra modos de institucion, busca activas y envia institutionId para una solicitud existente", async () => {
    const { container } = renderWithAuthStore(<RegisterVotacionPage />);
    const user = await fillBaseFields(container);

    expect(
      screen.getByRole("button", { name: "Crear una nueva institución" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: "Solicitar acceso a una institución existente",
      }),
    ).toBeInTheDocument();

    await selectExistingInstitution(container);
    expect(listPublicInstitutionalTenants).toHaveBeenCalledWith({
      search: "Colegio",
      page: 1,
      limit: 10,
    });
    expect(screen.getByText("Institución seleccionada: Colegio Activo")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Solicitar acceso" }));

    await waitFor(() => {
      expect(createInstitutionalAdminApplication).toHaveBeenCalledWith({
        dni: "12345678",
        name: "Admin Tenant",
        email: "admin@test.com",
        password: "12345678",
        institutionId: activeInstitution.institutionId,
      });
    });
    expect(createInstitutionalAdminApplication.mock.calls[0][0]).not.toHaveProperty(
      "institutionName",
    );
    expect(createInstitutionalAdminApplication.mock.calls[0][0]).not.toHaveProperty(
      "accountAddress",
    );
  });

  it("D-NEW-005 | no permite texto arbitrario como institucion existente", async () => {
    const { container } = renderWithAuthStore(<RegisterVotacionPage />);
    const user = await fillBaseFields(container);

    await user.click(screen.getByRole("button", {
      name: "Solicitar acceso a una institución existente",
    }));
    await user.type(
      getInput(container, '[data-cy="register-institution-search"]'),
      "Institución inventada",
    );
    await user.click(screen.getByRole("button", { name: "Solicitar acceso" }));

    expect(await screen.findByText("Selecciona una institución activa")).toBeInTheDocument();
    expect(createInstitutionalAdminApplication).not.toHaveBeenCalled();
  });

  it("D-NEW-008 / D-RETRY-001 | limpia valores ocultos al alternar entre institucion nueva y existente", async () => {
    const user = userEvent.setup();
    const { container } = renderWithAuthStore(<RegisterVotacionPage />);

    await user.type(
      getInput(container, '[data-cy="register-tenant-name"]'),
      "Nueva Institución",
    );
    await user.click(screen.getByRole("button", {
      name: "Solicitar acceso a una institución existente",
    }));
    expect(
      container.querySelector('[data-cy="register-tenant-name"]'),
    ).not.toBeInTheDocument();

    await user.type(
      getInput(container, '[data-cy="register-institution-search"]'),
      "Colegio",
    );
    await user.click(screen.getByRole("button", { name: "Buscar" }));
    await user.click(await screen.findByRole("button", { name: "Colegio Activo" }));
    expect(screen.getByText("Institución seleccionada: Colegio Activo")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Crear una nueva institución" }));
    expect(
      container.querySelector('[data-cy="register-institution-search"]'),
    ).not.toBeInTheDocument();
    expect(getInput(container, '[data-cy="register-tenant-name"]')).toHaveValue("");
  });

  it("D-NEW-009 / D-NEW-010 | muestra mensajes controlados del catalogo publico", async () => {
    const user = userEvent.setup();
    listPublicInstitutionalTenants.mockReturnValueOnce({
      unwrap: vi.fn().mockResolvedValue({
        items: [],
        total: 0,
        page: 1,
        limit: 10,
      }),
    });

    const { container, unmount } = renderWithAuthStore(<RegisterVotacionPage />);
    await user.click(screen.getByRole("button", {
      name: "Solicitar acceso a una institución existente",
    }));
    await user.type(getInput(container, '[data-cy="register-institution-search"]'), "Nada");
    await user.click(screen.getByRole("button", { name: "Buscar" }));
    expect(
      await screen.findByText("No hay instituciones disponibles en este momento."),
    ).toBeInTheDocument();
    unmount();

    listPublicInstitutionalTenants.mockReturnValueOnce({
      unwrap: vi.fn().mockRejectedValue({ status: 500 }),
    });
    const rendered = renderWithAuthStore(<RegisterVotacionPage />);
    await user.click(screen.getByRole("button", {
      name: "Solicitar acceso a una institución existente",
    }));
    await user.type(
      getInput(rendered.container, '[data-cy="register-institution-search"]'),
      "Colegio",
    );
    await user.click(screen.getByRole("button", { name: "Buscar" }));
    expect(
      await screen.findByText("No fue posible cargar las instituciones. Intente nuevamente."),
    ).toBeInTheDocument();
  });

  it.each([
    [
      "D-REQ-004",
      "mantiene pendiente la solicitud duplicada",
      "Ya tienes una solicitud pendiente para esta institución.",
    ],
    [
      "D-COMPAT-001",
      "detecta administrador institucional existente",
      "Ya administras esta institución.",
    ],
    [
      "D-STATE-002",
      "rechaza institución no disponible",
      "La institución seleccionada no está disponible.",
    ],
  ])("%s | %s", async (_id, _scenario, message) => {
    createInstitutionalAdminApplication.mockReturnValueOnce({
      unwrap: vi.fn().mockRejectedValue({ data: { message } }),
    });
    const { container } = renderWithAuthStore(<RegisterVotacionPage />);
    const user = await fillBaseFields(container);
    await selectExistingInstitution(container);

    await user.click(screen.getByRole("button", { name: "Solicitar acceso" }));

    expect(await screen.findByText(message)).toBeInTheDocument();
  });

  it("D-NEW-011 | bloquea el envio cuando el CI o DNI no corresponde a una persona registrada", async () => {
    const user = userEvent.setup();
    resolveInstitutionalWalletByDni.mockReturnValue({
      unwrap: vi.fn().mockResolvedValue({
        registered: false,
        accountAddress: null,
        reason: "PERSON_NOT_REGISTERED",
      }),
    });

    const { container } = renderWithAuthStore(<RegisterVotacionPage />);

    await user.type(getInput(container, '[data-cy="register-dni"]'), "12345678");
    expect(
      await screen.findByText("Debe registrarse primero en Tu Voto Decide."),
    ).toBeInTheDocument();

    expect(screen.getByRole("button", { name: "Registrarse" })).toBeDisabled();
    expect(createInstitutionalAdminApplication).not.toHaveBeenCalled();
  });

  it("D-NEW-012 | bloquea el envio cuando la persona registrada no tiene billetera", async () => {
    const user = userEvent.setup();
    resolveInstitutionalWalletByDni.mockReturnValue({
      unwrap: vi.fn().mockResolvedValue({
        registered: false,
        accountAddress: null,
        reason: "WALLET_NOT_FOUND",
      }),
    });

    const { container } = renderWithAuthStore(<RegisterVotacionPage />);

    await user.type(getInput(container, '[data-cy="register-dni"]'), "12345678");
    expect(
      await screen.findByText(
        "Debe crear o registrar primero su billetera en Tu Voto Decide.",
      ),
    ).toBeInTheDocument();

    expect(screen.getByRole("button", { name: "Registrarse" })).toBeDisabled();
    expect(createInstitutionalAdminApplication).not.toHaveBeenCalled();
  });

  it("D-NEW-013 / D-MAIL-001 | muestra conflicto de correo ocupado y no finaliza el registro", async () => {
    createInstitutionalAdminApplication.mockReturnValueOnce({
      unwrap: vi.fn().mockRejectedValue({
        data: { message: "El email o DNI ya está asociado a otro usuario" },
      }),
    });
    const { container } = renderWithAuthStore(<RegisterVotacionPage />);
    await submitForm(container);

    expect(
      await screen.findByText("El email o DNI ya está asociado a otro usuario"),
    ).toBeInTheDocument();
    expect(navigate).not.toHaveBeenCalledWith("/votacion/pendiente", {
      replace: true,
    });
  });

  it("D-REG-001 / D-REG-002 | limpia la wallet anterior cuando cambia el DNI", async () => {
    const user = userEvent.setup();
    resolveInstitutionalWalletByDni
      .mockReturnValueOnce(successfulResolve(wallet))
      .mockReturnValueOnce(successfulResolve(secondWallet));

    const { container } = renderWithAuthStore(<RegisterVotacionPage />);

    const dniInput = getInput(container, '[data-cy="register-dni"]');
    await user.type(dniInput, "12345678");
    expect(await screen.findByDisplayValue(wallet)).toBeInTheDocument();

    await user.clear(dniInput);
    expect(getInput(container, '[data-cy="register-account-address"]')).toHaveValue("");

    await user.type(dniInput, "87654321");
    expect(await screen.findByDisplayValue(secondWallet)).toBeInTheDocument();
  });

  it("D-NEW-014 | muestra mensaje seguro cuando el endpoint responde rate limit", async () => {
    const user = userEvent.setup();
    resolveInstitutionalWalletByDni.mockReturnValue({
      unwrap: vi.fn().mockRejectedValue({ status: 429 }),
    });

    const { container } = renderWithAuthStore(<RegisterVotacionPage />);

    await user.type(getInput(container, '[data-cy="register-dni"]'), "12345678");

    expect(
      await screen.findByText(
        "Se realizaron demasiados intentos. Intente nuevamente más tarde.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Registrarse" })).toBeDisabled();
  });

  it("D-NEW-015 / D-REG-003 | muestra mensaje controlado cuando falla la consulta de wallet", async () => {
    const user = userEvent.setup();
    resolveInstitutionalWalletByDni.mockReturnValue({
      unwrap: vi.fn().mockRejectedValue({ status: "FETCH_ERROR" }),
    });

    const { container } = renderWithAuthStore(<RegisterVotacionPage />);

    await user.type(getInput(container, '[data-cy="register-dni"]'), "12345678");

    expect(
      await screen.findByText(
        "No fue posible consultar la billetera en este momento. Intente nuevamente.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Registrarse" })).toBeDisabled();
  });
});
