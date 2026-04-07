import PublicElectionDetailPage from "@/features/publicElectionDetail/PublicElectionDetailPage";

interface PublicElectionDetailRoutePageProps {
  params: Promise<{
    electionId: string;
  }>;
}

export default async function PublicElectionDetailRoutePage({
  params,
}: Readonly<PublicElectionDetailRoutePageProps>) {
  const { electionId } = await params;

  return <PublicElectionDetailPage electionId={electionId} />;
}
