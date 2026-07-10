import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import OperationalRechargePage from "@/features/adminTvd/screens/OperationalRechargePage";

const navigateMock = vi.fn();
let searchParams = new URLSearchParams();

vi.mock("@/domains/votacion/navigation/compat-private", () => ({
  useNavigate: () => navigateMock,
  useSearchParams: () => [searchParams, vi.fn()] as const,
}));

vi.mock("@/domains/votacion/components/KioskQrSvg", () => ({
  default: ({ value }: { value: string }) => <div aria-label="Código QR">{value}</div>,
}));

describe("Admin tenant operational recharge", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    navigateMock.mockReset();
    searchParams = new URLSearchParams();
  });

  it("renderiza paso 1, precarga monto de query y permite editar equivalente", async () => {
    const user = userEvent.setup();
    searchParams = new URLSearchParams("monto=750");

    render(<OperationalRechargePage />);

    const amountInput = screen.getByLabelText("Monto a recargar");
    expect(amountInput).toHaveValue("750");
    expect(screen.getByText("Equivalente estimado")).toBeInTheDocument();
    expect(screen.getByText("Bs. 375")).toBeInTheDocument();
    expect(screen.getByLabelText("Equivalente estimado").tagName).toBe("OUTPUT");
    expect(screen.getAllByRole("textbox")).toHaveLength(1);
    expect(screen.queryByText(/mock/i)).not.toBeInTheDocument();
    expect(await screen.findByText("Básico")).toBeInTheDocument();
    expect(screen.getByText("Estándar")).toBeInTheDocument();

    await user.clear(amountInput);
    await user.type(amountInput, "300");

    expect(amountInput).toHaveValue("300");
    expect(screen.getByText("Bs. 150")).toBeInTheDocument();
  });

  it("muestra Bs. 250 para 500 escrito y no muestra error con monto válido", async () => {
    const user = userEvent.setup();
    render(<OperationalRechargePage />);

    const amountInput = screen.getByLabelText("Monto a recargar");
    const continueButton = screen.getByRole("button", { name: /Continuar/i });

    await user.type(amountInput, "500");

    expect(amountInput).toHaveValue("500");
    expect(screen.getAllByText("Bs. 250").length).toBeGreaterThan(0);
    expect(screen.queryByText("Ingresa un monto válido para continuar.")).not.toBeInTheDocument();
    expect(continueButton).toBeEnabled();
  });

  it("calcula equivalente para monto manual y habilita Continuar con monto válido", async () => {
    const user = userEvent.setup();
    render(<OperationalRechargePage />);

    const amountInput = screen.getByLabelText("Monto a recargar");
    const continueButton = screen.getByRole("button", { name: /Continuar/i });

    expect(continueButton).toBeDisabled();
    expect(screen.getByText("Ingresa un monto válido para continuar.")).toBeInTheDocument();

    await user.type(amountInput, "100");

    expect(amountInput).toHaveValue("100");
    expect(screen.getByText("Bs. 50")).toBeInTheDocument();
    expect(screen.getByText("El monto se usará para cubrir el consumo operativo de la votación.")).toBeInTheDocument();
    expect(continueButton).toBeEnabled();
  });

  it("muestra Bs. 580 para 1200 escrito aunque no haya paquete seleccionado", async () => {
    const user = userEvent.setup();
    render(<OperationalRechargePage />);

    const amountInput = screen.getByLabelText("Monto a recargar");
    const standardOption = await screen.findByRole("button", { name: /Estándar/i });

    await user.type(amountInput, "1200");

    expect(amountInput).toHaveValue("1200");
    expect(screen.getAllByText("Bs. 580").length).toBeGreaterThan(0);
    expect(standardOption).toHaveAttribute("aria-pressed", "false");
  });

  it("bloquea monto vacío/cero/inválido y muestra ayuda", async () => {
    const user = userEvent.setup();
    render(<OperationalRechargePage />);

    const amountInput = screen.getByLabelText("Monto a recargar");
    const continueButton = screen.getByRole("button", { name: /Continuar/i });

    expect(continueButton).toBeDisabled();
    expect(screen.getByText("Ingresa un monto válido para continuar.")).toBeInTheDocument();

    await user.type(amountInput, "0");
    expect(continueButton).toBeDisabled();
    expect(screen.getByText("Ingresa un monto válido para continuar.")).toBeInTheDocument();

    await user.clear(amountInput);
    await user.type(amountInput, "abc");
    expect(amountInput).toHaveValue("");
    expect(continueButton).toBeDisabled();
  });

  it("las opciones rápidas actualizan monto, equivalente y estado seleccionado", async () => {
    const user = userEvent.setup();
    render(<OperationalRechargePage />);

    const amountInput = screen.getByLabelText("Monto a recargar");
    const basicOption = await screen.findByRole("button", { name: /Básico/i });
    const standardOption = screen.getByRole("button", { name: /Estándar/i });

    await user.click(basicOption);
    expect(amountInput).toHaveValue("500");
    expect(screen.getAllByText("Bs. 250").length).toBeGreaterThan(0);
    expect(basicOption).toHaveAttribute("aria-pressed", "true");

    await user.click(standardOption);
    expect(amountInput).toHaveValue("1200");
    expect(screen.getAllByText("Bs. 580").length).toBeGreaterThan(0);
    expect(standardOption).toHaveAttribute("aria-pressed", "true");
    expect(basicOption).toHaveAttribute("aria-pressed", "false");
  });

  it("limpia selección de paquete cuando se escribe un monto manual", async () => {
    const user = userEvent.setup();
    render(<OperationalRechargePage />);

    const amountInput = screen.getByLabelText("Monto a recargar");
    const basicOption = await screen.findByRole("button", { name: /Básico/i });

    await user.click(basicOption);
    expect(basicOption).toHaveAttribute("aria-pressed", "true");

    await user.clear(amountInput);
    await user.type(amountInput, "600");

    expect(amountInput).toHaveValue("600");
    expect(screen.getByText("Bs. 300")).toBeInTheDocument();
    expect(basicOption).toHaveAttribute("aria-pressed", "false");
  });

  it("completa flujo QR, verificación y confirmación", async () => {
    const user = userEvent.setup();
    render(<OperationalRechargePage />);

    await user.type(screen.getByLabelText("Monto a recargar"), "100");
    await user.click(screen.getByRole("button", { name: /Continuar/i }));

    expect(await screen.findByLabelText("Código QR")).toBeInTheDocument();
    expect(screen.getByText("QR válido por 15 minutos")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Descargar QR/i })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Ya realicé el pago/i }));
    expect(screen.getByText("Verificando pago...")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Recarga completada")).toBeInTheDocument();
    });
    expect(screen.getByText("Ya puedes continuar con tu votación.")).toBeInTheDocument();
    expect(screen.getByText("REC-100-2026")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Continuar" }));
    expect(navigateMock).toHaveBeenCalledWith("/votacion/elecciones");
  });

  it("permite copiar referencia de recarga confirmada", async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });

    render(<OperationalRechargePage />);
    await user.type(screen.getByLabelText("Monto a recargar"), "50");
    await user.click(screen.getByRole("button", { name: /Continuar/i }));
    await user.click(await screen.findByRole("button", { name: /Ya realicé el pago/i }));

    await screen.findByText("Recarga completada");
    await user.click(screen.getByRole("button", { name: /Copiar referencia/i }));

    expect(writeText).toHaveBeenCalledWith("REC-50-2026");
    expect(screen.getByText("Referencia copiada.")).toBeInTheDocument();
  });
});
