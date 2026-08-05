import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import {
  configureAssignmentMocks,
  createAssignmentFixtures,
  jsonResponse,
  renderAssignmentPage,
  resetAssignmentMocks,
} from "./helpers/mx06/assignmentHarness";

const institutionName = "Tribunal Supremo Electoral";
const eligibleWallet = "0x2222222222222222222222222222222222222222";
const foreignWallet = "0x9999999999999999999999999999999999999999";
const validReason = "Asignación operativa piloto";

async function selectEligibleInstitutionAndWallet(user: ReturnType<typeof userEvent.setup>) {
  await user.click(await screen.findByText(institutionName));
  await user.click(
    await screen.findByRole("button", { name: new RegExp(eligibleWallet, "i") }),
  );
}

async function enterValidAssignment(user: ReturnType<typeof userEvent.setup>) {
  await selectEligibleInstitutionAndWallet(user);
  await user.type(screen.getByLabelText(/Cantidad TVD/i), "25.5000");
  await user.type(screen.getByLabelText(/^Motivo/i), validReason);
  await user.click(screen.getByRole("button", { name: /Continuar/i }));
}

describe("MX-06 | asignación TVD", () => {
  afterEach(() => {
    resetAssignmentMocks();
  });

  it("[MX-06][TVD-ASSIGN-P0-001][INTEGRACION] envía una asignación válida a la wallet institucional elegible", async () => {
    const user = userEvent.setup();
    const { captured } = configureAssignmentMocks();

    renderAssignmentPage();
    await enterValidAssignment(user);
    await user.click(screen.getByRole("button", { name: /^Asignar$/i }));

    expect(
      await screen.findAllByText("Transacción enviada. Esperando confirmación."),
    ).not.toHaveLength(0);
    const requests = captured.filter(
      ({ method, pathname }) =>
        method === "POST" && pathname === "/api/v1/tvd/manual-assignments",
    );
    expect(requests).toHaveLength(1);
    expect(requests[0].headers.get("authorization")).toBe("Bearer superadmin-token");
    expect(requests[0].headers.get("idempotency-key")).toBe(
      "mx06-assignment-idempotency-key",
    );
    expect(requests[0].body).toEqual({
      tenantId: "tenant-1",
      assignmentId: "assignment-eligible",
      tokenAmount: "25.5",
      reason: validReason,
    });
  });

  it("[MX-06][TVD-ASSIGN-P0-002][INTEGRACION] bloquea wallets ajenas, suspendidas o no aprobadas", async () => {
    const user = userEvent.setup();
    const { captured } = configureAssignmentMocks();

    renderAssignmentPage();
    await user.click(await screen.findByText(institutionName));

    expect(
      screen.queryByRole("button", { name: new RegExp(foreignWallet, "i") }),
    ).not.toBeInTheDocument();
    await user.click(
      await screen.findByRole("button", {
        name: /0x3333333333333333333333333333333333333333/i,
      }),
    );
    expect(screen.getByText("Selecciona una wallet verificada y habilitada.")).toBeInTheDocument();
    await user.click(
      await screen.findByRole("button", {
        name: /0x4444444444444444444444444444444444444444/i,
      }),
    );
    expect(screen.getByText("Selecciona una wallet verificada y habilitada.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Continuar/i }));

    expect(screen.getByText("Selecciona una wallet institucional.")).toBeInTheDocument();
    expect(screen.queryByText("Resultado de asignación")).not.toBeInTheDocument();
    expect(
      captured.filter(
        ({ method, pathname }) =>
          method === "POST" && pathname === "/api/v1/tvd/manual-assignments",
      ),
    ).toHaveLength(0);
  });

  it("[MX-06][TVD-ASSIGN-P0-003][INTEGRACION] conserva datos cuando el formulario inválido recibe un rechazo recuperable", async () => {
    const user = userEvent.setup();
    let attempts = 0;
    configureAssignmentMocks({
      createAssignment: () => {
        attempts += 1;
        return attempts === 1
          ? jsonResponse({ code: "SERVER_ERROR", internal: "rpc://secret" }, 500)
          : jsonResponse(createAssignmentFixtures().pendingAssignment);
      },
    });

    renderAssignmentPage();
    await selectEligibleInstitutionAndWallet(user);
    await user.type(screen.getByLabelText(/Cantidad TVD/i), "1e3");
    await user.type(screen.getByLabelText(/^Motivo/i), "corto");
    await user.click(screen.getByRole("button", { name: /Continuar/i }));

    expect(screen.getByText("Ingresa una cantidad TVD mayor a 0.")).toBeInTheDocument();
    expect(screen.getByText("Describe un motivo de entre 8 y 240 caracteres.")).toBeInTheDocument();
    expect(screen.getByText("2. Wallet y datos de asignación")).toBeInTheDocument();
    await user.clear(screen.getByLabelText(/Cantidad TVD/i));
    await user.clear(screen.getByLabelText(/^Motivo/i));
    await user.type(screen.getByLabelText(/Cantidad TVD/i), "10");
    await user.type(screen.getByLabelText(/^Motivo/i), validReason);
    await user.click(screen.getByRole("button", { name: /Continuar/i }));
    await user.click(screen.getByRole("button", { name: /^Asignar$/i }));

    expect(
      await screen.findByText("No pudimos completar la operación. Intenta nuevamente."),
    ).toBeInTheDocument();
    expect(screen.getByText("10 TVD")).toBeInTheDocument();
    expect(screen.getByText(validReason)).toBeInTheDocument();
    expect(screen.queryByText(/rpc:\/\/secret/i)).not.toBeInTheDocument();
  });

  it("[MX-06][TVD-ASSIGN-P0-004][INTEGRACION] evita doble submit y conserva un único resultado visible", async () => {
    const user = userEvent.setup();
    let resolveCreate: ((response: Response) => void) | undefined;
    const { captured, fixtures } = configureAssignmentMocks({
      createAssignment: () =>
        new Promise<Response>((resolve) => {
          resolveCreate = resolve;
        }),
    });

    renderAssignmentPage();
    await enterValidAssignment(user);
    const assignButton = screen.getByRole("button", { name: /^Asignar$/i });
    await user.dblClick(assignButton);

    expect(assignButton).toBeDisabled();
    expect(
      captured.filter(
        ({ method, pathname }) =>
          method === "POST" && pathname === "/api/v1/tvd/manual-assignments",
      ),
    ).toHaveLength(1);
    resolveCreate?.(jsonResponse(fixtures.pendingAssignment));

    expect(await screen.findByRole("heading", { name: "Resultado de asignación" })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /Volver a asignaciones/i })).toHaveLength(1);
    expect(screen.queryByText("Asignación TVD confirmada.")).not.toBeInTheDocument();
  });

  it("[MX-06][TVD-ASSIGN-P0-005][INTEGRACION] muestra NEEDS_REVIEW recuperable sin inventar txHash y permite reintento", async () => {
    const user = userEvent.setup();
    const fixtures = createAssignmentFixtures();
    let attempts = 0;
    const { captured } = configureAssignmentMocks({
      fixtures,
      createAssignment: () => {
        attempts += 1;
        return attempts === 1
          ? jsonResponse({ code: "SERVER_ERROR", privateKey: "secret-key" }, 500)
          : jsonResponse(fixtures.needsReviewAssignment);
      },
      getAssignment: () => jsonResponse(fixtures.needsReviewAssignment),
    });

    renderAssignmentPage();
    await enterValidAssignment(user);
    await user.click(screen.getByRole("button", { name: /^Asignar$/i }));

    expect(
      await screen.findByText("No pudimos completar la operación. Intenta nuevamente."),
    ).toBeInTheDocument();
    expect(screen.getByText(institutionName)).toBeInTheDocument();
    expect(screen.getByText(eligibleWallet)).toBeInTheDocument();
    expect(screen.queryByText(/secret-key/i)).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /^Asignar$/i }));

    expect(
      await screen.findAllByText("La asignación requiere revisión manual."),
    ).not.toHaveLength(0);
    expect(screen.queryByText(/Tx Hash/i)).not.toBeInTheDocument();
    const requests = captured.filter(
      ({ method, pathname }) =>
        method === "POST" && pathname === "/api/v1/tvd/manual-assignments",
    );
    expect(requests).toHaveLength(2);
    expect(requests[0].body).toEqual(requests[1].body);
  });
});
