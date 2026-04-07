import ActiveElectionStatusRoutePage from "@/domains/voting/components/ActiveElectionStatusRoutePage";

interface ElectionStatusRouteProps {
  params: Promise<{
    electionId: string;
  }>;
}

export default async function ElectionStatusRoute({
  params,
}: Readonly<ElectionStatusRouteProps>) {
  const { electionId } = await params;

  return <ActiveElectionStatusRoutePage electionId={electionId} />;
}
