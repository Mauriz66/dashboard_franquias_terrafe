import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ElementType;
}

export function EmptyState({ 
  title, 
  description, 
  actionLabel, 
  onAction,
  icon: Icon = PlusCircle 
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-64 p-8 text-center border-2 border-dashed rounded-lg border-muted-foreground/25 bg-muted/50">
      <div className="flex items-center justify-center w-12 h-12 mb-4 rounded-full bg-background shadow-sm">
        <Icon className="w-6 h-6 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-medium text-foreground">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground max-w-sm mb-6">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button onClick={onAction} variant="default">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
