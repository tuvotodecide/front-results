import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { vi } from "vitest";
import ElectionConfigCargos from "@/features/electionConfig/ElectionConfigCargos";
import ElectionConfigPlanchas from "@/features/electionConfig/ElectionConfigPlanchas";
import {
  adminEventRoles,
  adminVotingOptions,
  draftVotingEvent,
  referendumVotingEvent,
} from "../fixtures/admin/electionConfig";

const navigateMock = vi.fn();
const refetchEventMock = vi.fn();
const createRoleMock = vi.fn();
const updateRoleMock = vi.fn();
const deleteRoleMock = vi.fn();
const createOptionMock = vi.fn();
const updateOptionMock = vi.fn();
const deleteOptionMock = vi.fn();
const replaceCandidatesMock = vi.fn();

vi.mock("@/domains/votacion/navigation/compat-private", () => ({
  useNavigate: () => navigateMock,
  useParams: () => ({ electionId: "evt-config" }),
}));

vi.mock("@/components/Modal2", () => ({
  default: ({
    children,
    isOpen = true,
    title,
  }: {
    children?: ReactNode;
    isOpen?: boolean;
    title?: string;
  }) => (isOpen ? <div>{title ? <h2>{title}</h2> : null}{children}</div> : null),
}));

vi.mock("@/store/votingEvents", () => ({
  useGetVotingEventQuery: vi.fn(),
  useGetEventRolesQuery: vi.fn(),
  useGetEventOptionsQuery: vi.fn(),
  useGetPadronVersionsQuery: vi.fn(),
  useCreateEventRoleMutation: vi.fn(),
  useUpdateEventRoleMutation: vi.fn(),
  useDeleteEventRoleMutation: vi.fn(),
  useCreateVotingOptionMutation: vi.fn(),
  useUpdateVotingOptionMutation: vi.fn(),
  useDeleteVotingOptionMutation: vi.fn(),
  useReplaceOptionCandidatesMutation: vi.fn(),
}));

import * as votingEvents from "@/store/votingEvents";

const unwrapResult = <T,>(value: T) => ({
  unwrap: vi.fn().mockResolvedValue(value),
});

const unwrapError = (message: string) => ({
  unwrap: vi.fn().mockRejectedValue({ data: { message } }),
});

const setupVotingEventMocks = ({
  event = draftVotingEvent,
  roles = adminEventRoles,
  options = adminVotingOptions,
  padronVersions = [],
}: {
  event?: typeof draftVotingEvent;
  roles?: typeof adminEventRoles;
  options?: typeof adminVotingOptions;
  padronVersions?: unknown[];
} = {}) => {
  vi.mocked(votingEvents.useGetVotingEventQuery).mockReturnValue({
    data: event,
    isLoading: false,
    isError: false,
    refetch: refetchEventMock,
  } as any);
  vi.mocked(votingEvents.useGetEventRolesQuery).mockReturnValue({
    data: roles,
    isLoading: false,
    isError: false,
  } as any);
  vi.mocked(votingEvents.useGetEventOptionsQuery).mockReturnValue({
    data: options,
    isLoading: false,
    isError: false,
  } as any);
  vi.mocked(votingEvents.useGetPadronVersionsQuery).mockReturnValue({
    data: padronVersions,
    isError: false,
  } as any);
};

