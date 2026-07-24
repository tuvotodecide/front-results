import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import SuperadminTopNav from "@/domains/superadmin/layout/SuperadminTopNav";
import { renderWithAuthStore } from "../utils/renderWithStore";

vi.mock("next/navigation", () => ({
  usePathname: () => "/superadmin",
}));

describe("SuperadminTopNav", () => {
  it("renderiza menú superior y dropdown $TVD sin Consulta txHash", async () => {
    const user = userEvent.setup();
    renderWithAuthStore(<SuperadminTopNav />);

    expect(screen.getByRole("link", { name: /Inicio/i })).toHaveAttribute(
      "href",
      "/superadmin",
    );
    expect(screen.queryByRole("link", { name: /Votaciones/i })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /\$TVD/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Gestión/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Cerrar sesión/i })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /\$TVD/i }));

    expect(screen.getByRole("link", { name: /Contrato \$TVD/i })).toHaveAttribute(
      "href",
      "/superadmin/tvd/contrato",
    );
    expect(
      screen.getByRole("link", { name: /Parámetros económicos/i }),
    ).toHaveAttribute("href", "/superadmin/tvd/parametros");
    expect(
      screen.getByRole("link", { name: /Asignación de \$TVD/i }),
    ).toHaveAttribute("href", "/superadmin/tvd/asignacion");
    expect(screen.getByRole("link", { name: /Operaciones \$TVD/i })).toHaveAttribute(
      "href",
      "/superadmin/tvd/operaciones",
    );
    expect(screen.getByRole("link", { name: /Consulta billetera/i })).toHaveAttribute(
      "href",
      "/superadmin/tvd/consulta-billetera",
    );
    expect(screen.queryByText(/Consulta txHash/i)).not.toBeInTheDocument();
  });

  it("renderiza dropdown Gestión", async () => {
    const user = userEvent.setup();
    renderWithAuthStore(<SuperadminTopNav />);

    await user.click(screen.getByRole("button", { name: /Gestión/i }));

    expect(
      screen.getByRole("link", { name: /Gestión de registros/i }),
    ).toHaveAttribute("href", "/superadmin/gestion/registros");
    expect(
      screen.getByRole("link", { name: /Recuperación institucional/i }),
    ).toHaveAttribute("href", "/superadmin/gestion/recuperacion");
  });
});
