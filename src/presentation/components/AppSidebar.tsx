"use client";

import Link from "next/link";
import Image from "next/image";
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
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { hasPermission, PERMISSIONS } from "@/shared/permissions";
import type { Permission } from "@/shared/permissions";

// Helper classes para nav items (estilo pill azul)
const navItemBase = "transition-all duration-200 rounded-lg focus-visible:ring-2 focus-visible:ring-[#2196F3]/40 focus-visible:ring-offset-2 focus-visible:outline-none";
const navItemInactive = "text-[#333333]/70 hover:bg-[#2196F3]/10 hover:text-[#2196F3]";
const navItemActive = "bg-[#2196F3]/15 text-[#2196F3] font-medium";

type Item = {
  title: string;
  url: string;
  icon: any;
  permission?: Permission;
};

const groups: Array<{
  label: string;
  items: Item[];
}> = [
  {
    label: "Operación",
    items: [
      { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard, permission: PERMISSIONS.DASHBOARD_VIEW },
      { title: "Cajas", url: "/boxes", icon: Box, permission: PERMISSIONS.BOXES_VIEW },
    ],
  },
  {
    label: "Maestros",
    items: [
      { title: "Productos", url: "/products", icon: Package, permission: PERMISSIONS.PRODUCTS_VIEW },
      { title: "Proveedores", url: "/providers", icon: Briefcase, permission: PERMISSIONS.PROVIDERS_VIEW },
      { title: "Bodegas", url: "/warehouses", icon: Warehouse, permission: PERMISSIONS.WAREHOUSES_VIEW },
      { title: "Áreas", url: "/areas", icon: Building2, permission: PERMISSIONS.AREAS_VIEW },
      { title: "Usuarios", url: "/users", icon: Users, permission: PERMISSIONS.USERS_VIEW },
    ],
  },
  {
    label: "Gestión",
    items: [
      { title: "Proyectos", url: "/projects", icon: FolderKanban, permission: PERMISSIONS.PROJECTS_VIEW },
    ],
  },
];

export function AppSidebar() {
  const { open } = useSidebar();
  const pathname = usePathname();
  const { user } = useAuth();

  const isActive = (path: string) => pathname === path;

  const canSee = (item: Item) => {
    if (!item.permission) return true;
    if (!user) return false;

    let userRole: string;
    if (typeof user.role === "string") userRole = user.role;
    else if (user.role && typeof user.role === "object" && "name" in user.role) userRole = (user.role as any).name;
    else userRole = String(user.role);

    const ROLE_MAP: Record<string, string> = {
      JEFE_AREA: "JEFE",
      BODEGUERO: "SUPERVISOR",
    };

    const mappedRole = ROLE_MAP[userRole] || userRole;
    return hasPermission(mappedRole, item.permission);
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarContent className="pt-4">
        {/* Logo */}
        <div className="px-4 py-3 mb-2">
          {open ? (
            <Image
              src="/images/logotipo1.png"
              alt="Smart Packaging"
              width={140}
              height={48}
              priority
              className="w-auto h-10 object-contain"
            />
          ) : (
            <Image
              src="/images/logotipo2.png"
              alt="SP"
              width={40}
              height={40}
              priority
              className="w-8 h-8 object-contain mx-auto"
            />
          )}
        </div>

        {groups.map((group) => {
          const visible = group.items.filter(canSee);
          if (visible.length === 0) return null;

          return (
            <SidebarGroup key={group.label}>
              <SidebarGroupLabel className="text-xs font-semibold tracking-wide text-muted-foreground">
                {open ? group.label : ""}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {visible.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild isActive={isActive(item.url)}>
                        <Link
                          href={item.url}
                          className={cn(
                            navItemBase,
                            isActive(item.url)
                              ? navItemActive
                              : navItemInactive
                          )}
                        >
                          <item.icon className={cn(
                            "h-5 w-5",
                            isActive(item.url) ? "text-[#2196F3]" : ""
                          )} />
                          {open && <span className="ml-2">{item.title}</span>}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}
      </SidebarContent>
    </Sidebar>
  );
}
