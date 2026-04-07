import ElectionConfigReviewPage from "@/domains/voting/components/ElectionConfigReviewPage";

interface ElectionConfigReviewRouteProps {
  params: Promise<{
    electionId: string;
  }>;
}

export default async function ElectionConfigReviewRoute({
  params,
}: Readonly<ElectionConfigReviewRouteProps>) {
  const { electionId } = await params;

  return <ElectionConfigReviewPage electionId={electionId} />;
}