describe("election configuration C+D flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupVotingEventMocks();
    createRoleMock.mockReturnValue(unwrapResult(adminEventRoles[0]));
    updateRoleMock.mockReturnValue(unwrapResult({ ...adminEventRoles[0], name: "Rectoria" }));
    deleteRoleMock.mockReturnValue(unwrapResult(undefined));
    createOptionMock.mockReturnValue(unwrapResult({
      id: "option-new",
      eventId: "evt-config",
      name: "Lista Verde",
      color: "#2E7D32",
      colors: ["#2E7D32"],
      logoUrl: undefined,
      active: true,
      candidates: [],
      createdAt: "2026-01-01T00:00:00.000Z",
    }));
    updateOptionMock.mockReturnValue(unwrapResult({
      ...adminVotingOptions[0],
      name: "Lista Azul Renovada",
    }));
    deleteOptionMock.mockReturnValue(unwrapResult(undefined));
    replaceCandidatesMock.mockReturnValue(unwrapResult([]));
    vi.mocked(votingEvents.useCreateEventRoleMutation).mockReturnValue([
      createRoleMock,
      { isLoading: false },
    ] as any);
    vi.mocked(votingEvents.useUpdateEventRoleMutation).mockReturnValue([
      updateRoleMock,
      { isLoading: false },
    ] as any);
    vi.mocked(votingEvents.useDeleteEventRoleMutation).mockReturnValue([
      deleteRoleMock,
      { isLoading: false },
    ] as any);
    vi.mocked(votingEvents.useCreateVotingOptionMutation).mockReturnValue([
      createOptionMock,
      { isLoading: false },
    ] as any);
    vi.mocked(votingEvents.useUpdateVotingOptionMutation).mockReturnValue([
      updateOptionMock,
      { isLoading: false },
    ] as any);
    vi.mocked(votingEvents.useDeleteVotingOptionMutation).mockReturnValue([
      deleteOptionMock,
      { isLoading: false },
    ] as any);
    vi.mocked(votingEvents.useReplaceOptionCandidatesMutation).mockReturnValue([
      replaceCandidatesMock,
      { isLoading: false },
    ] as any);
  });

  it("creates, edits and deletes cargos with expected RTK payloads", async () => {
    const user = userEvent.setup();

    render(<ElectionConfigCargos />);

    expect(screen.getByText("Eleccion consejo 2027")).toBeInTheDocument();
    expect(screen.getByText("Presidencia")).toBeInTheDocument();
    expect(screen.getByText("Secretaria")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Agregar Cargo" }));
    await user.type(screen.getByLabelText("¿Por qué cargo se votará?"), "Tesoreria");
    await user.click(screen.getByRole("button", { name: "Guardar Cargo" }));

    await waitFor(() => {
      expect(createRoleMock).toHaveBeenCalledWith({
        eventId: "evt-config",
        data: { name: "Tesoreria", maxWinners: 1 },
      });
    });

    await user.click(screen.getAllByRole("button", { name: "Editar" })[0]!);
    await user.clear(screen.getByLabelText("¿Por qué cargo se votará?"));
    await user.type(screen.getByLabelText("¿Por qué cargo se votará?"), "Rectoria");
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));

    await waitFor(() => {
      expect(updateRoleMock).toHaveBeenCalledWith({
        eventId: "evt-config",
        roleId: "role-president",
        data: { name: "Rectoria" },
      });
    });

    await user.click(screen.getAllByRole("button", { name: "Eliminar" })[0]!);
    expect(screen.getByText('¿Estás seguro de eliminar el cargo "Presidencia"?')).toBeInTheDocument();
    await user.click(screen.getAllByRole("button", { name: "Eliminar" }).at(-1)!);

    await waitFor(() => {
      expect(deleteRoleMock).toHaveBeenCalledWith({
        eventId: "evt-config",
        roleId: "role-president",
      });
    });
  });

  it("shows cargo API errors without changing the product flow", async () => {
    const user = userEvent.setup();
    createRoleMock.mockReturnValue(unwrapError("Cargo duplicado"));

    render(<ElectionConfigCargos />);

    await user.click(screen.getByRole("button", { name: "Agregar Cargo" }));
    await user.type(screen.getByLabelText("¿Por qué cargo se votará?"), "Presidencia");
    await user.click(screen.getByRole("button", { name: "Guardar Cargo" }));

    expect(await screen.findAllByText("Cargo duplicado")).toHaveLength(2);
  });

  it("edits, deletes and completes candidates for a plancha", async () => {
    const user = userEvent.setup();

    render(<ElectionConfigPlanchas />);

    expect(screen.getByText("Paso 2 de 3: Agrega partidos y candidatos.")).toBeInTheDocument();
    expect(screen.getByText("Lista Azul")).toBeInTheDocument();

    await user.click(screen.getAllByRole("button", { name: "Editar" })[0]!);
    const partyNameInput = screen.getByDisplayValue("Lista Azul");
    await user.clear(partyNameInput);
    await user.type(partyNameInput, "Lista Azul Renovada");
    await user.click(screen.getByRole("button", { name: "Guardar y Continuar" }));

    await waitFor(() => {
      expect(updateOptionMock).toHaveBeenCalledWith({
        eventId: "evt-config",
        optionId: "option-blue",
        data: {
          name: "Lista Azul Renovada",
          color: "#1D4ED8",
          colors: ["#1D4ED8", "#93C5FD"],
          logoUrl: "data:image/png;base64,logo-blue",
        },
      });
    });

    await user.click(screen.getByText("Lista Azul"));
    await user.click(screen.getByRole("button", { name: "Editar Candidatos" }));
    const candidateNameInput = screen.getByDisplayValue("Ana Presidenta");
    await user.clear(candidateNameInput);
    await user.type(candidateNameInput, "Ana Rectora");
    await user.click(screen.getByRole("button", { name: "Guardar Candidatos" }));

    await waitFor(() => {
      expect(replaceCandidatesMock).toHaveBeenCalledWith({
        eventId: "evt-config",
        optionId: "option-blue",
        data: {
          candidates: [
            {
              name: "Ana Rectora",
              photoUrl: "data:image/png;base64,ana",
              roleName: "Presidencia",
            },
            {
              name: "Luis Secretario",
              photoUrl: "data:image/png;base64,luis",
              roleName: "Secretaria",
            },
          ],
        },
      });
    });

    await user.click(screen.getAllByRole("button", { name: "Eliminar" })[0]!);
    expect(screen.getByText('¿Estás seguro de eliminar el partido "Lista Azul"?')).toBeInTheDocument();
    await user.click(screen.getAllByRole("button", { name: "Eliminar" }).at(-1)!);

    await waitFor(() => {
      expect(deleteOptionMock).toHaveBeenCalledWith({
        eventId: "evt-config",
        optionId: "option-blue",
      });
    });
  });

  it("creates referendum options with automatic candidate payloads and without logo", async () => {
    const user = userEvent.setup();
    setupVotingEventMocks({
      event: referendumVotingEvent,
      roles: [{ ...adminEventRoles[0], name: "CONSULTA" }],
      options: [],
    });
    createOptionMock.mockReturnValue(unwrapResult({
      id: "option-yes",
      eventId: "evt-config",
      name: "Si",
      color: "#2E7D32",
      colors: ["#2E7D32"],
      logoUrl: undefined,
      active: true,
      candidates: [],
      createdAt: "2026-01-01T00:00:00.000Z",
    }));

    render(<ElectionConfigPlanchas />);

    expect(screen.getByText("Paso 1 de 2: Configura las opciones del referéndum.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Agregar opción" }));
    await user.type(screen.getByPlaceholderText("Ej: Sí"), "Si");
    expect(screen.queryByText("Logo *")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Guardar opción" }));

    await waitFor(() => {
      expect(createOptionMock).toHaveBeenCalledWith({
        eventId: "evt-config",
        data: {
          name: "Si",
          color: "#2E7D32",
          colors: ["#2E7D32"],
          logoUrl: undefined,
          candidates: [],
        },
      });
    });
    expect(replaceCandidatesMock).toHaveBeenCalledWith({
      eventId: "evt-config",
      optionId: "option-yes",
      data: {
        candidates: [
          {
            name: "Si",
            roleName: "CONSULTA",
            photoUrl: expect.stringContaining("data:image/svg+xml"),
          },
        ],
      },
    });
  });
});
