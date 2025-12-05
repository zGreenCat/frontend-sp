"use client";

import { UsersView } from "@/presentation/views/UsersView";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { PERMISSIONS } from "@/shared/permissions";

export default function UsersPage() {
  return (
    <ProtectedRoute requiredPermission={PERMISSIONS.USERS_VIEW}>
      <UsersView />
    </ProtectedRoute>
  );
}
