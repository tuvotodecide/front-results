import { fireEvent, screen, waitFor } from "@testing-library/react";
import VotacionPrivateGuard from "@/domains/votacion/guards/VotacionPrivateGuard";
import VotacionPublicHeader from "@/domains/votacion/layout/VotacionPublicHeader";
import { apiSlice } from "@/store/apiSlice";
import type { AuthState } from "@/store/auth/authSlice";
import { votingEventsEndpoints } from "@/store/votingEvents/votingEventsEndpoints";
import { renderWithAuthStore } from "../utils/renderWithStore";

const replace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  usePathname: () => "/votacion/elecciones",
}));

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

const institutions = [
  { type: "TENANT" as const, tenantId: "tenant-a-internal", tenantName: "Universidad A", role: "USER", institutionalRole: "PRIMARY" as const },
  { type: "TENANT" as const, tenantId: "tenant-b-internal", tenantName: "Universidad B", role: "USER", institutionalRole: "SECONDARY" as const },
];

const authenticatedState = {
  token: "token",
  accessToken: "token",
  role: "TENANT_ADMIN",
  active: true,
  user: {
    id: "user-1",
    email: "tenant@test.com",
    name: "Tenant",
    role: "TENANT_ADMIN",
    active: true,
    status: "ACTIVE" as const,
  },
  availableContexts: institutions,
} satisfies Partial<AuthState>;

describe("Flujo 1 | selector de institución en votación", () => {
  beforeEach(() => {
    replace.mockReset();
    Object.defineProperty(HTMLDialogElement.prototype, "showModal", {
      configurable: true,
      value() {
        this.setAttribute("open", "");
      },
    });
    Object.defineProperty(HTMLDialogElement.prototype, "close", {
      configurable: true,
      value() {
        this.removeAttribute("open");
      },
    });
  });

  it("TEST 2/3/8/9 | bloquea hasta elegir B y no expone IDs técnicos", async () => {
    const { store } = renderWithAuthStore(
      <VotacionPrivateGuard><div>área institucional</div></VotacionPrivateGuard>,
      authenticatedState,
    );

    expect(screen.getByText("Selecciona una institución")).toBeInTheDocument();
    expect(screen.queryByText("área institucional")).not.toBeInTheDocument();
    expect(store.getState().auth.activeContext).toBeNull();
    expect(document.body.textContent).not.toContain("tenant-a-internal");
    expect(document.body.textContent).not.toContain("tenant-b-internal");

    fireEvent.click(screen.getByRole("button", { name: "Administrar Universidad B" }));

    await waitFor(() => {
      expect(store.getState().auth.activeContext).toMatchObject({
        tenantId: "tenant-b-internal",
        tenantName: "Universidad B",
        role: "USER",
        institutionalRole: "SECONDARY",
      });
    });
    expect(screen.getByText("área institucional")).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });

  it("TEST 4 | cambia B a A desde la cabecera, sin cerrar sesión", async () => {
    const { store } = renderWithAuthStore(
      <VotacionPublicHeader />,
      { ...authenticatedState, activeContext: institutions[1] },
    );

    const changeButton = await screen.findByRole("button", {
      name: "Cambiar institución. Actual: Universidad B",
    });
    fireEvent.click(changeButton);
    fireEvent.click(screen.getByRole("button", { name: "Administrar Universidad A" }));

    await waitFor(() => {
      expect(store.getState().auth.activeContext).toMatchObject({
        tenantId: "tenant-a-internal",
        tenantName: "Universidad A",
        role: "USER",
        institutionalRole: "PRIMARY",
      });
    });
    expect(screen.getByRole("button", {
      name: "Cambiar institución. Actual: Universidad A",
    })).toBeInTheDocument();
    expect(store.getState().auth.token).toBe("token");
  });

  it("TEST cache | resetApiState elimina las consultas RTK antes de usar la nueva institución", async () => {
    const { store } = renderWithAuthStore(<div />);

    await store.dispatch(
      votingEventsEndpoints.util.upsertQueryData(
        "getVotingEvents",
        { tenantId: "tenant-a-internal" },
        [],
      ),
    );
    expect(Object.keys(store.getState().api.queries)).not.toHaveLength(0);

    store.dispatch(apiSlice.util.resetApiState());
    expect(store.getState().api.queries).toEqual({});
  });
});
