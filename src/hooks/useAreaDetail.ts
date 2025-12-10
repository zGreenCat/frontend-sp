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

      // --- MAP MANAGERS -> User[] (mismo mapping que tenías) ---
      const managersAsUsers: User[] = managers
        .filter((m: any) => {
          // Si el backend envía rol, verificar que sea JEFE/JEFE_AREA/AREA_MANAGER
          if (m.role) {
            const roleName = typeof m.role === "string" ? m.role : m.role.name;
            return (
              roleName === "JEFE" ||
              roleName === "JEFE_AREA" ||
              roleName === "AREA_MANAGER"
            );
          }
          // Si no envía rol, asumir que todos los managers son jefes
          return true;
        })
        .map((m: any) => {
          let firstName = "";
          let lastName = "";

          // El API envía 'name' como nombre completo
          if (m.name) {
            const nameParts = m.name.trim().split(" ");
            firstName = nameParts[0] || "";
            lastName = nameParts.slice(1).join(" ") || "";
          }
          // Fallback por si viene fullName
          else if (m.fullName) {
            const nameParts = m.fullName.trim().split(" ");
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
                    assignedAt: "",
                    revokedAt: null,
                    isActive: true,
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
