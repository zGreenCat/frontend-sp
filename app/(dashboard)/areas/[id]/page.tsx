import { AreaDetailView } from "@/presentation/views/AreaDetailView";

interface PageProps {
  params: {
    id: string;
  };
}

export default function AreaDetailPage({ params }: PageProps) {
  return <AreaDetailView areaId={params.id} />;
}
