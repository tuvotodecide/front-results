import { screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import SuperadminGuard from "@/domains/superadmin/guards/SuperadminGuard";
import { renderWithAuthStore } from "../utils/renderWithStore";

const replaceMock = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => "/superadmin",
  useRouter: () => ({
    replace: replaceMock,
  }),
}));

describe("MX-03 | Autenticación, sesiones, roles y permisos | Frontend Admin | Superadmin guard", () => {
  beforeEach(() => {
    replaceMock.mockClear();
  });

  it("AUT-SUP-P0-001 / AUT-LOG-P0-004 | permite usuarios SUPERADMIN", () => {
    renderWithAuthStore(
      <SuperadminGuard>
        <p>Contenido superadmin</p>
      </SuperadminGuard>,
      {
        token: "token",
        role: "SUPERADMIN",
        active: true,
        user: {
          id: "1",
          email: "superadmin@test.dev",
          name: "Superadmin",
          role: "SUPERADMIN",
          active: true,
        },
      },
    );

    expect(screen.getByText("Contenido superadmin")).toBeInTheDocument();
    expect(replaceMock).not.toHaveBeenCalled();
  });

  it("AUT-SUP-P0-001 | permite contexto GLOBAL_ADMIN aunque el rol activo no sea SUPERADMIN", () => {
    renderWithAuthStore(
      <SuperadminGuard>
        <p>Contenido global</p>
      </SuperadminGuard>,
      {
        token: "token",
        role: "TENANT_ADMIN",
        active: true,
        activeContext: {
          type: "GLOBAL_ADMIN",
          role: "SUPERADMIN",
          label: "Global",
        },
        user: {
          id: "2",
          email: "global@test.dev",
          name: "Global",
          role: "TENANT_ADMIN",
          active: true,
        },
      },
    );

    expect(screen.getByText("Contenido global")).toBeInTheDocument();
  });

  it("AUT-SUP-P0-003 | permite sesión dev SUPERADMIN sin token real en modo dev", () => {
    renderWithAuthStore(
      <SuperadminGuard>
        <p>Contenido dev</p>
      </SuperadminGuard>,
      {
        token: null,
        accessToken: null,
        isDevSession: true,
        role: "SUPERADMIN",
        active: true,
        activeContext: {
          type: "GLOBAL_ADMIN",
          role: "SUPERADMIN",
          label: "Superadmin local",
        },
        user: {
          id: "dev-superadmin-local",
          email: "superadmin.local@tuvotodecide.dev",
          name: "Superadmin Local",
          role: "SUPERADMIN",
          active: true,
        },
      },
    );

    expect(screen.getByText("Contenido dev")).toBeInTheDocument();
    expect(replaceMock).not.toHaveBeenCalled();
  });

  it("AUT-SUP-P0-002 | bloquea TENANT_ADMIN sin contexto GLOBAL_ADMIN", () => {
    renderWithAuthStore(
      <SuperadminGuard>
        <p>Contenido privado</p>
      </SuperadminGuard>,
      {
        token: "token",
        role: "TENANT_ADMIN",
        active: true,
        user: {
          id: "3",
          email: "tenant@test.dev",
          name: "Tenant",
          role: "TENANT_ADMIN",
          active: true,
        },
      },
    );

    expect(screen.getByText("Acceso restringido")).toBeInTheDocument();
    expect(screen.queryByText("Contenido privado")).not.toBeInTheDocument();
  });

  it("AUT-ARE-P0-003 | bloquea ACCESS_APPROVER en /superadmin", () => {
    renderWithAuthStore(
      <SuperadminGuard>
        <p>Contenido aprobador</p>
      </SuperadminGuard>,
      {
        token: "token",
        role: "ACCESS_APPROVER",
        active: true,
        user: {
          id: "4",
          email: "approver@test.dev",
          name: "Aprobador",
          role: "ACCESS_APPROVER",
          active: true,
        },
      },
    );

    expect(screen.getByText("Acceso restringido")).toBeInTheDocument();
  });

  it("AUT-GRD-P0-001 | redirige usuarios sin sesión al login de resultados", async () => {
    renderWithAuthStore(
      <SuperadminGuard>
        <p>Contenido privado</p>
      </SuperadminGuard>,
    );

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith(
        "/resultados/login?from=%2Fsuperadmin",
      );
    });
    expect(screen.queryByText("Contenido privado")).not.toBeInTheDocument();
  });
});
