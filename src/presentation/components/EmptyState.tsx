import { FileQuestion } from "lucide-react";

interface EmptyStateProps {
  message?: string;
}

export function EmptyState({ message = "Sin resultados" }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <FileQuestion className="h-16 w-16 text-muted-foreground mb-4" />
      <p className="text-lg text-muted-foreground">{message}</p>
    </div>
  );
}
