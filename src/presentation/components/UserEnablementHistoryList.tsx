// src/presentation/components/UserEnablementHistoryList.tsx
"use client";

import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { UserEnablementHistoryEntry } from '@/domain/entities/UserEnablementHistory';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, XCircle, Clock, User } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface UserEnablementHistoryListProps {
  entries: UserEnablementHistoryEntry[];
  isLoading?: boolean;
  showUserInfo?: boolean; // Si está en vista global, mostrar usuario afectado
}

export function UserEnablementHistoryList({
  entries,
  isLoading = false,
  showUserInfo = false,
}: UserEnablementHistoryListProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-start gap-4 p-4 border rounded-lg">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <Clock className="h-12 w-12 text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">
            No hay registros de habilitación/deshabilitación
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {entries.map((entry) => (
        <div
          key={entry.id}
          className="flex items-start gap-4 p-4 border border-border rounded-lg hover:bg-secondary/20 transition-colors"
        >
          {/* Icono de acción */}
          <div
            className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${
              entry.action === 'ENABLED'
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-700'
            }`}
          >
            {entry.action === 'ENABLED' ? (
              <CheckCircle2 className="h-5 w-5" />
            ) : (
              <XCircle className="h-5 w-5" />
            )}
          </div>

          {/* Contenido */}
          <div className="flex-1 min-w-0">
            {/* Acción y Badge */}
            <div className="flex items-center gap-2 mb-1">
              <p className="font-medium text-sm">
                {entry.action === 'ENABLED' ? 'Usuario Habilitado' : 'Usuario Deshabilitado'}
              </p>
              <Badge
                variant={entry.action === 'ENABLED' ? 'default' : 'destructive'}
                className="text-xs"
              >
                {entry.action}
              </Badge>
            </div>

            {/* Usuario afectado (solo en vista global) */}
            {showUserInfo && entry.user && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                <User className="h-3 w-3" />
                <span>
                  {entry.user.firstName} {entry.user.lastName}
                </span>
                <span className="text-muted-foreground/60">({entry.user.email})</span>
              </div>
            )}

            {/* Realizado por */}
            <p className="text-xs text-muted-foreground">
              Realizado por:{' '}
              <span className="font-medium text-foreground">
                {entry.performer
                  ? `${entry.performer.firstName} ${entry.performer.lastName}`
                  : 'Sistema'}
              </span>
            </p>

            {/* Fecha */}
            <p className="text-xs text-muted-foreground mt-1">
              {format(entry.occurredAt, "d 'de' MMMM 'de' yyyy, HH:mm", { locale: es })}
            </p>

            {/* Razón (si existe) */}
            {entry.reason && (
              <div className="mt-2 p-2 bg-secondary/30 rounded text-xs">
                <span className="font-medium">Motivo:</span> {entry.reason}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
