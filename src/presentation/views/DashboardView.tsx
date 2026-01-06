"use client";

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

export function DashboardView() {
  const router = useRouter();

  // Queries para KPIs principales
  const { data: usersData, isLoading: loadingUsers } = useUsers();
  const { data: areasData, isLoading: loadingAreas } = useAreas();
  const { data: warehousesData, isLoading: loadingWarehouses } = useWarehouses();
  const { data: boxesData, isLoading: loadingBoxes } = useBoxes({ page: 1, limit: 1 });

  // Totales defensivos (sirve tanto si viene paginado como array suelto)
  const usersTotal =
    (usersData as any)?.total ??
    (Array.isArray((usersData as any)?.data) ? (usersData as any).data.length : 0);

  const areasTotal = Array.isArray(areasData)
    ? areasData.length
    : (areasData as any)?.total ?? 0;

  const warehousesTotal = warehousesData?.length ?? 0;
  const boxesTotal =
    (boxesData as any)?.total ??
    (Array.isArray((boxesData as any)?.data)
      ? (boxesData as any).data.length
      : 0);

  // Queries para resumen de cajas por estado
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

  // Query para actividad reciente de cajas (últimas 5)
  const {
    data: recentBoxesData,
    isLoading: loadingRecentBoxes,
  } = useBoxes({ page: 1, limit: 5 });

  const metrics = [
    {
      title: "Usuarios",
      value: usersTotal,
      icon: Users,
      color: "text-blue-600",
      route: "/users",
      loading: loadingUsers,
    },
    {
      title: "Áreas",
      value: areasTotal,
      icon: Building2,
      color: "text-green-600",
      route: "/areas",
      loading: loadingAreas,
    },
    {
      title: "Bodegas",
      value: warehousesTotal,
      icon: Warehouse,
      color: "text-orange-600",
      route: "/warehouses",
      loading: loadingWarehouses,
    },
    {
      title: "Cajas",
      value: boxesTotal,
      icon: Package,
      color: "text-purple-600",
      route: "/boxes",
      loading: loadingBoxes,
    },
  ];

  const boxStatusSummary = [
    {
      label: "Disponible",
      count: boxesDisponible?.total ?? 0,
      status: BOX_STATUS.DISPONIBLE,
      icon: Package,
    },
    {
      label: "En Reparación",
      count: boxesEnReparacion?.total ?? 0,
      status: BOX_STATUS.EN_REPARACION,
      icon: TrendingUp,
    },
    {
      label: "Dañada",
      count: boxesDanada?.total ?? 0,
      status: BOX_STATUS.DANADA,
      icon: Package,
    },
    {
      label: "Retirada",
      count: boxesRetirada?.total ?? 0,
      status: BOX_STATUS.RETIRADA,
      icon: Package,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard</h1>
        <p className="text-muted-foreground">Panel de control logístico</p>
      </div>

      {/* KPIs principales - Cards clickeables */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric) => (
          <Card
            key={metric.title}
            className="shadow-sm hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => router.push(metric.route)}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {metric.title}
              </CardTitle>
              <metric.icon className={`h-5 w-5 ${metric.color}`} />
            </CardHeader>
            <CardContent>
              {metric.loading ? (
                <Skeleton className="h-9 w-20 mb-1" />
              ) : (
                <div className="text-3xl font-bold text-foreground mb-1">
                  {metric.value.toLocaleString()}
                </div>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="gap-1 text-xs p-0 h-auto hover:bg-transparent"
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(metric.route);
                }}
              >
                Ver todos
                <ArrowRight className="h-3 w-3" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Resumen de Cajas por Estado */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Package className="h-5 w-5" />
              Resumen de Cajas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {boxStatusSummary.map((item) => (
                <div
                  key={item.status}
                  className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium text-foreground">
                      {item.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold text-foreground">
                      {item.count}
                    </span>
                    <EntityBadge status={item.status} />
                  </div>
                </div>
              ))}
            </div>
            <Button
              variant="outline"
              className="w-full mt-4 gap-2"
              onClick={() => router.push("/boxes")}
            >
              <Eye className="h-4 w-4" />
              Ver todas las cajas
            </Button>
          </CardContent>
        </Card>

        {/* Actividad reciente de cajas */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Últimas Cajas Registradas
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/boxes")}
                className="gap-1"
              >
                Ver todas
                <ArrowRight className="h-4 w-4" />
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
                <Button
                  className="w-full mt-4 gap-2"
                  onClick={() => router.push("/boxes")}
                >
                  <Plus className="h-4 w-4" />
                  Crear primera caja
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {recentBoxesData.data.map((box) => (
                  <div
                    key={box.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors cursor-pointer"
                    onClick={() => router.push(`/boxes/${box.id}`)}
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="flex flex-col gap-1">
                        <p className="font-mono text-sm font-medium text-primary">
                          {box.qrCode}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {box.warehouseName || "Sin bodega asignada"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right hidden sm:block">
                        <p className="text-xs text-muted-foreground">
                          {box.createdAt
                            ? format(new Date(box.createdAt), "dd MMM yyyy", {
                                locale: es,
                              })
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
      </div>

      {/* Panel de Atajos Rápidos */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">Atajos Rápidos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button
              variant="outline"
              className="h-auto py-6 flex-col gap-2 hover:bg-primary/10 hover:border-primary"
              onClick={() => router.push("/boxes")}
            >
              <PackagePlus className="h-6 w-6" />
              <div className="text-center">
                <p className="font-semibold">Crear Caja</p>
                <p className="text-xs text-muted-foreground">
                  Nueva caja en sistema
                </p>
              </div>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-6 flex-col gap-2 hover:bg-primary/10 hover:border-primary"
              onClick={() => router.push("/warehouses")}
            >
              <Warehouse className="h-6 w-6" />
              <div className="text-center">
                <p className="font-semibold">Crear Bodega</p>
                <p className="text-xs text-muted-foreground">Nueva bodega</p>
              </div>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-6 flex-col gap-2 hover:bg-primary/10 hover:border-primary"
              onClick={() => router.push("/areas")}
            >
              <Building2 className="h-6 w-6" />
              <div className="text-center">
                <p className="font-semibold">Ver Áreas</p>
                <p className="text-xs text-muted-foreground">Gestionar áreas</p>
              </div>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-6 flex-col gap-2 hover:bg-primary/10 hover:border-primary"
              onClick={() => router.push("/users")}
            >
              <Users className="h-6 w-6" />
              <div className="text-center">
                <p className="font-semibold">Ver Usuarios</p>
                <p className="text-xs text-muted-foreground">
                  Gestionar usuarios
                </p>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
