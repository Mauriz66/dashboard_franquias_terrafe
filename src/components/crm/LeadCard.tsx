import { Lead } from '@/types/lead';
import { MapPin, Phone, Mail, Calendar, MessageCircle, MoreHorizontal, Pencil, Trash2, Copy, StickyNote } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface LeadCardProps {
  lead: Lead;
  onClick: () => void;
  onEdit?: (lead: Lead) => void;
  onDelete?: (lead: Lead) => void;
  onDuplicate?: (lead: Lead) => void;
  onAddNote?: (lead: Lead) => void;
}

const sourceIcons: Record<string, string> = {
  instagram: '📸',
  facebook: '📘',
  whatsapp: '💬',
  website: '🌐',
  indicacao: '🤝',
  outro: '📋',
};

const profileLabels: Record<string, string> = {
  empresario: 'Empresário',
  investidor: 'Investidor',
  autonomo: 'Autônomo',
  assalariado: 'Assalariado',
  outro: 'Outro',
};

export function LeadCard({ lead, onClick, onEdit, onDelete, onDuplicate, onAddNote }: LeadCardProps) {
  const whatsappNumber = lead.phone.replace(/\D/g, '');

  return (
    <div
      onClick={onClick}
      className="bg-card rounded-lg p-4 shadow-card hover:shadow-card-hover transition-all duration-200 cursor-pointer border border-border/50 group relative"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0 pr-8">
          <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
            {lead.name}
          </h3>
          <div className="flex items-center gap-1 text-sm text-muted-foreground mt-0.5">
            <MapPin className="h-3 w-3" />
            <span className="truncate">{lead.location}</span>
          </div>
        </div>
        <div className="absolute top-4 right-4 flex items-start gap-2">
           <span className="text-lg" title={lead.source}>
            {sourceIcons[lead.source]}
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuItem onClick={() => onEdit?.(lead)}>
                <Pencil className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDuplicate?.(lead)}>
                <Copy className="mr-2 h-4 w-4" />
                Duplicar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onAddNote?.(lead)}>
                <StickyNote className="mr-2 h-4 w-4" />
                Adicionar Nota
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onDelete?.(lead)} className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Tags */}
      {lead.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
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
      )}

      {/* Info */}
      <div className="space-y-1.5 text-sm text-muted-foreground mb-3">
        <div className="flex items-center gap-2">
          <span className="font-medium text-foreground">{lead.capital}</span>
        </div>
        <div className="text-xs">
          {profileLabels[lead.profile]}
        </div>
      </div>

      {/* Meeting */}
      {lead.meeting && (
        <div className="flex items-center gap-1.5 text-xs text-primary bg-primary/5 rounded-md p-2 mb-3">
          <Calendar className="h-3.5 w-3.5" />
          <span>
            {new Date(lead.meeting.date).toLocaleDateString('pt-BR')} às {lead.meeting.time}
          </span>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 pt-2 border-t border-border/50">
        <a
          href={`https://wa.me/${whatsappNumber}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="flex items-center justify-center h-8 w-8 rounded-md bg-tag-whatsapp/10 text-tag-whatsapp hover:bg-tag-whatsapp/20 transition-colors"
        >
          <MessageCircle className="h-4 w-4" />
        </a>
        <a
          href={`tel:${lead.phone}`}
          onClick={(e) => e.stopPropagation()}
          className="flex items-center justify-center h-8 w-8 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
        >
          <Phone className="h-4 w-4" />
        </a>
        <a
          href={`mailto:${lead.email}`}
          onClick={(e) => e.stopPropagation()}
          className="flex items-center justify-center h-8 w-8 rounded-md bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
        >
          <Mail className="h-4 w-4" />
        </a>
      </div>
    </div>
  );
}
