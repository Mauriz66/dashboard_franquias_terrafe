import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, FileSpreadsheet, FileText } from 'lucide-react';
import { Lead } from '@/types/lead';
import { useToast } from '@/hooks/use-toast';
import { usePipeline } from '@/hooks/usePipeline';

interface ExportButtonProps {
  leads: Lead[];
  disabled?: boolean;
}

const sourceLabels: Record<string, string> = {
  instagram: 'Instagram',
  facebook: 'Facebook',
  whatsapp: 'WhatsApp',
  website: 'Website',
  indicacao: 'Indicação',
  outro: 'Outro',
};

export function ExportButton({ leads, disabled }: ExportButtonProps) {
  const { toast } = useToast();
  const { columns: pipelineColumns } = usePipeline();

  const getStatusLabel = (status: string) => {
    const col = pipelineColumns.find(c => c.id === status);
    return col ? col.title : status;
  };

  const exportToCSV = () => {
    const headers = ['Nome', 'Email', 'Telefone', 'Localização', 'Capital', 'Status', 'Origem', 'Criado em'];
    const rows = leads.map((lead) => [
      lead.name,
      lead.email,
      lead.phone,
      lead.location,
      lead.capital,
      getStatusLabel(lead.status),
      sourceLabels[lead.source],
      new Date(lead.created_at || lead.createdAt || new Date()).toLocaleDateString('pt-BR'),
    ]);

    const csvContent = [
      headers.join(';'),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(';')),
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `leads_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    toast({
      title: 'Exportação concluída',
      description: `${leads.length} leads exportados para CSV`,
    });
  };

  const exportToJSON = () => {
    const blob = new Blob([JSON.stringify(leads, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `leads_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);

    toast({
      title: 'Exportação concluída',
      description: `${leads.length} leads exportados para JSON`,
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={disabled} className="gap-2">
          <Download className="h-4 w-4" />
          Exportar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={exportToCSV}>
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Exportar CSV (Excel)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToJSON}>
          <FileText className="h-4 w-4 mr-2" />
          Exportar JSON
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
