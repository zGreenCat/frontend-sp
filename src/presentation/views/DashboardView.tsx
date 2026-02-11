"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  Building2,
  Warehouse,
  Package,
  ArrowRight,
  Plus,
  Eye,
  TrendingUp,
  PackagePlus,
  AlertTriangle,
} from "lucide-react";
import { useUsers } from "@/hooks/useUsers";
import { useAreas } from "@/hooks/useAreas";
import { useWarehouses } from "@/hooks/useWarehouses";
import { useBoxes } from "@/hooks/useBoxes";
import { EntityBadge } from "@/presentation/components/EntityBadge";
import { EmptyState } from "@/presentation/components/EmptyState";
import { BOX_STATUS } from "@/shared/constants";
import { format } from "date-fns";
import { es } from "date-fns/locale";

// Mapa de estilos por estado de caja
const STATUS_STYLES: Record<string, { barColor: string; bgTrack: string }> = {
  [BOX_STATUS.DISPONIBLE]: { barColor: "#4CAF50", bgTrack: "#E0E0E0" },
  [BOX_STATUS.EN_REPARACION]: { barColor: "#F59E0B", bgTrack: "#E0E0E0" },
  [BOX_STATUS.DANADA]: { barColor: "#EF4444", bgTrack: "#E0E0E0" },
  [BOX_STATUS.RETIRADA]: { barColor: "#9CA3AF", bgTrack: "#E0E0E0" },
};

// Mapa de estilos para íconos de KPI (chips sutiles)
const KPI_ICON_STYLES: Record<string, { bg: string; fg: string }> = {
  "Cajas totales": { bg: "bg-[#2196F3]/10", fg: "text-[#2196F3]" },
  "Disponibles": { bg: "bg-[#4CAF50]/12", fg: "text-[#4CAF50]" },
  "Incidencias": { bg: "bg-[#EF4444]/10", fg: "text-[#EF4444]" },
  "Disponibilidad": { bg: "bg-[#2196F3]/10", fg: "text-[#2196F3]" },
  "Bodegas": { bg: "bg-[#2196F3]/10", fg: "text-[#2196F3]" },
  "Áreas": { bg: "bg-[#2196F3]/10", fg: "text-[#2196F3]" },
};

function safeTotal(data: any) {
  return (
    data?.total ??
    (Array.isArray(data?.data) ? data.data.length : Array.isArray(data) ? data.length : 0)
  );
}

