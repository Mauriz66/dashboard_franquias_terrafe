import { useMemo } from 'react';
import { 
  Users, 
  UserPlus, 
  Trophy, 
  TrendingUp, 
  Calendar, 
  ArrowUpRight, 
  Clock,
  DollarSign 
} from 'lucide-react';
import { Lead } from '@/types/lead';
import { usePipeline } from '@/hooks/usePipeline';
import { parseDate } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';

interface DashboardViewProps {
  leads: Lead[];
}

const statusLabels: Record<string, string> = {
  novo: 'Novo',
  contato: 'Contato',
  qualificado: 'Qualif.',
  proposta: 'Proposta',
  negociacao: 'Negoc.',
  ganho: 'Ganho',
  perdido: 'Perdido',
};

const COLORS = [
  'hsl(var(--lead-new))',
  'hsl(var(--lead-contacted))',
  'hsl(var(--lead-qualified))',
  'hsl(var(--lead-proposal))',
  'hsl(var(--lead-negotiation))',
  'hsl(var(--lead-won))',
  'hsl(var(--lead-lost))',
];

const SOURCE_COLORS: Record<string, string> = {
  instagram: 'hsl(var(--tag-instagram))',
  facebook: 'hsl(var(--tag-facebook))',
  whatsapp: 'hsl(var(--tag-whatsapp))',
  website: 'hsl(var(--tag-website))',
  indicacao: 'hsl(var(--tag-referral))',
};

