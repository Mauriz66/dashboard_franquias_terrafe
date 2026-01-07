import { LeadActivity } from '@/types/lead';
import { 
  MessageSquare, 
  ArrowRight, 
  Phone, 
  Mail, 
  Calendar,
  Clock 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePipeline } from '@/hooks/usePipeline';

interface LeadTimelineProps {
  activities: LeadActivity[];
}

const activityIcons = {
  note: MessageSquare,
  status_change: ArrowRight,
  call: Phone,
  email: Mail,
  meeting: Calendar,
};

const activityColors = {
  note: 'bg-blue-500/10 text-blue-500',
  status_change: 'bg-purple-500/10 text-purple-500',
  call: 'bg-green-500/10 text-green-500',
  email: 'bg-orange-500/10 text-orange-500',
  meeting: 'bg-primary/10 text-primary',
};

export function LeadTimeline({ activities }: LeadTimelineProps) {
  const { columns: pipelineColumns } = usePipeline();
  
  const getStatusLabel = (status: string) => {
    const col = pipelineColumns.find(c => c.id === status);
    return col ? col.title : status;
  };

  const sortedActivities = [...activities].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  if (sortedActivities.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        Nenhuma atividade registrada
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {sortedActivities.map((activity, index) => {
        const Icon = activityIcons[activity.type];
        return (
          <div
            key={activity.id}
            className={cn(
              'flex gap-3 p-3 rounded-lg bg-secondary/30 animate-fade-in',
            )}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div
              className={cn(
                'h-8 w-8 rounded-full flex items-center justify-center shrink-0',
                activityColors[activity.type]
              )}
            >
              <Icon className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              {activity.type === 'status_change' ? (
                <p className="text-sm">
                  <span className="font-medium">
                    {getStatusLabel(activity.oldStatus!)}
                  </span>
                  <ArrowRight className="inline h-3 w-3 mx-1" />
                  <span className="font-medium">
                    {getStatusLabel(activity.newStatus!)}
                  </span>
                </p>
              ) : (
                <p className="text-sm">{activity.content}</p>
              )}
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <Clock className="h-3 w-3" />
                {new Date(activity.createdAt).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