export function DashboardView() {
  const router = useRouter();

  // Base queries
  const { data: usersData, isLoading: loadingUsers } = useUsers();
  const { data: areasData, isLoading: loadingAreas } = useAreas();
  const { data: warehousesData, isLoading: loadingWarehouses } = useWarehouses();
  const { data: boxesData, isLoading: loadingBoxes } = useBoxes({ page: 1, limit: 1 });

  const usersTotal = safeTotal(usersData);
  const areasTotal = safeTotal(areasData);
  const warehousesTotal = warehousesData?.length ?? 0;
  const boxesTotal = safeTotal(boxesData);

  // Boxes by status (counts)
  const { data: boxesDisponible } = useBoxes({
    status: BOX_STATUS.DISPONIBLE,
    page: 1,
    limit: 1,
  });
  const { data: boxesEnReparacion } = useBoxes({
    status: BOX_STATUS.EN_REPARACION,
    page: 1,
    limit: 1,
  });
  const { data: boxesDanada } = useBoxes({
    status: BOX_STATUS.DANADA,
    page: 1,
    limit: 1,
  });
  const { data: boxesRetirada } = useBoxes({
    status: BOX_STATUS.RETIRADA,
    page: 1,
    limit: 1,
  });

  const disponibleCount = boxesDisponible?.total ?? 0;
  const reparacionCount = boxesEnReparacion?.total ?? 0;
  const danadaCount = boxesDanada?.total ?? 0;
  const retiradaCount = boxesRetirada?.total ?? 0;

  const incidentCount = reparacionCount + danadaCount;
  const availabilityPct = useMemo(() => {
    if (!boxesTotal) return 0;
    return Math.round((disponibleCount / boxesTotal) * 100);
  }, [boxesTotal, disponibleCount]);

  // Recent boxes
  const { data: recentBoxesData, isLoading: loadingRecentBoxes } = useBoxes({ page: 1, limit: 5 });

  // NOTE: sin endpoint real para “sin bodega”, usamos muestra de las últimas 5.
  const recentNoWarehouse = useMemo(() => {
    const list = recentBoxesData?.data ?? [];
    return list.filter((b: any) => !b.warehouseName).length;
  }, [recentBoxesData]);

  // Executive KPIs (operación)
  const kpis = [
    {
      title: "Cajas totales",
      value: boxesTotal,
      icon: Package,
      tone: "text-[#2196F3]",
      helper: "Inventario total de cajas",
      loading: loadingBoxes,
      onClick: () => router.push("/boxes"),
    },
    {
      title: "Disponibles",
      value: disponibleCount,
      icon: Package,
      tone: "text-[#4CAF50]",
      helper: "Listas para uso/operación",
      loading: false,
      onClick: () => router.push("/boxes"),
    },
    {
      title: "Incidencias",
      value: incidentCount,
      icon: AlertTriangle,
      tone: "text-[#333333]",
      helper: "Dañadas + en reparación",
      loading: false,
      onClick: () => router.push("/boxes"),
    },
    {
      title: "Disponibilidad",
      value: `${availabilityPct}%`,
      icon: TrendingUp,
      tone: "text-[#2196F3]",
      helper: "Disponibles / Total",
      loading: loadingBoxes,
      onClick: () => router.push("/boxes"),
    },
    {
      title: "Bodegas",
      value: warehousesTotal,
      icon: Warehouse,
      tone: "text-[#333333]",
      helper: "Bodegas registradas",
      loading: loadingWarehouses,
      onClick: () => router.push("/warehouses"),
    },
    {
      title: "Áreas",
      value: areasTotal,
      icon: Building2,
      tone: "text-[#333333]",
      helper: "Áreas operativas",
      loading: loadingAreas,
      onClick: () => router.push("/areas"),
    },
  ];

  const statusRows = [
    { label: "Disponible", count: disponibleCount, status: BOX_STATUS.DISPONIBLE },
    { label: "En reparación", count: reparacionCount, status: BOX_STATUS.EN_REPARACION },
    { label: "Dañada", count: danadaCount, status: BOX_STATUS.DANADA },
    { label: "Retirada", count: retiradaCount, status: BOX_STATUS.RETIRADA },
  ];

  const totalForBars = Math.max(1, disponibleCount + reparacionCount + danadaCount + retiradaCount);

  const alerts = [
    {
      title: "Cajas con incidencias",
      value: incidentCount,
      desc: "Requieren revisión o gestión",
      show: incidentCount > 0,
      action: () => router.push("/boxes"),
    },
    {
      title: "Cajas retiradas",
      value: retiradaCount,
      desc: "Histórico de retiro",
      show: retiradaCount > 0,
      action: () => router.push("/boxes"),
    },
    {
      title: "Sin bodega (muestra)",
      value: recentNoWarehouse,
      desc: "Detectado en las últimas 5 registradas",
      show: recentNoWarehouse > 0,
      action: () => router.push("/boxes"),
      // TODO: reemplazar cuando backend permita filtrar por warehouseId null / unassigned
    },
  ].filter((a) => a.show);

  return (
    <div className="space-y-6">
      {/* Header + acciones */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Visión ejecutiva de operación logística</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            className="gap-2"
            onClick={() => router.push("/boxes")}
          >
            <Plus className="h-4 w-4" />
            Crear Caja
          </Button>
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => router.push("/warehouses")}
          >
            <Warehouse className="h-4 w-4" />
            Crear Bodega
          </Button>
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => router.push("/areas")}
          >
            <Building2 className="h-4 w-4" />
            Ver Áreas
          </Button>
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => router.push("/products")}
          >
            <Package className="h-4 w-4" />
            Ver Productos
          </Button>
        </div>
      </div>

      {/* KPIs ejecutivos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {kpis.map((kpi) => {
          const iconStyle = KPI_ICON_STYLES[kpi.title] || { bg: "bg-gray-100", fg: "text-[#333333]" };
          return (
            <Card
              key={kpi.title}
              className="shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              onClick={kpi.onClick}
            >
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <div className="space-y-1">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {kpi.title}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">{kpi.helper}</p>
                </div>
                <span className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${iconStyle.bg}`}>
                  <kpi.icon className={`h-5 w-5 ${iconStyle.fg}`} />
                </span>
              </CardHeader>
            <CardContent>
              {kpi.loading ? (
                <Skeleton className="h-9 w-24" />
              ) : (
                <div className="text-3xl font-bold text-foreground">
                  {typeof kpi.value === "number" ? kpi.value.toLocaleString() : kpi.value}
                </div>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="gap-1 text-xs p-0 h-auto mt-2 hover:bg-transparent"
                onClick={(e) => {
                  e.stopPropagation();
                  kpi.onClick();
                }}
              >
                Ver detalle <ArrowRight className="h-3 w-3" />
              </Button>
            </CardContent>
          </Card>
          );
        })}
      </div>

      {/* Paneles de decisión */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Estado de cajas (más visual, sin espacio muerto) */}
        <Card className="shadow-sm lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="h-5 w-5" />
              Estado de Cajas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {statusRows.map((row) => {
              const pct = Math.round((row.count / totalForBars) * 100);
              const styles = STATUS_STYLES[row.status] || { barColor: "#2196F3", bgTrack: "#E0E0E0" };
              return (
                <div
                  key={row.status}
                  className="rounded-lg border bg-background p-3 hover:bg-secondary/30 transition-colors"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="font-medium text-foreground truncate">{row.label}</span>
                      <EntityBadge status={row.status} />
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground">{pct}%</span>
                      <span className="text-xl font-bold text-foreground">{row.count}</span>
                    </div>
                  </div>

                  <div className="mt-2 h-2 w-full rounded-full overflow-hidden" style={{ backgroundColor: styles.bgTrack }}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, backgroundColor: styles.barColor }}
                    />
                  </div>
                </div>
              );
            })}

            <Button
              variant="outline"
              className="w-full mt-2 gap-2"
              onClick={() => router.push("/boxes")}
            >
              <Eye className="h-4 w-4" />
              Ver gestión de cajas
            </Button>
          </CardContent>
        </Card>

        {/* Alertas (exception-driven) */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-[#333333]" />
              Alertas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {alerts.length === 0 ? (
              <div className="py-6">
                <EmptyState message="Sin alertas por ahora ✅" />
              </div>
            ) : (
              <div className="space-y-3">
                {alerts.map((a) => (
                  <div
                    key={a.title}
                    className="rounded-lg border p-3 hover:bg-secondary/30 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium text-foreground truncate">{a.title}</p>
                        <p className="text-xs text-muted-foreground">{a.desc}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-foreground">{a.value}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2 p-0 h-auto text-xs"
                      onClick={a.action}
                    >
                      Ver <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Actividad reciente */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Últimas Cajas Registradas
            </div>
            <Button variant="ghost" size="sm" onClick={() => router.push("/boxes")} className="gap-1">
              Ver todas <ArrowRight className="h-4 w-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingRecentBoxes ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : !recentBoxesData || recentBoxesData.data.length === 0 ? (
            <div className="py-8">
              <EmptyState message="Aún no hay cajas registradas" />
              <Button className="w-full mt-4 gap-2" onClick={() => router.push("/boxes")}>
                <Plus className="h-4 w-4" />
                Crear primera caja
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {recentBoxesData.data.map((box: any) => (
                <div
                  key={box.id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-background hover:bg-secondary/30 transition-colors cursor-pointer"
                  onClick={() => router.push(`/boxes/${box.id}`)}
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="flex flex-col gap-1 min-w-0">
                      <p className="font-mono text-sm font-medium text-[#2196F3] truncate">
                        {box.qrCode}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {box.warehouseName || "Sin bodega asignada"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right hidden sm:block">
                      <p className="text-xs text-muted-foreground">
                        {box.createdAt
                          ? format(new Date(box.createdAt), "dd MMM yyyy", { locale: es })
                          : "-"}
                      </p>
                    </div>
                    <EntityBadge status={box.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bloque “corporativo” eliminado: Atajos Rápidos ya están arriba */}
    </div>
  );
}
