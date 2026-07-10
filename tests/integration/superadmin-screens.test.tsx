import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import SuperadminHomePage from "@/domains/superadmin/screens/SuperadminHomePage";
import InstitutionalRecoveryPublicPage from "@/domains/auth-votacion/screens/InstitutionalRecoveryPublicPage";
import InstitutionalRecoveryAdminPage from "@/domains/superadmin/screens/InstitutionalRecoveryAdminPage";
import TvdAssignmentPage from "@/domains/superadmin/screens/TvdAssignmentPage";
import TvdContractPage from "@/domains/superadmin/screens/TvdContractPage";
import TvdOperationsPage from "@/domains/superadmin/screens/TvdOperationsPage";
import TvdParametersPage from "@/domains/superadmin/screens/TvdParametersPage";
import TvdWalletLookupPage from "@/domains/superadmin/screens/TvdWalletLookupPage";
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

  it("filtra operaciones $TVD y muestra resumen por institución", async () => {
    const user = userEvent.setup();
    render(<TvdOperationsPage />);

    expect(screen.getByRole("heading", { name: "Operaciones $TVD" })).toBeInTheDocument();
    expect(screen.getAllByText("Mostrando 8 de 8 operaciones").length).toBeGreaterThan(0);
    expect(screen.getAllByText("txHash").length).toBeGreaterThan(0);

    await user.selectOptions(
      screen.getAllByRole("combobox")[0],
      "Tribunal Supremo Electoral",
    );

    expect(screen.getByText("Total operaciones")).toBeInTheDocument();
    expect(screen.getByText("503 $TVD")).toBeInTheDocument();
    expect(screen.getAllByText("1 $TVD").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Mostrando 3 de 8 operaciones").length).toBeGreaterThan(0);
    expect(
      screen.getAllByRole("link", { name: /Comprobar en la web/i }).length,
    ).toBeGreaterThanOrEqual(3);
  });

  it("filtra operaciones por tipo y rango de fechas, y permite copiar txHash", async () => {
    const user = userEvent.setup();
    render(<TvdOperationsPage />);

    await user.selectOptions(screen.getAllByRole("combobox")[1], "Quema");

    expect(screen.getAllByText("Quema").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Mostrando 1 de 8 operaciones").length).toBeGreaterThan(0);

    await user.selectOptions(screen.getAllByRole("combobox")[1], "Todas");
    await user.type(screen.getAllByPlaceholderText("dd/mm/aaaa")[0], "26/06/2026");
    await user.type(screen.getAllByPlaceholderText("dd/mm/aaaa")[1], "26/06/2026");

    expect(screen.getAllByText("26 Jun 2026").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Mostrando 1 de 8 operaciones").length).toBeGreaterThan(0);

    await user.click(screen.getAllByRole("button", { name: /Copiar/i })[0]);

    await waitFor(() => {
      expect(clipboardService.copyTextToClipboard).toHaveBeenCalledWith(
        "0xjkl4567890...def4",
      );
    });
  });

  it("consulta una billetera mock y muestra detalle de saldo", async () => {
    const user = userEvent.setup();
    render(<TvdWalletLookupPage />);

    expect(
      screen.getByText("Ingresa una dirección de wallet para consultar."),
    ).toBeInTheDocument();

    await user.type(
      screen.getByLabelText(/Dirección de wallet/i),
      "0x1234794723747832234792342341432231",
    );
    await user.click(screen.getByRole("button", { name: /Consultar/i }));

    expect(screen.getByText("Detalle de billetera")).toBeInTheDocument();
    expect(screen.getByText("Sí pertenece")).toBeInTheDocument();
    expect(screen.getByText("100 $TVD")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Ver en explorer/i })).toBeInTheDocument();
  });

  it("mantiene estado vacío de billetera sin input y permite copiar la wallet consultada", async () => {
    const user = userEvent.setup();
    render(<TvdWalletLookupPage />);

    await user.click(screen.getByRole("button", { name: /Consultar/i }));
    expect(screen.queryByText("Detalle de billetera")).not.toBeInTheDocument();
    expect(
      screen.getByText("Ingresa una dirección de wallet para consultar."),
    ).toBeInTheDocument();

    await user.type(
      screen.getByLabelText(/Dirección de wallet/i),
      "0x1234794723747832234792342341432231",
    );
    await user.click(screen.getByRole("button", { name: /Consultar/i }));
    await user.click(screen.getByRole("button", { name: /Copiar/i }));

    await waitFor(() => {
      expect(clipboardService.copyTextToClipboard).toHaveBeenCalledWith(
        "0x1234794723747832234792342341432231",
      );
    });
  });

  it("aprueba una solicitud de recuperación institucional y muestra toast", async () => {
    const user = userEvent.setup();
    render(<InstitutionalRecoveryAdminPage />);

    expect(
      screen.getByRole("heading", { name: "Recuperación institucional" }),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Nuevo administrador").length).toBeGreaterThan(0);

    await user.click(screen.getAllByRole("button", { name: /Ver detalle/i })[0]);
    expect(
      screen.getByRole("dialog", { name: /Detalle de solicitud/i }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByText("Pérdida de acceso a wallet principal").length,
    ).toBeGreaterThan(0);

    await user.type(
      screen.getByPlaceholderText(/Indique las razones/i),
      "Identidad verificada localmente",
    );
    await user.click(screen.getByRole("button", { name: /^Aprobar$/i }));
    expect(screen.getByRole("dialog", { name: /¿Estás seguro\?/i })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Sí, dar acceso/i }));

    await waitFor(() => {
      expect(screen.getByText("Cuenta restablecida")).toBeInTheDocument();
    });
    expect(
      screen.getByText("Se le envió un correo de confirmación"),
    ).toBeInTheDocument();
  });

  it("filtra recuperación institucional por estado, bloquea acciones no pendientes y permite rechazar pendientes", async () => {
    const user = userEvent.setup();
    render(<InstitutionalRecoveryAdminPage />);

    await user.selectOptions(screen.getByRole("combobox"), "Aprobada");

    expect(screen.getAllByText("Municipio de La Paz").length).toBeGreaterThan(0);
    expect(screen.queryByText("Universidad Mayor de San Andrés")).not.toBeInTheDocument();

    await user.click(screen.getAllByRole("button", { name: /Ver detalle/i })[0]);
    expect(screen.getByRole("button", { name: /^Aprobar$/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /^Rechazar$/i })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Cerrar" }));

    await user.selectOptions(screen.getByRole("combobox"), "Todas");
    await user.clear(screen.getByPlaceholderText("Buscar institución o correo"));
    await user.type(screen.getByPlaceholderText("Buscar institución o correo"), "ana.gomez");

    expect(screen.getAllByText("Tribunal Supremo Electoral").length).toBeGreaterThan(0);
    expect(screen.queryByText("Municipio de La Paz")).not.toBeInTheDocument();

    await user.click(screen.getAllByRole("button", { name: /Ver detalle/i })[0]);
    await user.type(
      screen.getByPlaceholderText(/Indique las razones/i),
      "No se pudo verificar al solicitante",
    );
    await user.click(screen.getByRole("button", { name: /^Rechazar$/i }));

    await waitFor(() => {
      expect(screen.queryByRole("dialog", { name: /Detalle de solicitud/i })).not.toBeInTheDocument();
    });
    expect(screen.getAllByText("Rechazada").length).toBeGreaterThan(0);
  });

  it("envía una solicitud pública de recuperación institucional con datos mock", async () => {
    const user = userEvent.setup();
    render(<InstitutionalRecoveryPublicPage />);

    expect(
      screen.getByRole("heading", { name: "Recuperar acceso institucional" }),
    ).toBeInTheDocument();

    await user.selectOptions(
      screen.getByLabelText(/Nombre de la institución/i),
      "Tribunal Supremo Electoral",
    );
    await user.type(screen.getByLabelText(/Nombre completo/i), "Ana Gómez");
    await user.type(screen.getByLabelText(/Número de teléfono/i), "78945612");
    await user.type(screen.getByLabelText(/Nuevo Correo/i), "ana.gomez@tse.gob.bo");
    await user.type(
      screen.getByLabelText(/inmediato superior/i),
      "70000000",
    );
    await user.click(screen.getByRole("button", { name: /Enviar solicitud/i }));

    expect(screen.getByRole("heading", { name: "Solicitud enviada" })).toBeInTheDocument();
    expect(screen.getByText("Tribunal Supremo Electoral")).toBeInTheDocument();
    expect(screen.getByText("ana.gomez@tse.gob.bo")).toBeInTheDocument();
    expect(screen.getByText("Pendiente de revisión")).toBeInTheDocument();
  });

  it("valida campos obligatorios de recuperación institucional pública y conserva volver al login", async () => {
    const user = userEvent.setup();
    render(<InstitutionalRecoveryPublicPage />);

    expect(screen.getByRole("link", { name: /Volver al login/i })).toHaveAttribute(
      "href",
      "/votacion/login",
    );

    await user.click(screen.getByRole("button", { name: /Enviar solicitud/i }));

    expect(screen.getAllByText("Este campo es obligatorio.")).toHaveLength(5);
    expect(screen.queryByRole("heading", { name: "Solicitud enviada" })).not.toBeInTheDocument();
  });
});
