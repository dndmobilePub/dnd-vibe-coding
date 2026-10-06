import Workspace from "../../components/workspace";

export default async function NewAnalysisPage({ searchParams }: {
  searchParams: Promise<{ session?: string; copy?: string; title?: string }>;
}) {
  const params = await searchParams;
  return <Workspace view="analyses" editor sessionId={params.session ? Number(params.session) : undefined}
    copy={params.copy === "1"} initialTitle={params.title || ""} />;
}
