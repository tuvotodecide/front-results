import ElectionConfigPadronPage from "@/domains/voting/components/ElectionConfigPadronPage";

interface ElectionConfigPadronRouteProps {
  params: Promise<{
    electionId: string;
  }>;
}

export default async function ElectionConfigPadronRoute({
  params,
}: Readonly<ElectionConfigPadronRouteProps>) {
  const { electionId } = await params;

  return <ElectionConfigPadronPage electionId={electionId} />;
}
