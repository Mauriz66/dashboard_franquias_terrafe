import { useState, useMemo } from 'react';
import { Lead } from '@/types/lead';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import {
  MoreHorizontal,
  MessageCircle,
  Phone,
  Mail,
  Eye,
  Pencil,
  Trash2,
  Copy,
  MessageSquarePlus,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  AlertCircle,
  Search,
} from 'lucide-react';
import { EmptyState } from './EmptyState';
import { LeadModal } from './LeadModal';
import { EditLeadModal } from './EditLeadModal';
import { DeleteConfirmDialog } from './DeleteConfirmDialog';
import { AddNoteDialog } from './AddNoteDialog';
import { ExportButton } from './ExportButton';
import { usePipeline } from '@/hooks/usePipeline';

interface LeadsTableViewProps {
  leads: Lead[];
  searchTerm?: string;
  statusFilter?: string;
  sourceFilter?: string;
  onUpdateLead: (lead: Lead) => void;
  onDeleteLead: (leadId: string) => void;
  onDuplicateLead: (leadId: string) => void;
  onAddNote: (leadId: string, content: string) => void;
}

type SortField = 'name' | 'location' | 'capital' | 'status' | 'createdAt';
type SortDirection = 'asc' | 'desc';

const sourceLabels: Record<string, string> = {
  instagram: 'Instagram',
  facebook: 'Facebook',
  whatsapp: 'WhatsApp',
  website: 'Website',
  indicacao: 'Indicação',
  outro: 'Outro',
};

function isLeadStale(lead: Lead): boolean {
  const lastUpdate = new Date(lead.updated_at || lead.updatedAt || new Date());
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24));
  return diffDays > 7 && !['ganho', 'perdido'].includes(lead.status);
}

