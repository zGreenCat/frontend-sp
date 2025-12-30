import { WarehouseDetailView } from "@/presentation/views/WarehouseDetailView";

export default async function WarehouseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <WarehouseDetailView warehouseId={id} />;
}
