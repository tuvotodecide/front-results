import { fireEvent, render, screen } from "@testing-library/react";
import { vi } from "vitest";
import PastElectionsPage from "@/features/publicLanding/PastElectionsPage";

const navigateMock = vi.fn();
const usePastElectionsMock = vi.fn();

vi.mock("react-router-dom", () => ({
  useNavigate: () => navigateMock,
}));

vi.mock("@/features/publicLanding/data/usePublicLandingRepository", () => ({
  usePastElections: () => usePastElectionsMock(),
}));

describe("PastElectionsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("[PUB-LST-P1-003][PUB-LST-P0-002] renderiza elecciones publicas por estado y busqueda", () => {
    usePastElectionsMock.mockReturnValue({
      elections: [
        {
          id: "active-1",
          title: "Elección activa",
          organization: "Org activa",
          status: "ACTIVA",
          isFeatured: false,
        },
        {
          id: "upcoming-1",
          title: "Elección próxima",
          organization: "Org próxima",
          status: "PROXIMA",
          isFeatured: false,
        },
        {
          id: "finished-1",
          title: "Elección finalizada",
          organization: "Org finalizada",
          status: "FINALIZADA",
          isFeatured: false,
        },
      ],
      loading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<PastElectionsPage />);

    expect(screen.getByText("Elecciones pasadas")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Busca una elección pública y entra directamente a su vista correspondiente.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("ACTIVA")).toBeInTheDocument();
    expect(screen.getByText("PRÓXIMA")).toBeInTheDocument();
    expect(screen.getByText("FINALIZADA")).toBeInTheDocument();
    expect(screen.getByText("3 elecciones encontradas")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Buscar elección"), {
      target: { value: "activa" },
    });
    expect(screen.getByText("1 elecciones encontradas")).toBeInTheDocument();
    expect(screen.queryByText("Elección finalizada")).not.toBeInTheDocument();
  });

  it("[PUB-LST-P1-003][PUB-ACC-P0-001] abre detalle publico con click o teclado sin sesion", () => {
    usePastElectionsMock.mockReturnValue({
      elections: [
        {
          id: "finished-1",
          title: "Elección finalizada",
          organization: "Org finalizada",
          status: "FINALIZADA",
          isFeatured: false,
        },
      ],
      loading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<PastElectionsPage />);

    fireEvent.click(screen.getByRole("button", { name: "Ver elección" }));

    expect(navigateMock).toHaveBeenCalledWith(
      "/votacion/elecciones/finished-1/publica",
    );
  });
});
