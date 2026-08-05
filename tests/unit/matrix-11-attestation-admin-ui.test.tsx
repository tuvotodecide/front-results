import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import ImagesSection from "@/domains/resultados/components/ImagesSection";
import ResultadosImagenPage from "@/domains/resultados/screens/ResultadosImagenPage";
import type { AttestationsBallotType, BallotType } from "@/types";

const testHarness = vi.hoisted(() => ({
  dispatch: vi.fn(),
  navigate: vi.fn(),
  params: { id: "ballot-1" },
  searchParams: new URLSearchParams("electionType=mayor"),
  useGetBallotQuery: vi.fn(),
  useGetBallotByTableCodeQuery: vi.fn(),
  useGetAttestationsByBallotIdQuery: vi.fn(),
  useGetAttestationsByDepartmentIdQuery: vi.fn(),
  useGetAttestationsByMunicipalityIdQuery: vi.fn(),
  useElectionConfig: vi.fn(),
  useElectionId: vi.fn(),
  useMyContract: vi.fn(),
}));

vi.mock("react-redux", () => ({
  useDispatch: () => testHarness.dispatch,
}));

vi.mock("@/domains/resultados/navigation/compat", () => ({
  useNavigate: () => testHarness.navigate,
  useParams: () => testHarness.params,
  useSearchParams: () => [testHarness.searchParams, vi.fn()] as const,
}));

vi.mock("@/store/ballots/ballotsEndpoints", () => ({
  useGetBallotQuery: (...args: unknown[]) => testHarness.useGetBallotQuery(...args),
  useGetBallotByTableCodeQuery: (...args: unknown[]) =>
    testHarness.useGetBallotByTableCodeQuery(...args),
}));

vi.mock("@/store/attestations/attestationsEndpoints", () => ({
  useGetAttestationsByBallotIdQuery: (...args: unknown[]) =>
    testHarness.useGetAttestationsByBallotIdQuery(...args),
  useGetAttestationsByDepartmentIdQuery: (...args: unknown[]) =>
    testHarness.useGetAttestationsByDepartmentIdQuery(...args),
  useGetAttestationsByMunicipalityIdQuery: (...args: unknown[]) =>
    testHarness.useGetAttestationsByMunicipalityIdQuery(...args),
}));

vi.mock("@/hooks/useMyContract", () => ({
  useMyContract: () => testHarness.useMyContract(),
}));

vi.mock("@/domains/resultados/hooks/useElectionId", () => ({
  default: () => testHarness.useElectionId(),
}));

vi.mock("@/domains/resultados/hooks/useElectionConfig", () => ({
  default: () => testHarness.useElectionConfig(),
}));

vi.mock("@/hooks/useAutoRefreshTick", () => ({
  default: () => 0,
}));

vi.mock("@/legacy-pages/Resultados/Graphs", () => ({
  default: ({ data }: { data: Array<{ name: string; value: number }> }) => (
    <div data-testid="mx11-unit-graphs">
      {data.map((item) => (
        <span key={item.name}>
          {item.name}: {item.value}
        </span>
      ))}
    </div>
  ),
}));

vi.mock("@/legacy-pages/Resultados/StatisticsBars", () => ({
  default: ({ voteData }: { voteData: Array<{ name: string; value: number }> }) => (
    <div data-testid="mx11-unit-statistics">
      {voteData.map((item) => (
        <span key={item.name}>
          {item.name}: {item.value}
        </span>
      ))}
    </div>
  ),
}));

