import { Plus, Search, Filter, BarChart3, X } from 'lucide-react';
import { ModeToggle } from '@/components/mode-toggle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { useIsMobile } from '@/hooks/use-mobile';
import { usePipeline } from '@/hooks/usePipeline';

interface HeaderProps {
  onAddLead: () => void;
  searchTerm?: string;
  onSearchChange?: (value: string) => void;
  statusFilter?: string;
  onStatusFilterChange?: (value: string) => void;
  sourceFilter?: string;
  onSourceFilterChange?: (value: string) => void;
}

const sourceOptions = [
  { value: 'all', label: 'Todas as Origens' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'website', label: 'Website' },
  { value: 'indicacao', label: 'Indicação' },
  { value: 'outro', label: 'Outro' },
];

export function Header({
  onAddLead,
  searchTerm = '',
  onSearchChange,
  statusFilter = 'all',
  onStatusFilterChange,
  sourceFilter = 'all',
  onSourceFilterChange,
}: HeaderProps) {
  const { columns: pipelineColumns } = usePipeline();
  const isMobile = useIsMobile();
  const hasFilters = statusFilter !== 'all' || sourceFilter !== 'all';
  const activeFilterCount = (statusFilter !== 'all' ? 1 : 0) + (sourceFilter !== 'all' ? 1 : 0);

  const statusOptions = [
    { value: 'all', label: 'Todos os Status' },
    ...pipelineColumns.map(col => ({ value: col.id, label: col.title }))
  ];

  const clearFilters = () => {
    onStatusFilterChange?.('all');
    onSourceFilterChange?.('all');
  };

  return (
    <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10">
      <div className="px-4 md:px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className={isMobile ? 'ml-12' : ''}>
            <h1 className="text-xl md:text-2xl font-display font-bold text-foreground">
              CRM Dashboard
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground">
              Gerencie seus leads e acompanhe o funil de vendas
            </p>
          </div>
          <Button onClick={onAddLead} className="gap-2" size={isMobile ? 'sm' : 'default'}>
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Novo Lead</span>
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar leads..."
              className="pl-10 bg-background"
              value={searchTerm}
              onChange={(e) => onSearchChange?.(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-2">
            <ModeToggle />
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="icon" className="relative">
                  <Filter className="h-4 w-4" />
                  {activeFilterCount > 0 && (
                    <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                      {activeFilterCount}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-72" align="end">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Filtros</h4>
                    {hasFilters && (
                      <Button variant="ghost" size="sm" onClick={clearFilters} className="h-auto p-0 text-muted-foreground hover:text-foreground">
                        Limpar
                      </Button>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground">Status</label>
                    <Select value={statusFilter} onValueChange={onStatusFilterChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground">Origem</label>
                    <Select value={sourceFilter} onValueChange={onSourceFilterChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {sourceOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {!isMobile && (
              <Button variant="outline" className="gap-2">
                <BarChart3 className="h-4 w-4" />
                Métricas
              </Button>
            )}
          </div>
        </div>

        {/* Active filter badges */}
        {hasFilters && (
          <div className="flex flex-wrap items-center gap-2 mt-3">
            {statusFilter !== 'all' && (
              <Badge variant="secondary" className="gap-1">
                {statusOptions.find(s => s.value === statusFilter)?.label}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => onStatusFilterChange?.('all')}
                />
              </Badge>
            )}
            {sourceFilter !== 'all' && (
              <Badge variant="secondary" className="gap-1">
                {sourceOptions.find(s => s.value === sourceFilter)?.label}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => onSourceFilterChange?.('all')}
                />
              </Badge>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
