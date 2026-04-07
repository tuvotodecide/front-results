import DomainLayout from "@/shared/layout/DomainLayout";
import PublicLandingHeader from "@/features/publicLanding/components/PublicLandingHeader";
import PublicRootPage from "@/domains/publicInstitutional/components/PublicRootPage";
import ResultsAccessHomePage from "@/domains/results/components/ResultsAccessHomePage";
import ResultsShell from "@/shared/layout/ResultsShell";

const readServerAppMode = () => {
  const configuredMode =
    process.env.NEXT_PUBLIC_APP_MODE ?? process.env.VITE_APP_MODE ?? "voting";

  return String(configuredMode).trim().toLowerCase() === "results"
    ? "results"
    : "voting";
};

export default function RootPage() {
  const appMode = readServerAppMode();
  const domain = appMode === "results" ? "results" : "public";

  return (
    appMode === "results" ? (
      <ResultsShell>
        <ResultsAccessHomePage />
      </ResultsShell>
    ) : (
      <DomainLayout domain={domain}>
        <PublicLandingHeader />
        <PublicRootPage />
      </DomainLayout>
    )
  );
}
