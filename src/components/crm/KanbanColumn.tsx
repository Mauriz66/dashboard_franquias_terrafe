import { Droppable, Draggable } from '@hello-pangea/dnd';
import { Lead, LeadStatus } from '@/types/lead';
import { LeadCard } from './LeadCard';
import { cn } from '@/lib/utils';

interface KanbanColumnProps {
  id: LeadStatus;
  title: string;
  color: string;
  leads: Lead[];
  onLeadClick: (lead: Lead) => void;
  onEditLead?: (lead: Lead) => void;
  onDeleteLead?: (lead: Lead) => void;
  onDuplicateLead?: (lead: Lead) => void;
  onAddNote?: (lead: Lead) => void;
  onMoveLead?: (lead: Lead, direction: 'left' | 'right') => void;
  isFirstColumn?: boolean;
  isLastColumn?: boolean;
}

export function KanbanColumn({ 
  id, 
  title, 
  color, 
  leads, 
  onLeadClick,
  onEditLead,
  onDeleteLead,
  onDuplicateLead,
  onAddNote,
  onMoveLead,
  isFirstColumn,
  isLastColumn
}: KanbanColumnProps) {
  return (
    <div className="flex flex-col min-w-[300px] max-w-[300px] bg-secondary/50 rounded-xl">
      {/* Column Header */}
      <div className="flex items-center gap-2 p-4 pb-2">
        <div className={cn('w-3 h-3 rounded-full', color)} />
        <h3 className="font-semibold text-foreground">{title}</h3>
        <span className="ml-auto flex items-center justify-center h-6 w-6 rounded-full bg-muted text-muted-foreground text-sm font-medium">
          {leads.length}
        </span>
      </div>

      {/* Droppable Area */}
      <Droppable droppableId={id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn(
              'flex-1 p-2 space-y-2 overflow-y-auto min-h-[200px] transition-colors rounded-lg mx-2 mb-2',
              snapshot.isDraggingOver && 'bg-primary/5'
            )}
          >
            {leads.map((lead, index) => (
              <Draggable key={lead.id} draggableId={lead.id} index={index}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className={cn(
                      'transition-transform',
                      snapshot.isDragging && 'rotate-2 scale-105'
                    )}
                  >
                    <LeadCard 
                      lead={lead} 
                      onClick={() => onLeadClick(lead)}
                      onEdit={onEditLead}
                      onDelete={onDeleteLead}
                      onDuplicate={onDuplicateLead}
                      onAddNote={onAddNote}
                      onMove={onMoveLead}
                      canMoveLeft={!isFirstColumn}
                      canMoveRight={!isLastColumn}
                    />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}