export function DashboardView({ leads }: DashboardViewProps) {
  const { columns: pipelineColumns } = usePipeline();

  const stats = useMemo(() => {
    const total = leads.length;
    const newLeads = leads.filter((l) => l.status === 'novo').length;
    const wonLeads = leads.filter((l) => l.status === 'ganho').length;
    const lostLeads = leads.filter((l) => l.status === 'perdido').length;
    const inProgress = leads.filter(
      (l) => !['ganho', 'perdido', 'novo'].includes(l.status)
    ).length;
    const conversionRate = total > 0 ? Math.round((wonLeads / total) * 100) : 0;

    // Calculate growth stats
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();
    const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
    const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;

    const thisMonthLeads = leads.filter(l => {
      const d = parseDate(l.submitted_at || l.created_at || l.createdAt) || new Date(0);
      return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
    });

    const lastMonthLeads = leads.filter(l => {
      const d = parseDate(l.submitted_at || l.created_at || l.createdAt) || new Date(0);
      return d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear;
    });

    const leadsGrowth = lastMonthLeads.length > 0 
      ? Math.round(((thisMonthLeads.length - lastMonthLeads.length) / lastMonthLeads.length) * 100)
      : 0;

    const thisMonthWon = thisMonthLeads.filter(l => l.status === 'ganho').length;
    const lastMonthWon = lastMonthLeads.filter(l => l.status === 'ganho').length;

    const thisMonthConv = thisMonthLeads.length > 0 ? (thisMonthWon / thisMonthLeads.length) : 0;
    const lastMonthConv = lastMonthLeads.length > 0 ? (lastMonthWon / lastMonthLeads.length) : 0;

    const conversionGrowth = Math.round((thisMonthConv - lastMonthConv) * 100);

    return { total, newLeads, wonLeads, lostLeads, inProgress, conversionRate, leadsGrowth, conversionGrowth };
  }, [leads]);

  const funnelData = useMemo(() => {
    return pipelineColumns.slice(0, -1).map((column) => ({
      name: column.title,
      value: leads.filter((l) => l.status === column.id).length,
      fullName: column.title,
    }));
  }, [leads, pipelineColumns]);

  const sourceData = useMemo(() => {
    const sources = ['instagram', 'facebook', 'whatsapp', 'website', 'indicacao'];
    return sources.map((source) => ({
      name: source.charAt(0).toUpperCase() + source.slice(1),
      value: leads.filter((l) => l.source === source).length,
      color: SOURCE_COLORS[source],
    })).filter((s) => s.value > 0);
  }, [leads]);

  const weeklyData = useMemo(() => {
    const now = new Date();
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const count = leads.filter((l) => {
        const leadDate = l.submitted_at || l.created_at || l.createdAt;
        return leadDate?.startsWith(dateStr);
      }).length;
      days.push({
        day: date.toLocaleDateString('pt-BR', { weekday: 'short' }),
        leads: count,
      });
    }
    return days;
  }, [leads]);

  const recentLeads = useMemo(() => {
    return [...leads]
      .sort((a, b) => {
        const dateA = (parseDate(a.submitted_at || a.created_at || a.createdAt) || new Date(0)).getTime();
        const dateB = (parseDate(b.submitted_at || b.created_at || b.createdAt) || new Date(0)).getTime();
        return dateB - dateA;
      })
      .slice(0, 5);
  }, [leads]);

  const upcomingMeetings = useMemo(() => {
    return leads
      .filter((l) => l.meeting)
      .sort((a, b) => new Date(a.meeting!.date).getTime() - new Date(b.meeting!.date).getTime())
      .slice(0, 3);
  }, [leads]);

  const avgTimePerStage = useMemo(() => {
    const stageDurations: Record<string, number[]> = {};

    leads.forEach((lead) => {
      if (!lead.activities || lead.activities.length === 0) return;

      // Sort activities by date
      const sortedActivities = [...lead.activities].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );

      // Track entry time for current status
      let currentStatus = 'novo';
      let entryTime = new Date(lead.submitted_at || lead.created_at || lead.createdAt || 0).getTime();

      sortedActivities.forEach((activity) => {
        if (activity.oldStatus && activity.newStatus) {
          const changeTime = new Date(activity.createdAt).getTime();
          const duration = changeTime - entryTime; // ms

          if (!stageDurations[activity.oldStatus]) {
            stageDurations[activity.oldStatus] = [];
          }
          stageDurations[activity.oldStatus].push(duration);

          // Update for next stage
          currentStatus = activity.newStatus;
          entryTime = changeTime;
        }
      });
      
      // Note: We don't count the current ongoing stage duration because it hasn't finished yet
    });

    const formatDuration = (ms: number) => {
      const days = Math.floor(ms / (1000 * 60 * 60 * 24));
      if (days > 0) return `${days}d`;
      const hours = Math.floor(ms / (1000 * 60 * 60));
      if (hours > 0) return `${hours}h`;
      return '< 1h';
    };

    const result: Record<string, string> = {
      novo: '-',
      contato: '-',
      qualificado: '-',
      proposta: '-',
      negociacao: '-',
    };

    Object.keys(result).forEach((key) => {
      if (stageDurations[key] && stageDurations[key].length > 0) {
        const total = stageDurations[key].reduce((a, b) => a + b, 0);
        const avg = total / stageDurations[key].length;
        result[key] = formatDuration(avg);
      }
    });

    return result;
  }, [leads]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="animate-fade-in" style={{ animationDelay: '0ms' }}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de Leads</p>
                <p className="text-3xl font-display font-bold text-foreground mt-1">
                  {stats.total}
                </p>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <ArrowUpRight className={`h-3 w-3 ${stats.leadsGrowth >= 0 ? 'text-lead-won' : 'text-lead-lost'}`} />
                  <span className={`${stats.leadsGrowth >= 0 ? 'text-lead-won' : 'text-lead-lost'}`}>
                    {stats.leadsGrowth > 0 ? '+' : ''}{stats.leadsGrowth}%
                  </span> este mês
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Users className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="animate-fade-in" style={{ animationDelay: '50ms' }}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Novos Leads</p>
                <p className="text-3xl font-display font-bold text-foreground mt-1">
                  {stats.newLeads}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Aguardando primeiro contato
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-lead-new/10 text-lead-new flex items-center justify-center">
                <UserPlus className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="animate-fade-in" style={{ animationDelay: '100ms' }}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Em Negociação</p>
                <p className="text-3xl font-display font-bold text-foreground mt-1">
                  {stats.inProgress}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Leads ativos no funil
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-lead-negotiation/10 text-lead-negotiation flex items-center justify-center">
                <TrendingUp className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="animate-fade-in" style={{ animationDelay: '150ms' }}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Taxa de Conversão</p>
                <p className="text-3xl font-display font-bold text-foreground mt-1">
                  {stats.conversionRate}%
                </p>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <ArrowUpRight className={`h-3 w-3 ${stats.conversionGrowth >= 0 ? 'text-lead-won' : 'text-lead-lost'}`} />
                  <span className={`${stats.conversionGrowth >= 0 ? 'text-lead-won' : 'text-lead-lost'}`}>
                    {stats.conversionGrowth > 0 ? '+' : ''}{stats.conversionGrowth}%
                  </span> vs mês anterior
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-lead-won/10 text-lead-won flex items-center justify-center">
                <Trophy className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Funnel Chart */}
        <Card className="lg:col-span-2 animate-fade-in" style={{ animationDelay: '200ms' }}>
          <CardHeader>
            <CardTitle className="text-lg font-display">Funil de Vendas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={funnelData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={60} />
                  <Tooltip 
                    formatter={(value: number) => [value, 'Leads']}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {funnelData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Source Pie Chart */}
        <Card className="animate-fade-in" style={{ animationDelay: '250ms' }}>
          <CardHeader>
            <CardTitle className="text-lg font-display">Origem dos Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sourceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {sourceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Trend + Time per Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Trend */}
        <Card className="animate-fade-in" style={{ animationDelay: '300ms' }}>
          <CardHeader>
            <CardTitle className="text-lg font-display">Leads esta Semana</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="leads" 
                    stroke="hsl(var(--primary))" 
                    fill="hsl(var(--primary) / 0.2)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Time per Stage */}
        <Card className="animate-fade-in" style={{ animationDelay: '350ms' }}>
          <CardHeader>
            <CardTitle className="text-lg font-display flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Tempo Médio por Etapa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(avgTimePerStage).map(([status, time]) => {
                const column = pipelineColumns.find((c) => c.id === status);
                return (
                  <div key={status} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${column?.color}`} />
                      <span className="text-sm font-medium">{column?.title}</span>
                    </div>
                    <span className="text-sm text-muted-foreground font-mono">{time}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent + Meetings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Leads Recentes */}
        <Card className="animate-fade-in" style={{ animationDelay: '400ms' }}>
          <CardHeader>
            <CardTitle className="text-lg font-display">Leads Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentLeads.map((lead) => (
                <div key={lead.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary/70 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                      {lead.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{lead.name}</p>
                      <p className="text-xs text-muted-foreground">{lead.location}</p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(lead.submitted_at || lead.created_at || lead.createdAt || new Date()).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Próximas Reuniões */}
        <Card className="animate-fade-in" style={{ animationDelay: '450ms' }}>
          <CardHeader>
            <CardTitle className="text-lg font-display">Próximas Reuniões</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingMeetings.length > 0 ? (
                upcomingMeetings.map((lead) => (
                  <div key={lead.id} className="flex items-center gap-4 p-3 rounded-lg bg-primary/5 border border-primary/10">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Calendar className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{lead.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(lead.meeting!.date).toLocaleDateString('pt-BR', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short'
                        })} às {lead.meeting!.time}
                      </p>
                    </div>
                    {lead.meeting?.link && (
                      <a
                        href={lead.meeting.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline"
                      >
                        Acessar
                      </a>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Nenhuma reunião agendada
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
