import { BoxDetailView } from "@/presentation/views/BoxDetailView";

interface BoxDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function BoxDetailPage({ params }: BoxDetailPageProps) {
  const { id } = await params;
  return <BoxDetailView boxId={id} />;
}
