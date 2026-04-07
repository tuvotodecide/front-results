import ElectionConfigPlanchasPage from "@/domains/voting/components/ElectionConfigPlanchasPage";

interface ElectionConfigPlanchasRouteProps {
  params: Promise<{
    electionId: string;
  }>;
}

export default async function ElectionConfigPlanchasRoute({
  params,
}: Readonly<ElectionConfigPlanchasRouteProps>) {
  const { electionId } = await params;

  return <ElectionConfigPlanchasPage electionId={electionId} />;
}
