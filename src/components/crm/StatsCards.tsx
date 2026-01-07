import { Users, UserPlus, Trophy, TrendingUp } from 'lucide-react';
import { Lead } from '@/types/lead';

interface StatsCardsProps {
  leads: Lead[];
}

export function StatsCards({ leads }: StatsCardsProps) {
  const totalLeads = leads.length;
  const newLeads = leads.filter((l) => l.status === 'novo').length;
  const wonLeads = leads.filter((l) => l.status === 'ganho').length;
  const inProgress = leads.filter(
    (l) => !['ganho', 'perdido', 'novo'].includes(l.status)
  ).length;

  const stats = [
    {
      label: 'Total de Leads',
      value: totalLeads,
      icon: Users,
      color: 'bg-primary/10 text-primary',
    },
    {
      label: 'Novos Hoje',
      value: newLeads,
      icon: UserPlus,
      color: 'bg-lead-new/10 text-lead-new',
    },
    {
      label: 'Em Progresso',
      value: inProgress,
      icon: TrendingUp,
      color: 'bg-lead-negotiation/10 text-lead-negotiation',
    },
    {
      label: 'Convertidos',
      value: wonLeads,
      icon: Trophy,
      color: 'bg-lead-won/10 text-lead-won',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="bg-card rounded-xl p-5 shadow-card border border-border/50"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className="text-3xl font-display font-bold text-foreground mt-1">
                {stat.value}
              </p>
            </div>
            <div className={`h-12 w-12 rounded-xl ${stat.color} flex items-center justify-center`}>
              <stat.icon className="h-6 w-6" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
