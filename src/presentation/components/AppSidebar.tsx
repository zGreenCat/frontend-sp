"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Building2,
  Warehouse,
  Package,
  Box,
  Briefcase,
  FolderKanban,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { hasPermission, PERMISSIONS } from "@/shared/permissions";
import type { Permission } from "@/shared/permissions";

const items: Array<{
  title: string;
  url: string;
  icon: any;
  badge?: number;
  permission?: Permission;
}> = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard, permission: PERMISSIONS.DASHBOARD_VIEW },
  { title: "Usuarios", url: "/users", icon: Users, badge: 5, permission: PERMISSIONS.USERS_VIEW },
  { title: "Áreas", url: "/areas", icon: Building2, badge: 3, permission: PERMISSIONS.AREAS_VIEW },
  { title: "Bodegas", url: "/warehouses", icon: Warehouse, badge: 4, permission: PERMISSIONS.WAREHOUSES_VIEW },
  { title: "Cajas", url: "/boxes", icon: Box, badge: 3, permission: PERMISSIONS.BOXES_VIEW },
  { title: "Productos", url: "/products", icon: Package, badge: 5, permission: PERMISSIONS.PRODUCTS_VIEW },
  { title: "Proveedores", url: "/providers", icon: Briefcase, badge: 2, permission: PERMISSIONS.PROVIDERS_VIEW },
  { title: "Proyectos", url: "/projects", icon: FolderKanban, badge: 2, permission: PERMISSIONS.PROJECTS_VIEW },
];

export function AppSidebar() {
  const { open } = useSidebar();
  const pathname = usePathname();
  const { user } = useAuth();

  const isActive = (path: string) => pathname === path;
  
  // Filtrar items según permisos del usuario
  const visibleItems = items.filter(item => {
    if (!item.permission) return true;
    if (!user) return false;
    
    // Obtener el rol como string - puede venir como objeto o string
    let userRole: string;
    if (typeof user.role === 'string') {
      userRole = user.role;
    } else if (user.role && typeof user.role === 'object' && 'name' in user.role) {
      userRole = (user.role as any).name;
    } else {
      userRole = String(user.role);
    }
    
    // Mapear rol del backend al frontend si es necesario (JEFE_AREA -> JEFE)
    const ROLE_MAP: Record<string, string> = {
      'JEFE_AREA': 'JEFE',
      'BODEGUERO': 'SUPERVISOR',
    };
    const mappedRole = ROLE_MAP[userRole] || userRole;
    
    const hasAccess = hasPermission(mappedRole, item.permission);
    
    console.log(`🔐 Checking ${item.title}: originalRole=${userRole}, mappedRole=${mappedRole}, permission=${item.permission}, hasAccess=${hasAccess}`);
    
    return hasAccess;
  });

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarContent className="pt-4">
        <SidebarGroup>
          <SidebarGroupLabel className="text-sm font-semibold mb-2">
            {open && "Módulos"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <Link
                      href={item.url}
                      className={cn(
                        isActive(item.url)
                          ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                          : "hover:bg-sidebar-accent/50"
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                      {open && (
                        <div className="flex items-center justify-between flex-1">
                          <span>{item.title}</span>
                          {item.badge && (
                            <Badge variant="secondary" className="ml-auto text-xs h-5 px-1.5">
                              {item.badge}
                            </Badge>
                          )}
                        </div>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
