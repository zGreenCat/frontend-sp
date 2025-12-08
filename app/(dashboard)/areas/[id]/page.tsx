import { AreaDetailView } from "@/presentation/views/AreaDetailView";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function AreaDetailPage({ params }: PageProps) {
  const { id } = await params;
  return <AreaDetailView areaId={id} />;
}
