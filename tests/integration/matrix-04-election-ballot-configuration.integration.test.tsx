import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ElectionConfigCargos from "@/features/electionConfig/ElectionConfigCargos";
import ElectionConfigPlanchas from "@/features/electionConfig/ElectionConfigPlanchas";
import { adminEventRoles, adminVotingOptions, draftVotingEvent } from "../fixtures/admin/electionConfig";

const createRoleMock = vi.fn(); const updateRoleMock = vi.fn(); const deleteRoleMock = vi.fn();
const createOptionMock = vi.fn(); const updateOptionMock = vi.fn(); const deleteOptionMock = vi.fn(); const replaceCandidatesMock = vi.fn();

vi.mock("@/domains/votacion/navigation/compat-private", () => ({ useNavigate: () => vi.fn(), useParams: () => ({ electionId: "evt-config" }) }));
vi.mock("@/components/Modal2", () => ({ default: ({ children, isOpen = true, title }: { children?: ReactNode; isOpen?: boolean; title?: string }) => isOpen ? <div role="dialog" aria-label={title ?? "Modal"}>{title ? <h2>{title}</h2> : null}{children}</div> : null }));
vi.mock("@/store/votingEvents", () => ({
  useGetVotingEventQuery: vi.fn(), useGetEventRolesQuery: vi.fn(), useGetEventOptionsQuery: vi.fn(), useGetPadronVersionsQuery: vi.fn(),
  useCreateEventRoleMutation: vi.fn(), useUpdateEventRoleMutation: vi.fn(), useDeleteEventRoleMutation: vi.fn(),
  useCreateVotingOptionMutation: vi.fn(), useUpdateVotingOptionMutation: vi.fn(), useDeleteVotingOptionMutation: vi.fn(), useReplaceOptionCandidatesMutation: vi.fn(),
}));
import * as votingEvents from "@/store/votingEvents";

const resolved = <T,>(value: T) => ({ unwrap: vi.fn().mockResolvedValue(value) });
const rejected = (message: string) => ({ unwrap: vi.fn().mockRejectedValue({ data: { message } }) });
const newOption = { id: "option-green", eventId: "evt-config", name: "Lista Verde", color: "#2E7D32", colors: ["#2E7D32"], logoUrl: "data:image/png;base64,logo", active: true, candidates: [], createdAt: "2026-01-01T00:00:00.000Z" };

function setup() {
  vi.mocked(votingEvents.useGetVotingEventQuery).mockReturnValue({ data: draftVotingEvent, isLoading: false, isError: false, refetch: vi.fn() } as any);
  vi.mocked(votingEvents.useGetEventRolesQuery).mockReturnValue({ data: adminEventRoles, isLoading: false, isError: false } as any);
  vi.mocked(votingEvents.useGetEventOptionsQuery).mockReturnValue({ data: adminVotingOptions, isLoading: false, isError: false } as any);
  vi.mocked(votingEvents.useGetPadronVersionsQuery).mockReturnValue({ data: [], isError: false } as any);
  createRoleMock.mockReturnValue(resolved(adminEventRoles[0])); updateRoleMock.mockReturnValue(resolved({ ...adminEventRoles[0], name: "Rectoría" })); deleteRoleMock.mockReturnValue(resolved(undefined));
  createOptionMock.mockReturnValue(resolved(newOption)); updateOptionMock.mockReturnValue(resolved({ ...adminVotingOptions[0], name: "Lista Azul Renovada" })); deleteOptionMock.mockReturnValue(resolved(undefined)); replaceCandidatesMock.mockReturnValue(resolved([]));
  vi.mocked(votingEvents.useCreateEventRoleMutation).mockReturnValue([createRoleMock, { isLoading: false }] as any);
  vi.mocked(votingEvents.useUpdateEventRoleMutation).mockReturnValue([updateRoleMock, { isLoading: false }] as any);
  vi.mocked(votingEvents.useDeleteEventRoleMutation).mockReturnValue([deleteRoleMock, { isLoading: false }] as any);
  vi.mocked(votingEvents.useCreateVotingOptionMutation).mockReturnValue([createOptionMock, { isLoading: false }] as any);
  vi.mocked(votingEvents.useUpdateVotingOptionMutation).mockReturnValue([updateOptionMock, { isLoading: false }] as any);
  vi.mocked(votingEvents.useDeleteVotingOptionMutation).mockReturnValue([deleteOptionMock, { isLoading: false }] as any);
  vi.mocked(votingEvents.useReplaceOptionCandidatesMutation).mockReturnValue([replaceCandidatesMock, { isLoading: false }] as any);
}
async function openParty(user: ReturnType<typeof userEvent.setup>) { await user.click(screen.getByRole("button", { name: "Crear Partido" })); }
async function uploadLogo(user: ReturnType<typeof userEvent.setup>) { await user.upload(document.querySelector('input[type="file"]') as HTMLInputElement, new File(["logo"], "logo.png", { type: "image/png" })); }

