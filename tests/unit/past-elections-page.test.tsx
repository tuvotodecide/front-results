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

  it("renders public elections from multiple statuses", () => {
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
  });

  it("navigates to the public detail when opening an election", () => {
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
