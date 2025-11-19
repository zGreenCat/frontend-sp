"use client";

import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/presentation/components/AppSidebar";
import { AppTopbar } from "@/presentation/components/AppTopbar";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <SidebarProvider defaultOpen>
        <div className="min-h-screen w-full flex">
          <AppSidebar />
          <div className="flex-1 flex flex-col">
            <AppTopbar />
            <main className="flex-1 p-6 bg-background overflow-auto">
              {children}
            </main>
          </div>
        </div>
      </SidebarProvider>
    </ProtectedRoute>
  );
}
