"use client";

import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { AssignmentHistoryEntry } from '@/domain/entities/AssignmentHistory';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { MapPin, Warehouse, UserPlus, UserMinus } from 'lucide-react';

interface AssignmentHistoryListProps {
  entries: AssignmentHistoryEntry[];
  isLoading?: boolean;
}

export function AssignmentHistoryList({ 
  entries, 
  isLoading = false 
}: AssignmentHistoryListProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No hay historial de asignaciones para este usuario.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {entries.map((entry) => {
        const Icon = entry.action === 'ASSIGNED' ? UserPlus : UserMinus;
        const TypeIcon = entry.entityType === 'AREA' ? MapPin : Warehouse;
        const bgColor = entry.action === 'ASSIGNED' 
          ? 'bg-green-50 dark:bg-green-950/20 border-green-200' 
          : 'bg-red-50 dark:bg-red-950/20 border-red-200';
        
        return (
          <div 
            key={entry.id} 
            className={`border rounded-lg p-3 ${bgColor}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-2">
                <Icon className={`h-5 w-5 mt-0.5 ${
                  entry.action === 'ASSIGNED' ? 'text-green-600' : 'text-red-600'
                }`} />
                <div>
                  <div className="flex items-center gap-2">
                    <TypeIcon className="h-4 w-4 text-muted-foreground" />
                    <p className="font-medium text-sm">
                      {entry.entityName}
                    </p>
                    <Badge 
                      variant={entry.action === 'ASSIGNED' ? 'default' : 'destructive'} 
                      className="text-xs"
                    >
                      {entry.action === 'ASSIGNED' ? 'Asignado' : 'Removido'}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {entry.entityType === 'AREA' ? 'Área' : 'Bodega'} • Por {entry.performedByName}
                  </p>
                </div>
              </div>
              <time className="text-xs text-muted-foreground whitespace-nowrap">
                {format(new Date(entry.timestamp), "dd MMM yyyy HH:mm", { locale: es })}
              </time>
            </div>
          </div>
        );
      })}
    </div>
  );
}
