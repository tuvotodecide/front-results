import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import SuperadminHomePage from "@/domains/superadmin/screens/SuperadminHomePage";
import TvdAssignmentPage from "@/domains/superadmin/screens/TvdAssignmentPage";
import TvdContractPage from "@/domains/superadmin/screens/TvdContractPage";
import TvdParametersPage from "@/domains/superadmin/screens/TvdParametersPage";
import { mockAssignmentTxHash } from "@/domains/superadmin/data/superadminTvd.mock";
import * as clipboardService from "@/domains/superadmin/services/clipboard";

describe("pantallas Superadmin", () => {
  beforeEach(() => {
    vi.spyOn(clipboardService, "copyTextToClipboard").mockResolvedValue(
      undefined,
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renderiza panel principal con las 7 cards y links", () => {
    render(<SuperadminHomePage />);

    expect(screen.getByRole("heading", { name: "Panel Superadmin" })).toBeInTheDocument();
    const expectedLinks = [
      ["/superadmin/tvd/contrato", /Contrato \$TVD/i],
      ["/superadmin/tvd/parametros", /Parámetros económicos/i],
      ["/superadmin/tvd/asignacion", /Asignación manual/i],
      ["/superadmin/tvd/operaciones", /Operaciones \$TVD/i],
      ["/superadmin/tvd/consulta-billetera", /Consulta billetera/i],
      ["/superadmin/gestion/registros", /Gestión de registros/i],
      ["/superadmin/gestion/recuperacion", /Recuperación institucional/i],
    ] as const;

    expectedLinks.forEach(([href, name]) => {
      expect(screen.getByRole("link", { name })).toHaveAttribute("href", href);
    });
  });

  it("renderiza contrato $TVD con red, txHash, firmantes y fondos", () => {
    render(<TvdContractPage />);

    expect(screen.getByText("Base L2")).toBeInTheDocument();
    expect(screen.getByText(/0x4A3b8C1D/i)).toBeInTheDocument();
    expect(screen.getByText(/0xdeadc0de/i)).toBeInTheDocument();
    expect(screen.getByText("Firmante 1")).toBeInTheDocument();
    expect(screen.getByText("Tesorería y Expansión B2B")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /Comprobar en la web/i }).length).toBeGreaterThan(1);
  });

  it("abre y cierra modal informativo de parámetros económicos", async () => {
    const user = userEvent.setup();
    render(<TvdParametersPage />);

    expect(screen.getByText("Consumo por voto válido")).toBeInTheDocument();
    expect(screen.getByText("Porcentaje de quema")).toBeInTheDocument();
    expect(screen.getByText("Recompensa por voto válido")).toBeInTheDocument();

    await user.click(screen.getAllByRole("button", { name: /Editar/i })[0]);

    expect(
      screen.getByRole("dialog", {
        name: /Editar parámetro desde contrato inteligente/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Este parámetro no se edita directamente desde el panel/i),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Abrir en blockchain/i })).toBeInTheDocument();

    await user.click(screen.getAllByRole("button", { name: /^Cerrar$/i })[1]);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("valida y completa el wizard de asignación manual", async () => {
    const user = userEvent.setup();
    render(<TvdAssignmentPage />);

    expect(screen.getByText("Tribunal Supremo Electoral")).toBeInTheDocument();
    expect(screen.getByText("Universidad Mayor de San Andrés")).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText("Buscar institución"), "Universidad");
    expect(screen.queryByText("Municipio de La Paz")).not.toBeInTheDocument();

    await user.click(screen.getByText("Universidad Mayor de San Andrés"));
    expect(
      screen.getByText("Solo se puede continuar con instituciones validadas."),
    ).toBeInTheDocument();

    await user.clear(screen.getByPlaceholderText("Buscar institución"));
    await user.click(screen.getByText("Tribunal Supremo Electoral"));

    expect(screen.getByText("2. Datos de asignación")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Revisar y firmar/i }));
    expect(screen.getByText("Ingresa un monto numérico mayor a 0.")).toBeInTheDocument();
    expect(
      screen.getByText("Describe la razón auditada de la asignación."),
    ).toBeInTheDocument();

    await user.type(screen.getByLabelText(/Monto en \$TVD/i), "1000");
    await user.type(
      screen.getByLabelText(/Debe describir la razón porque esto está auditado/i),
      "Regalo para prueba piloto de votación",
    );
    await user.click(screen.getByRole("button", { name: /Revisar y firmar/i }));

    expect(screen.getByText("Resumen de operación")).toBeInTheDocument();
    expect(screen.getByText("Ecosistema y Votantes / Vota y Gana")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Firmar con MetaMask/i }));
    expect(screen.getByText("Confirmar operación en MetaMask")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Transacción confirmada")).toBeInTheDocument();
    });
    expect(screen.getByText(mockAssignmentTxHash)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Copiar txHash/i }));
    await waitFor(() => {
      expect(clipboardService.copyTextToClipboard).toHaveBeenCalledWith(
        mockAssignmentTxHash,
      );
    });

    await user.click(screen.getByRole("button", { name: /Nueva asignación/i }));
    expect(screen.getByText("1. Seleccionar institución")).toBeInTheDocument();
  });
});
