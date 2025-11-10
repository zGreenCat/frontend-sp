"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import { useRepositories } from "@/presentation/providers/RepositoryProvider";
import { ListUsers } from "@/application/usecases/user/ListUsers";
import { TENANT_ID } from "@/shared/constants";
import { User } from "@/domain/entities/User";
import { EntityBadge } from "@/presentation/components/EntityBadge";
import { EmptyState } from "@/presentation/components/EmptyState";
import { useToast } from "@/hooks/use-toast";

export function UsersView() {
  const { userRepo } = useRepositories();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    const useCase = new ListUsers(userRepo);
    const result = await useCase.execute(TENANT_ID);
    
    if (result.ok) {
      setUsers(result.value);
    } else {
      toast({
        title: "Error",
        description: "Error al cargar usuarios",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.lastName.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Usuarios</h1>
          <p className="text-muted-foreground">Gestión de usuarios del sistema</p>
        </div>
        <Button className="bg-primary text-primary-foreground h-10 gap-2">
          <Plus className="h-4 w-4" />
          Nuevo Usuario
        </Button>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre o email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-10 bg-secondary/30"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Cargando...</div>
          ) : filteredUsers.length === 0 ? (
            <EmptyState message="No se encontraron usuarios" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Nombre</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Email</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Rol</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Estado</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Áreas</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b border-border hover:bg-secondary/20 transition-colors">
                      <td className="py-4 px-4">
                        <p className="font-medium text-foreground">{user.name} {user.lastName}</p>
                        <p className="text-sm text-muted-foreground">{user.rut}</p>
                      </td>
                      <td className="py-4 px-4 text-sm text-foreground">{user.email}</td>
                      <td className="py-4 px-4">
                        <EntityBadge status={user.role} />
                      </td>
                      <td className="py-4 px-4">
                        <EntityBadge status={user.status} />
                      </td>
                      <td className="py-4 px-4 text-sm text-muted-foreground">
                        {user.areas.length} área(s)
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
