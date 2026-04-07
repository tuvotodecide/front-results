import ElectionConfigCargosPage from "@/domains/voting/components/ElectionConfigCargosPage";

interface ElectionConfigCargosRouteProps {
  params: Promise<{
    electionId: string;
  }>;
}

export default async function ElectionConfigCargosRoute({
  params,
}: Readonly<ElectionConfigCargosRouteProps>) {
  const { electionId } = await params;

  return <ElectionConfigCargosPage electionId={electionId} />;
}