export function LeadsTableView({ 
  leads,
  searchTerm = '', 
  statusFilter = 'all', 
  sourceFilter = 'all',
  onUpdateLead,
  onDeleteLead,
  onDuplicateLead,
  onAddNote,
}: LeadsTableViewProps) {
  const { columns: pipelineColumns } = usePipeline();

  const getStatusLabel = (status: string) => {
    const col = pipelineColumns.find(c => c.id === status);
    return col ? col.title : status;
  };

  const getStatusColor = (status: string) => {
    const col = pipelineColumns.find(c => c.id === status);
    return col ? col.color : 'bg-gray-500';
  };

  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [leadToEdit, setLeadToEdit] = useState<Lead | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null);
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false);
  const [leadForNote, setLeadForNote] = useState<Lead | null>(null);
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const filteredAndSortedLeads = useMemo(() => {
    const result = leads.filter((lead) => {
      const matchesSearch =
        !searchTerm ||
        lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.phone.includes(searchTerm) ||
        lead.location.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
      const matchesSource = sourceFilter === 'all' || lead.source === sourceFilter;

      return matchesSearch && matchesStatus && matchesSource;
    });

    result.sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'location':
          comparison = a.location.localeCompare(b.location);
          break;
        case 'capital':
          comparison = a.capital.localeCompare(b.capital);
          break;
        case 'status':
          const statusOrder = pipelineColumns.map(c => c.id);
          comparison = statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status);
          break;
        case 'createdAt':
          const dateA = new Date(a.created_at || a.createdAt || 0).getTime();
          const dateB = new Date(b.created_at || b.createdAt || 0).getTime();
          comparison = dateA - dateB;
          break;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [leads, searchTerm, statusFilter, sourceFilter, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4 ml-1 opacity-50" />;
    return sortDirection === 'asc' 
      ? <ArrowUp className="h-4 w-4 ml-1" /> 
      : <ArrowDown className="h-4 w-4 ml-1" />;
  };

  const handleViewLead = (lead: Lead) => {
    setSelectedLead(lead);
    setIsModalOpen(true);
  };

  const handleEditLead = (lead: Lead) => {
    setLeadToEdit(lead);
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = (lead: Lead) => {
    setLeadToDelete(lead);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (leadToDelete) {
      onDeleteLead(leadToDelete.id);
      setIsDeleteDialogOpen(false);
      setLeadToDelete(null);
    }
  };

  const handleAddNoteClick = (lead: Lead) => {
    setLeadForNote(lead);
    setIsNoteDialogOpen(true);
  };

  const handleAddNote = (content: string) => {
    if (leadForNote) {
      onAddNote(leadForNote.id, content);
    }
  };

  if (filteredAndSortedLeads.length === 0) {
    return (
      <EmptyState
        title="Nenhum lead encontrado"
        description="Tente ajustar seus filtros ou busca para encontrar o que procura."
        icon={Search}
      />
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Mostrando {filteredAndSortedLeads.length} de {leads.length} leads
        </p>
        <ExportButton leads={filteredAndSortedLeads} disabled={filteredAndSortedLeads.length === 0} />
      </div>

      <div className="rounded-md border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <button 
                  onClick={() => handleSort('name')}
                  className="flex items-center hover:text-foreground transition-colors"
                >
                  Nome <SortIcon field="name" />
                </button>
              </TableHead>
              <TableHead>Contato</TableHead>
              <TableHead>
                <button 
                  onClick={() => handleSort('location')}
                  className="flex items-center hover:text-foreground transition-colors"
                >
                  Local <SortIcon field="location" />
                </button>
              </TableHead>
              <TableHead>
                <button 
                  onClick={() => handleSort('capital')}
                  className="flex items-center hover:text-foreground transition-colors"
                >
                  Capital <SortIcon field="capital" />
                </button>
              </TableHead>
              <TableHead>Origem</TableHead>
              <TableHead>
                <button 
                  onClick={() => handleSort('status')}
                  className="flex items-center hover:text-foreground transition-colors"
                >
                  Status <SortIcon field="status" />
                </button>
              </TableHead>
              <TableHead>Etiquetas</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedLeads.map((lead, index) => {
              const whatsappNumber = lead.phone.replace(/\D/g, '');
              const stale = isLeadStale(lead);
              return (
                <TableRow 
                  key={lead.id} 
                  className={cn(
                    "cursor-pointer hover:bg-muted/50 animate-fade-in",
                    stale && "bg-amber-500/5"
                  )}
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                        {lead.name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{lead.name}</p>
                          {stale && (
                            <div title="Lead parado há mais de 7 dias">
                              <AlertCircle className="h-4 w-4 text-amber-500" />
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{lead.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <a
                        href={`https://wa.me/${whatsappNumber}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="h-8 w-8 rounded-md bg-tag-whatsapp/10 text-tag-whatsapp hover:bg-tag-whatsapp/20 flex items-center justify-center transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MessageCircle className="h-4 w-4" />
                      </a>
                      <a
                        href={`tel:${lead.phone}`}
                        className="h-8 w-8 rounded-md bg-muted text-muted-foreground hover:bg-muted/80 flex items-center justify-center transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Phone className="h-4 w-4" />
                      </a>
                      <a
                        href={`mailto:${lead.email}`}
                        className="h-8 w-8 rounded-md bg-muted text-muted-foreground hover:bg-muted/80 flex items-center justify-center transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Mail className="h-4 w-4" />
                      </a>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{lead.location}</TableCell>
                  <TableCell className="text-sm">{lead.capital}</TableCell>
                  <TableCell className="text-sm">{sourceLabels[lead.source] || lead.source}</TableCell>
                  <TableCell>
                    <Badge className={cn('text-white border-0', getStatusColor(lead.status))}>
                      {getStatusLabel(lead.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {lead.tags.slice(0, 2).map((tag) => (
                        <Badge
                          key={tag.id}
                          className={cn('text-xs text-white border-0', tag.color)}
                        >
                          {tag.name}
                        </Badge>
                      ))}
                      {lead.tags.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{lead.tags.length - 2}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleEditLead(lead)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewLead(lead)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Ver Detalhes
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleAddNoteClick(lead)}>
                            <MessageSquarePlus className="h-4 w-4 mr-2" />
                            Adicionar Nota
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onDuplicateLead(lead.id)}>
                            <Copy className="h-4 w-4 mr-2" />
                            Duplicar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-destructive focus:text-destructive"
                            onClick={() => handleDeleteClick(lead)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <LeadModal
        lead={selectedLead}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onEdit={handleEditLead}
      />

      <EditLeadModal
        lead={leadToEdit}
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        onSave={onUpdateLead}
      />

      <DeleteConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
        title="Excluir Lead"
        description={`Tem certeza que deseja excluir "${leadToDelete?.name}"? Esta ação pode ser desfeita.`}
      />

      <AddNoteDialog
        open={isNoteDialogOpen}
        onOpenChange={setIsNoteDialogOpen}
        onAdd={handleAddNote}
        leadName={leadForNote?.name}
      />
    </div>
  );
}
