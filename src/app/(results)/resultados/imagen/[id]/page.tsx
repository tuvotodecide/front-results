import ResultsImagePage from "@/domains/results/components/ResultsImagePage";

interface ResultsImageDetailRoutePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ResultsImageDetailRoutePage({
  params,
}: Readonly<ResultsImageDetailRoutePageProps>) {
  const { id } = await params;

  return <ResultsImagePage id={id} />;
}
