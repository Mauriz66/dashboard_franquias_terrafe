import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePipeline } from '@/hooks/usePipeline';
import { Lead } from '@/types/lead';
import { parseDate } from '@/lib/utils';
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
  LineChart,
  Line,
  Legend,
} from 'recharts';

interface ReportsViewProps {
  leads: Lead[];
}

export function ReportsView({ leads }: ReportsViewProps) {
  const { columns: pipelineColumns } = usePipeline();

  // Data for funnel chart
  const funnelData = pipelineColumns.slice(0, -1).map(column => ({
    name: column.title,
    value: leads.filter(l => l.status === column.id).length,
  }));

  // Data for source distribution
  const sourceData = [
    { name: 'Instagram', value: leads.filter(l => l.source === 'instagram').length, color: '#E1306C' },
    { name: 'Facebook', value: leads.filter(l => l.source === 'facebook').length, color: '#4267B2' },
    { name: 'WhatsApp', value: leads.filter(l => l.source === 'whatsapp').length, color: '#25D366' },
    { name: 'Website', value: leads.filter(l => l.source === 'website').length, color: '#0EA5E9' },
    { name: 'Indicação', value: leads.filter(l => l.source === 'indicacao').length, color: '#8B5CF6' },
  ].filter(s => s.value > 0);

  // Data for capital distribution
  const capitalRanges = [
    { range: 'Até R$ 150k', min: 0, max: 150000 },
    { range: 'R$ 150k - 300k', min: 150000, max: 300000 },
    { range: 'R$ 300k - 500k', min: 300000, max: 500000 },
    { range: 'R$ 500k - 1M', min: 500000, max: 1000000 },
    { range: 'Acima de R$ 1M', min: 1000000, max: Infinity },
  ];

  const parseCapital = (value: string): number => {
    if (!value) return 0;
    const str = value.toLowerCase();
    
    // Check for "milhão" or "milhões"
    if (str.includes('milhão') || str.includes('milhoes') || str.includes('milhões')) {
        const num = parseFloat(str.replace(/[^\d.,]/g, '').replace(',', '.'));
        return num * 1000000;
    }
    
    // Check for "mil" or "k"
    if (str.includes('mil') || str.includes('k')) {
        const num = parseFloat(str.replace(/[^\d.,]/g, '').replace(',', '.'));
        return num * 1000;
    }

    // Try parsing as direct number
    const numsOnly = str.replace(/[^\d.,]/g, '');
    if (!numsOnly) return 0;
    
    // Handle brazilian format (1.000,00) vs international (1,000.00)
    // Simple heuristic: if it has comma and dot, and comma is last, it's decimal
    // If it has only comma, it might be decimal (PT-BR)
    // We'll assume PT-BR input mainly
    return parseFloat(numsOnly.replace('.', '').replace(',', '.'));
  };

  const capitalData = capitalRanges.map(range => ({
    name: range.range,
    value: leads.filter(l => {
      const capital = l.capital;
      if (!capital) return false;
      const value = parseCapital(capital);
      return value >= range.min && value < range.max;
    }).length,
  }));

  // Real monthly data calculation
  const monthlyData = useMemo(() => {
    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (5 - i));
      return d;
    });

    return last6Months.map(date => {
      const monthKey = date.toISOString().slice(0, 7); // YYYY-MM
      const monthLabel = date.toLocaleDateString('pt-BR', { month: 'short' });
      
      const leadsInMonth = leads.filter(l => {
        const created = parseDate(l.submitted_at || l.created_at || l.createdAt);
        return created && created.toISOString().startsWith(monthKey);
      });

      return {
        month: monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1),
        novos: leadsInMonth.length,
        ganhos: leadsInMonth.filter(l => l.status === 'ganho').length,
        perdidos: leadsInMonth.filter(l => l.status === 'perdido').length
      };
    });
  }, [leads]);

  // Profile distribution
  const profileData = [
    { name: 'Empresário', value: leads.filter(l => l.profile === 'empresario').length },
    { name: 'Investidor', value: leads.filter(l => l.profile === 'investidor').length },
    { name: 'Autônomo', value: leads.filter(l => l.profile === 'autonomo').length },
    { name: 'Assalariado', value: leads.filter(l => l.profile === 'assalariado').length },
  ].filter(p => p.value > 0);

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  // Stats
  const totalLeads = leads.length;
  const wonLeads = leads.filter(l => l.status === 'ganho').length;
  const lostLeads = leads.filter(l => l.status === 'perdido').length;
  const conversionRate = totalLeads > 0 ? ((wonLeads / totalLeads) * 100).toFixed(1) : '0';

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Total de Leads</p>
            <p className="text-3xl font-display font-bold mt-1">{totalLeads}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Conversões</p>
            <p className="text-3xl font-display font-bold text-lead-won mt-1">{wonLeads}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Perdidos</p>
            <p className="text-3xl font-display font-bold text-lead-lost mt-1">{lostLeads}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Taxa de Conversão</p>
            <p className="text-3xl font-display font-bold text-primary mt-1">{conversionRate}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Funnel Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-display">Funil de Vendas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={funnelData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Source Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-display">Origem dos Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sourceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {sourceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-display">Evolução Mensal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="novos" name="Novos" stroke="#3B82F6" strokeWidth={2} />
                  <Line type="monotone" dataKey="ganhos" name="Ganhos" stroke="#10B981" strokeWidth={2} />
                  <Line type="monotone" dataKey="perdidos" name="Perdidos" stroke="#EF4444" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Profile Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-display">Perfil dos Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={profileData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {profileData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Capital Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-display">Distribuição por Capital Disponível</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={capitalData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