const ballot: BallotType = {
  _id: "ballot-1",
  tableNumber: "1",
  tableCode: "LP-001-01",
  electionId: "election-2026",
  electoralLocationId: "location-1",
  location: {
    department: "La Paz",
    province: "Murillo",
    municipality: "La Paz",
    electoralSeat: "Asiento 1",
    electoralLocationName: "Unidad Educativa Central",
    district: "Distrito 1",
    zone: "Zona Central",
    circunscripcion: { number: 1, type: "municipal", name: "C-1" },
  },
  votes: {
    parties: {
      validVotes: 10,
      nullVotes: 1,
      blankVotes: 2,
      partyVotes: [{ partyId: "Partido Verde", votes: 10 }],
      totalVotes: 13,
    },
    deputies: {
      validVotes: 0,
      nullVotes: 0,
      blankVotes: 0,
      partyVotes: [],
      totalVotes: 0,
    },
  },
  ipfsUri: "ipfs://metadata-1",
  ipfsCid: "cid-acta-1",
  image: "ipfs://cid-acta-1",
  recordId: "record-1",
  tableIdIpfs: "table-ipfs-1",
  status: "PROCESSED",
  valuable: true,
  version: 2,
  createdAt: "2026-04-18T19:00:00.000Z",
  updatedAt: "2026-04-18T20:00:00.000Z",
  __v: 0,
};

const attestationCases: AttestationsBallotType[] = [
  {
    ballotId: "ballot-1",
    version: 2,
    location: ballot.location,
    supports: { users: 2, juries: 1 },
  },
];

describe("MX-11 | Atestiguamiento, actas y evidencias | unitarias", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("[MX-11][ADM-IMG-P1-001][UNITARIA] transforma votos y atestiguamientos de una acta en datos visibles", async () => {
    testHarness.useMyContract.mockReturnValue({ isClient: false, contract: null });
    testHarness.useElectionId.mockReturnValue("election-2026");
    testHarness.useElectionConfig.mockReturnValue({
      election: { type: "mayor" },
      hasActiveConfig: true,
      isVotingPeriod: false,
      isResultsPeriod: true,
      isAutoRefreshWindow: false,
    });
    testHarness.useGetBallotQuery.mockReturnValue({ data: ballot, isError: false });
    testHarness.useGetBallotByTableCodeQuery.mockReturnValue({
      data: [ballot],
      isError: false,
    });
    testHarness.useGetAttestationsByBallotIdQuery.mockReturnValue({
      data: [
        {
          _id: "attestation-1",
          support: true,
          userRole: "DELEGATE",
          userName: "Ana Delegada",
          createdAt: "2026-04-18T20:10:00.000Z",
        },
      ],
    });
    testHarness.useGetAttestationsByDepartmentIdQuery.mockReturnValue({
      data: undefined,
      isError: false,
    });
    testHarness.useGetAttestationsByMunicipalityIdQuery.mockReturnValue({
      data: undefined,
      isError: false,
    });

    render(<ResultadosImagenPage />);

    expect(await screen.findByText("Partido Verde: 10")).toBeInTheDocument();
    expect(screen.getByText("Válidos: 10")).toBeInTheDocument();
    expect(screen.getByText("Ana Delegada")).toBeInTheDocument();
    expect(within(screen.getByText("A favor").parentElement!).getByText("1")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Imagen" })).toHaveAttribute(
      "href",
      "https://ipfs.io/ipfs/cid-acta-1",
    );

    cleanup();
    render(
      <ImagesSection
        images={[ballot]}
        mostSupportedBallot={{
          ballotId: "ballot-1",
          version: 2,
          supportCount: 3,
          totalAttestations: 3,
        }}
        attestationCases={attestationCases}
        electionId="election-2026"
        electionType="mayor"
      />,
    );

    expect(screen.getByText("Mas apoyada")).toBeInTheDocument();
    expect(within(screen.getByText("Usuarios").parentElement!).getByText("2")).toBeInTheDocument();
    expect(within(screen.getByText("Jurados").parentElement!).getByText("1")).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: "Vista previa de hoja de trabajo electoral" }),
    ).toHaveAttribute("src", "https://ipfs.io/ipfs/cid-acta-1");
    expect(screen.getByRole("link", { name: "Detalles" })).toHaveAttribute(
      "href",
      "/resultados/imagen/ballot-1?electionId=election-2026&electionType=mayor",
    );
  });
});
