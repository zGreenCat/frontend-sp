"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Building2, Warehouse, Package, TrendingUp } from "lucide-react";

const metrics = [
  { title: "Usuarios", value: "5", icon: Users, trend: "+2 este mes", color: "text-primary" },
  { title: "Áreas", value: "3", icon: Building2, trend: "Sin cambios", color: "text-success" },
  { title: "Bodegas", value: "4", icon: Warehouse, trend: "+1 este mes", color: "text-accent" },
  { title: "Productos", value: "5", icon: Package, trend: "+3 este mes", color: "text-primary" },
];

const recentMoves = [
  { id: '1', box: 'BOX-001', action: 'Actualización', user: 'María López', date: '20/02/2025' },
  { id: '2', box: 'BOX-002', action: 'Creación', user: 'Pedro Martínez', date: '20/01/2025' },
  { id: '3', box: 'BOX-003', action: 'Creación', user: 'Carlos González', date: '01/03/2025' },
];

export function DashboardView() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard</h1>
        <p className="text-muted-foreground">Resumen general del sistema</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric) => (
          <Card key={metric.title} className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {metric.title}
              </CardTitle>
              <metric.icon className={`h-5 w-5 ${metric.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground mb-1">{metric.value}</div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-3 w-3 text-success" />
                <p className="text-xs text-muted-foreground">{metric.trend}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">Últimos movimientos de Cajas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentMoves.map((move) => (
              <div
                key={move.id}
                className="flex items-center justify-between p-4 rounded-2xl bg-secondary/30 hover:bg-secondary/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <Badge variant="outline" className="text-sm font-mono">
                    {move.box}
                  </Badge>
                  <div>
                    <p className="font-medium text-foreground">{move.action}</p>
                    <p className="text-sm text-muted-foreground">por {move.user}</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{move.date}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
