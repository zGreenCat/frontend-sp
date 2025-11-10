import { UsersView } from "@/presentation/views/UsersView";
import { ProtectedRoute } from "@/presentation/components/ProtectedRoute";
import { PERMISSIONS } from "@/shared/permissions";

export default function UsersPage() {
  return (
    <ProtectedRoute requiredPermission={PERMISSIONS.USERS_VIEW}>
      <UsersView />
    </ProtectedRoute>
  );
}
