import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import InstitutionalAccountPage from "@/features/adminTvd/screens/InstitutionalAccountPage";
import { walletValidationFixtures } from "@/features/adminTvd/data/adminTvd.mock";

describe("Admin tenant institutional account", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
  });

  it("renderiza cuentas mock, estados y acciones sin opción Principal", async () => {
    render(<InstitutionalAccountPage />);

    expect(await screen.findByRole("heading", { name: "Cuenta institucional" })).toBeInTheDocument();
    expect(screen.getByText("Cuentas vinculadas a tu institución para operar votaciones.")).toBeInTheDocument();
    expect(screen.getByText("Cuenta administrativa")).toBeInTheDocument();
    expect(screen.getByText("Cuenta operativa")).toBeInTheDocument();
    expect(screen.getByText("Cuenta auxiliar")).toBeInTheDocument();
    expect(screen.getAllByText("Validada").length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText("Deshabilitada")).toBeInTheDocument();
    expect(screen.queryByText("Principal")).not.toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /Explorer/i }).length).toBeGreaterThan(0);
  });

  it("copia dirección y deshabilita una cuenta validada", async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    render(<InstitutionalAccountPage />);

    await screen.findByText("Cuenta administrativa");
    await user.click(screen.getAllByRole("button", { name: "Copiar" })[0]);

    expect(writeText).toHaveBeenCalled();
    expect(screen.getByText("Dirección copiada.")).toBeInTheDocument();

    await user.click(screen.getAllByRole("button", { name: "Deshabilitar" })[0]);
    expect(screen.getByText("Cuenta deshabilitada.")).toBeInTheDocument();
  });

  it("valida dirección inválida, no encontrada y ya vinculada", async () => {
    const user = userEvent.setup();
    render(<InstitutionalAccountPage />);

    await user.click(await screen.findByRole("button", { name: "Agregar cuenta" }));
    const addressInput = screen.getByLabelText("Dirección");
    const addButton = screen.getByRole("button", { name: "Agregar" });

    expect(addButton).toBeDisabled();

    await user.type(addressInput, "no-es-wallet");
    expect(await screen.findByText("Ingresa una dirección válida.")).toBeInTheDocument();
    expect(addButton).toBeDisabled();

    await user.clear(addressInput);
    await user.type(addressInput, walletValidationFixtures.notFound);
    expect(await screen.findByText("No encontramos una cuenta registrada con esa dirección.")).toBeInTheDocument();
    expect(addButton).toBeDisabled();

    await user.clear(addressInput);
    await user.type(addressInput, walletValidationFixtures.alreadyLinked);
    expect(await screen.findByText("Esta cuenta ya está vinculada a la institución.")).toBeInTheDocument();
    expect(addButton).toBeDisabled();
  });

  it("agrega una cuenta disponible con alias obligatorio", async () => {
    const user = userEvent.setup();
    render(<InstitutionalAccountPage />);

    await user.click(await screen.findByRole("button", { name: "Agregar cuenta" }));
    await user.type(screen.getByLabelText("Dirección"), walletValidationFixtures.available.address);

    expect(await screen.findByText("Cuenta encontrada. Puedes agregarla a tu institución.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Agregar" })).toBeDisabled();
    expect(screen.getByText("Ingresa un alias para identificar la cuenta.")).toBeInTheDocument();

    await user.type(screen.getByLabelText("Alias o nombre"), "Cuenta suplente");
    await user.click(screen.getByRole("button", { name: "Agregar" }));

    expect(await screen.findByText("Cuenta agregada correctamente.")).toBeInTheDocument();
    expect(screen.getByText("Cuenta suplente")).toBeInTheDocument();
    expect(screen.getAllByText("Validada").length).toBeGreaterThanOrEqual(3);
  });

  it("cancelar cierra el modal de agregar cuenta", async () => {
    const user = userEvent.setup();
    render(<InstitutionalAccountPage />);

    await user.click(await screen.findByRole("button", { name: "Agregar cuenta" }));
    expect(screen.getByRole("dialog", { name: "Agregar cuenta" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(screen.queryByRole("dialog", { name: "Agregar cuenta" })).not.toBeInTheDocument();
  });
});
