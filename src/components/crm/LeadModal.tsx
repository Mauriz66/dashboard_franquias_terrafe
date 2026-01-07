import { Lead, LeadTag } from '@/types/lead';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  MapPin,
  Phone,
  Mail,
  Calendar,
  MessageCircle,
  DollarSign,
  User,
  Briefcase,
  Target,
  Link as LinkIcon,
  Clock,
  ExternalLink,
  Pencil,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePipeline } from '@/hooks/usePipeline';

interface LeadModalProps {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (lead: Lead) => void;
}

const profileLabels: Record<string, string> = {
  empresario: 'Empresário',
  investidor: 'Investidor',
  autonomo: 'Autônomo',
  assalariado: 'Assalariado',
  outro: 'Outro',
};

const operationLabels: Record<string, string> = {
  investidor: 'Investidor',
  operador: 'Operador',
  definindo: 'Em Definição',
  outro: 'Outro',
};

const sourceLabels: Record<string, string> = {
  instagram: 'Instagram',
  facebook: 'Facebook',
  whatsapp: 'WhatsApp',
  website: 'Website',
  indicacao: 'Indicação',
  outro: 'Outro',
};

export function LeadModal({ lead, open, onOpenChange, onEdit }: LeadModalProps) {
  if (!lead) return null;
  
  const { columns: pipelineColumns } = usePipeline();

  const getStatusLabel = (status: string) => {
    const col = pipelineColumns.find(c => c.id === status);
    return col ? col.title : status;
  };

  const getStatusColor = (status: string) => {
    const col = pipelineColumns.find(c => c.id === status);
    return col ? col.color : 'bg-gray-500';
  };

  const whatsappNumber = lead.phone.replace(/\D/g, '');

  const handleEdit = () => {
    onOpenChange(false);
    onEdit?.(lead);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-2xl font-display">
                {lead.name}
              </DialogTitle>
              <div className="flex items-center gap-2 mt-2">
                <Badge className={cn('text-white border-0', getStatusColor(lead.status))}>
                  {getStatusLabel(lead.status)}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  via {sourceLabels[lead.source]}
                </span>
              </div>
            </div>
            {onEdit && (
              <Button variant="outline" size="sm" onClick={handleEdit} className="gap-2">
                <Pencil className="h-4 w-4" />
                Editar
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Contact Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                Dados de Contato
              </h4>
              <div className="space-y-2">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{lead.location}</span>
                </div>
                <a
                  href={`https://wa.me/${whatsappNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-lg bg-tag-whatsapp/10 hover:bg-tag-whatsapp/20 transition-colors"
                >
                  <MessageCircle className="h-4 w-4 text-tag-whatsapp" />
                  <span className="text-sm">{lead.phone}</span>
                  <ExternalLink className="h-3 w-3 ml-auto text-muted-foreground" />
                </a>
                <a
                  href={`mailto:${lead.email}`}
                  className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                >
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{lead.email}</span>
                </a>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                Perfil e Interesse
              </h4>
              <div className="space-y-2">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <span className="text-xs text-muted-foreground">Capital</span>
                    <p className="text-sm font-medium">{lead.capital}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <span className="text-xs text-muted-foreground">Perfil</span>
                    <p className="text-sm font-medium">{profileLabels[lead.profile] || lead.profile}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <span className="text-xs text-muted-foreground">Operação</span>
                    <p className="text-sm font-medium">{operationLabels[lead.operation] || lead.operation}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                  <Target className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <span className="text-xs text-muted-foreground">Principal Interesse</span>
                    <p className="text-sm font-medium">{lead.interest}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tags */}
          {lead.tags.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                Etiquetas
              </h4>
              <div className="flex flex-wrap gap-2">
                {lead.tags.map((tag) => (
                  <Badge
                    key={tag.id}
                    className={cn('text-white border-0', tag.color)}
                  >
                    {tag.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Meeting */}
          {lead.meeting && (
            <div className="space-y-3">
              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                Próximos Passos
              </h4>
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">Reunião Agendada</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(lead.meeting.date).toLocaleDateString('pt-BR', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {lead.meeting.time}
                    </p>
                  </div>
                </div>
                {lead.meeting.link && (
                  <a
                    href={lead.meeting.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 flex items-center gap-2 text-sm text-primary hover:underline"
                  >
                    <LinkIcon className="h-4 w-4" />
                    Link do Agendamento
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Notes */}
          {lead.notes && (
            <div className="space-y-3">
              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                Observações
              </h4>
              <p className="text-sm text-muted-foreground bg-secondary/50 p-4 rounded-lg">
                {lead.notes}
              </p>
            </div>
          )}

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2 pt-4 border-t border-border">
            <Button asChild className="gap-2">
              <a
                href={`https://wa.me/${whatsappNumber}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle className="h-4 w-4" />
                Iniciar Conversa
              </a>
            </Button>
            <Button variant="outline" asChild className="gap-2">
              <a href={`tel:${lead.phone}`}>
                <Phone className="h-4 w-4" />
                Ligar
              </a>
            </Button>
            <Button variant="outline" asChild className="gap-2">
              <a href={`mailto:${lead.email}`}>
                <Mail className="h-4 w-4" />
                Enviar E-mail
              </a>
            </Button>
          </div>

          {/* Metadata */}
          <div className="text-xs text-muted-foreground pt-4 border-t border-border">
            <p>
              Criado em{' '}
              {new Date(lead.created_at || lead.createdAt || new Date()).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
            <p>
              Atualizado em{' '}
              {new Date(lead.updated_at || lead.updatedAt || new Date()).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
