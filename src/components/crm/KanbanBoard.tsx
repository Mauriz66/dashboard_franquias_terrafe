import { useState, useMemo } from 'react';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { Lead, LeadStatus, KanbanColumn as KanbanColumnType } from '@/types/lead';
import { KanbanColumn } from './KanbanColumn';
import { LeadModal } from './LeadModal';
import { EditLeadModal } from './EditLeadModal';
import { DeleteConfirmDialog } from './DeleteConfirmDialog';
import { AddNoteDialog } from './AddNoteDialog';
import { usePipeline } from '@/hooks/usePipeline';
import { EmptyState } from '@/components/crm/EmptyState';
import { Search, Loader2 } from 'lucide-react';

interface KanbanBoardProps {
  leads: Lead[];
  searchTerm?: string;
  statusFilter?: string;
  sourceFilter?: string;
  onUpdateLead: (lead: Lead) => void;
  onUpdateLeadStatus: (leadId: string, status: LeadStatus) => void;
  onDeleteLead: (leadId: string) => void;
  onDuplicateLead: (leadId: string) => void;
  onAddNote: (leadId: string, content: string) => void;
}

export function KanbanBoard({ 
  leads,
  searchTerm = '', 
  statusFilter = 'all', 
  sourceFilter = 'all',
  onUpdateLead,
  onUpdateLeadStatus,
  onDeleteLead,
  onDuplicateLead,
  onAddNote,
}: KanbanBoardProps) {
  const { columns: pipelineColumns, loading: loadingPipeline } = usePipeline();
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [leadToEdit, setLeadToEdit] = useState<Lead | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null);
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false);
  const [leadForNote, setLeadForNote] = useState<Lead | null>(null);

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const matchesSearch =
        !searchTerm ||
        lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.phone.includes(searchTerm);

      const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
      const matchesSource = sourceFilter === 'all' || lead.source === sourceFilter;

      return matchesSearch && matchesStatus && matchesSource;
    });
  }, [leads, searchTerm, statusFilter, sourceFilter]);

  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const newStatus = destination.droppableId as LeadStatus;
    onUpdateLeadStatus(draggableId, newStatus);
  };

  const handleLeadClick = (lead: Lead) => {
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

  const handleMoveLead = (lead: Lead, direction: 'left' | 'right') => {
    const currentIndex = pipelineColumns.findIndex(col => col.id === lead.status);
    if (currentIndex === -1) return;

    const newIndex = direction === 'left' ? currentIndex - 1 : currentIndex + 1;
    
    if (newIndex >= 0 && newIndex < pipelineColumns.length) {
      const newStatus = pipelineColumns[newIndex].id;
      onUpdateLeadStatus(lead.id, newStatus);
    }
  };

  const columns: KanbanColumnType[] = pipelineColumns.map((column) => ({
    ...column,
    leads: filteredLeads.filter((lead) => lead.status === column.id),
  }));

  if (loadingPipeline) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (filteredLeads.length === 0) {
    return (
      <EmptyState
        title="Nenhum lead encontrado"
        description="Tente ajustar seus filtros ou busca para encontrar o que procura."
        icon={Search}
      />
    );
  }

  return (
    <>
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4 px-1 animate-fade-in">
          {columns.map((column, index) => (
            <div 
              key={column.id} 
              className="animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <KanbanColumn
                id={column.id}
                title={column.title}
                color={column.color}
                leads={column.leads}
                onLeadClick={handleLeadClick}
                onEditLead={handleEditLead}
                onDeleteLead={handleDeleteClick}
                onDuplicateLead={(lead) => onDuplicateLead(lead.id)}
                onAddNote={handleAddNoteClick}
                onMoveLead={handleMoveLead}
                isFirstColumn={index === 0}
                isLastColumn={index === columns.length - 1}
              />
            </div>
          ))}
        </div>
      </DragDropContext>

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
    </>
  );
}
