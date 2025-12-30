"use client";

import { useState, useEffect } from "react";
import { AssignmentHistoryEntry } from "@/domain/entities/AssignmentHistory";
import { useRepositories } from "@/presentation/providers/RepositoryProvider";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Building2, Warehouse, Plus, Minus, Clock, User } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface AssignmentHistoryViewProps {
  userId: string;
  tenantId: string;
}

export function AssignmentHistoryView({ userId, tenantId }: AssignmentHistoryViewProps) {
  const { assignmentHistoryRepo } = useRepositories();
  const [history, setHistory] = useState<AssignmentHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const response = await assignmentHistoryRepo.findByUserId(userId);
      setHistory(response.data);
    } catch (error) {
      console.error("Error loading assignment history:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Historial de Asignaciones
          </CardTitle>
          <CardDescription>Cargando historial...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (history.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Historial de Asignaciones
          </CardTitle>
          <CardDescription>
            Registro de cambios en áreas y bodegas asignadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-2 opacity-20" />
            <p>No hay historial de asignaciones</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Historial de Asignaciones
        </CardTitle>
        <CardDescription>
          {history.length} {history.length === 1 ? "cambio registrado" : "cambios registrados"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {history.map((entry, index) => (
              <div key={entry.id}>
                <HistoryEntry entry={entry} />
                {index < history.length - 1 && <Separator className="my-4" />}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

function HistoryEntry({ entry }: { entry: AssignmentHistoryEntry }) {
  const Icon = entry.entityType === "AREA" ? Building2 : Warehouse;
  const ActionIcon = entry.action === "ASSIGNED" ? Plus : Minus;
  
  const actionColor = entry.action === "ASSIGNED" 
    ? "text-green-600 bg-green-50 dark:bg-green-950 dark:text-green-400" 
    : "text-red-600 bg-red-50 dark:bg-red-950 dark:text-red-400";

  const entityTypeLabel = entry.entityType === "AREA" ? "Área" : "Bodega";
  const actionLabel = entry.action === "ASSIGNED" ? "asignó" : "removió";

  return (
    <div className="flex gap-4">
      <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${actionColor}`}>
        <ActionIcon className="h-5 w-5" />
      </div>
      
      <div className="flex-1 space-y-1">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <p className="text-sm font-medium">
              {entityTypeLabel} {entry.action === "ASSIGNED" ? "agregada" : "removida"}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <Icon className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{entry.entityName}</span>
              <Badge variant="outline" className="text-xs">
                {entry.entityType}
              </Badge>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <User className="h-3 w-3" />
          <span>{entry.performedByName}</span>
          <span>•</span>
          <Clock className="h-3 w-3" />
          <span>
            {formatDistanceToNow(new Date(entry.timestamp), {
              addSuffix: true,
              locale: es,
            })}
          </span>
        </div>
      </div>
    </div>
  );
}
