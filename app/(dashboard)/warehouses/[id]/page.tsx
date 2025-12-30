import { WarehouseDetailView } from "@/presentation/views/WarehouseDetailView";

export default function WarehouseDetailPage({ params }: { params: { id: string } }) {
  return <WarehouseDetailView warehouseId={params.id} />;
}