describe("MX-04 | boleta y configuración", () => {
  beforeEach(() => { vi.clearAllMocks(); setup(); });

  it("[MX-04][ELE-ROL-P1-002][INTEGRACION] edita el nombre de un cargo con el payload RTK", async () => {
    const user = userEvent.setup(); render(<ElectionConfigCargos />);
    await user.click(screen.getAllByRole("button", { name: "Editar" })[0]!);
    await user.clear(screen.getByLabelText("¿Por qué cargo se votará?")); await user.type(screen.getByLabelText("¿Por qué cargo se votará?"), "Rectoría");
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));
    await waitFor(() => expect(updateRoleMock).toHaveBeenCalledWith({ eventId: "evt-config", roleId: "role-president", data: { name: "Rectoría" } }));
  });
  it("[MX-04][ELE-ROL-P0-003][INTEGRACION] conserva el modal ante cargo duplicado", async () => {
    const user = userEvent.setup(); createRoleMock.mockReturnValue(rejected("Cargo duplicado")); render(<ElectionConfigCargos />);
    await user.click(screen.getByRole("button", { name: "Agregar Cargo" })); await user.type(screen.getByLabelText("¿Por qué cargo se votará?"), "Presidencia"); await user.click(screen.getByRole("button", { name: "Guardar Cargo" }));
    expect(await screen.findAllByText("Cargo duplicado")).toHaveLength(2); expect(screen.getByRole("button", { name: "Guardar Cargo" })).toBeInTheDocument();
  });
  it("[MX-04][ELE-ROL-P0-004][INTEGRACION] confirma la eliminación de cargo permitido", async () => {
    const user = userEvent.setup(); render(<ElectionConfigCargos />);
    await user.click(screen.getAllByRole("button", { name: "Eliminar" })[0]!); expect(screen.getByText('¿Estás seguro de eliminar el cargo "Presidencia"?')).toBeInTheDocument();
    await user.click(screen.getAllByRole("button", { name: "Eliminar" }).at(-1)!);
    await waitFor(() => expect(deleteRoleMock).toHaveBeenCalledWith({ eventId: "evt-config", roleId: "role-president" }));
  });
  it("[MX-04][ELE-OPT-P0-001][INTEGRACION] crea una plancha con logo y colores", async () => {
    const user = userEvent.setup(); render(<ElectionConfigPlanchas />); await openParty(user);
    await user.type(screen.getByPlaceholderText("Ej: Movimiento Futuro"), "Lista Verde"); await uploadLogo(user); await user.click(screen.getByRole("button", { name: "Guardar y Continuar" }));
    await waitFor(() => expect(createOptionMock).toHaveBeenCalledWith({ eventId: "evt-config", data: expect.objectContaining({ name: "Lista Verde", color: "#2E7D32", logoUrl: expect.stringContaining("data:image/png") }) }));
  });
  it("[MX-04][ELE-OPT-P1-002][INTEGRACION] actualiza una plancha sin crear otra", async () => {
    const user = userEvent.setup(); render(<ElectionConfigPlanchas />);
    await user.click(screen.getAllByRole("button", { name: "Editar" })[0]!); const name = screen.getByDisplayValue("Lista Azul"); await user.clear(name); await user.type(name, "Lista Azul Renovada"); await user.click(screen.getByRole("button", { name: "Guardar y Continuar" }));
    await waitFor(() => expect(updateOptionMock).toHaveBeenCalledWith({ eventId: "evt-config", optionId: "option-blue", data: expect.objectContaining({ name: "Lista Azul Renovada", colors: ["#1D4ED8", "#93C5FD"] }) }));
    expect(createOptionMock).not.toHaveBeenCalled();
  });
  it("[MX-04][ELE-OPT-P0-003][INTEGRACION] bloquea color inválido y conserva el formulario", async () => {
    const user = userEvent.setup(); render(<ElectionConfigPlanchas />); await openParty(user);
    await user.type(screen.getByPlaceholderText("Ej: Movimiento Futuro"), "Lista Azul"); await user.clear(screen.getByDisplayValue("#2E7D32")); await user.type(screen.getByPlaceholderText("#000000"), "zzzzzz"); await user.click(screen.getByRole("button", { name: "Guardar y Continuar" }));
    expect(screen.getByText("Formato de color inválido")).toBeInTheDocument(); expect(createOptionMock).not.toHaveBeenCalled();
  });
  it("[MX-04][ELE-CAN-P0-001][INTEGRACION] reemplaza candidatos completos de una plancha", async () => {
    const user = userEvent.setup(); render(<ElectionConfigPlanchas />); await user.click(screen.getByText("Lista Azul")); await user.click(screen.getByRole("button", { name: "Editar Candidatos" }));
    const candidate = screen.getByDisplayValue("Ana Presidenta"); await user.clear(candidate); await user.type(candidate, "Ana Rectora"); await user.click(screen.getByRole("button", { name: "Guardar Candidatos" }));
    await waitFor(() => expect(replaceCandidatesMock).toHaveBeenCalledWith({ eventId: "evt-config", optionId: "option-blue", data: { candidates: expect.arrayContaining([expect.objectContaining({ name: "Ana Rectora", roleName: "Presidencia" })]) } }));
  });
  it("[MX-04][ELE-CAN-P0-002][INTEGRACION] muestra error de cargo inexistente sin cerrar candidatos", async () => {
    const user = userEvent.setup(); replaceCandidatesMock.mockReturnValue(rejected("roleName invalido en candidato: Tesoreria")); render(<ElectionConfigPlanchas />);
    await user.click(screen.getByText("Lista Azul")); await user.click(screen.getByRole("button", { name: "Editar Candidatos" })); await user.click(screen.getByRole("button", { name: "Guardar Candidatos" }));
    expect(await screen.findAllByText("roleName invalido en candidato: Tesoreria")).toHaveLength(2); expect(screen.getByRole("button", { name: "Guardar Candidatos" })).toBeInTheDocument();
  });
  it("[MX-04][ELE-OPT-P1-004][INTEGRACION] elimina una plancha sólo tras confirmación", async () => {
    const user = userEvent.setup(); render(<ElectionConfigPlanchas />);
    await user.click(screen.getAllByRole("button", { name: "Eliminar" })[0]!); expect(screen.getByText('¿Estás seguro de eliminar el partido "Lista Azul"?')).toBeInTheDocument();
    await user.click(screen.getAllByRole("button", { name: "Eliminar" }).at(-1)!);
    await waitFor(() => expect(deleteOptionMock).toHaveBeenCalledWith({ eventId: "evt-config", optionId: "option-blue" }));
  });
});
