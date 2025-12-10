// src/hooks/useAreaDetail.ts
import { useQuery } from "@tanstack/react-query";
import { useRepositories } from "@/presentation/providers/RepositoryProvider";
import { Area } from "@/domain/entities/Area";
import { Warehouse as WarehouseEntity } from "@/domain/entities/Warehouse";
import { User } from "@/domain/entities/User";
import { GetAreaDetail } from "@/application/usecases/area/GetAreaDetail";
import { TENANT_ID } from "@/shared/constants";

interface AreaDetailData {
  area: Area;
  managers: User[];
  warehouses: WarehouseEntity[];
}

export function useAreaDetail(areaId: string) {
  const { areaRepo } = useRepositories();

  return useQuery<AreaDetailData>({
    queryKey: ["area-detail", areaId],
    enabled: !!areaId,
    queryFn: async () => {
      const getDetailUseCase = new GetAreaDetail(areaRepo);
      const result = await getDetailUseCase.execute(areaId);

      if (!result.ok || !result.value) {
        throw new Error(result.error || "El área solicitada no existe");
      }

      const { area: areaData, managers, warehouses } = result.value;

      // --- MAP MANAGERS -> User[] (solo JEFE_AREA) ---
      const managersAsUsers: User[] = managers
        .filter((m: any) => {
          // Filtrar SOLO usuarios con rol JEFE_AREA
          if (m.role) {
            const roleName = typeof m.role === "string" ? m.role : m.role.name;
            // Solo aceptar JEFE_AREA (el nombre que viene del backend)
            return roleName === "JEFE_AREA" || roleName === "AREA_MANAGER";
          }
          // Si no envía rol, no incluir (ser más estricto)
          return false;
        })
        .map((m: any) => {
          let firstName = "";
          let lastName = "";

          // El backend ahora envía 'fullName' directamente
          if (m.fullName) {
            const nameParts = m.fullName.trim().split(" ");
            firstName = nameParts[0] || "";
            lastName = nameParts.slice(1).join(" ") || "";
          }
          // Fallback: el API envía 'name' como nombre completo
          else if (m.name) {
            const nameParts = m.name.trim().split(" ");
            firstName = nameParts[0] || "";
            lastName = nameParts.slice(1).join(" ") || "";
          }
          // Fallback por si vienen separados
          else if (m.firstName || m.lastName) {
            firstName = m.firstName || "";
            lastName = m.lastName || "";
          }

          return {
            id: m.id,
            name: firstName,
            lastName: lastName,
            email: m.email || "",
            rut: "",
            phone: "",
            role: "JEFE" as const,
            status: "HABILITADO" as const,
            areas: [areaId],
            warehouses: [],
            tenantId: TENANT_ID,
            areaAssignments: m.assignmentId
              ? [
                  {
                    id: m.assignmentId,
                    userId: m.id,
                    areaId: areaId,
                    assignedBy: "",
                    assignedAt: m.assignedAt || "",
                    revokedAt: null,
                    isActive: m.isActive ?? true,
                    area: {
                      id: areaId,
                      name: areaData?.name || "",
                      nodeType: "ROOT",
                      level: 0,
                      isActive: true,
                    },
                  },
                ]
              : [],
          };
        });

      // --- MAP WAREHOUSES -> WarehouseEntity[] (mismo mapping que tenías) ---
      const warehousesAsEntities: WarehouseEntity[] = warehouses.map((w: any) => ({
        id: w.id,
        name: w.name,
        location: w.location || "",
        capacityKg: w.capacityKg || 0,
        status: (w.status || "ACTIVO") as "ACTIVO" | "INACTIVO",
        tenantId: TENANT_ID,
      }));

      return {
        area: areaData,
        managers: managersAsUsers,
        warehouses: warehousesAsEntities,
      };
    },
  });
}
