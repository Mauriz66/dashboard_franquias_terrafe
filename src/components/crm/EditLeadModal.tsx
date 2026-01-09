import { useState, useEffect } from 'react';
import { Lead, LeadStatus, LeadSource, LeadProfile, LeadOperation, LeadTag } from '@/types/lead';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatPhone } from '@/lib/formatters';
import { Save, X } from 'lucide-react';
import { usePipeline } from '@/hooks/usePipeline';

interface EditLeadModalProps {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (lead: Lead) => void;
}

const sourceOptions: { value: LeadSource; label: string }[] = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'website', label: 'Website' },
  { value: 'indicacao', label: 'Indicação' },
  { value: 'outro', label: 'Outro' },
];

const profileOptions: { value: LeadProfile; label: string }[] = [
  { value: 'empresario', label: 'Empresário' },
  { value: 'investidor', label: 'Investidor' },
  { value: 'autonomo', label: 'Autônomo' },
  { value: 'assalariado', label: 'Assalariado' },
  { value: 'outro', label: 'Outro' },
];

const operationOptions: { value: LeadOperation; label: string }[] = [
  { value: 'investidor', label: 'Investidor' },
  { value: 'operador', label: 'Operador' },
  { value: 'definindo', label: 'Em Definição' },
  { value: 'outro', label: 'Outro' },
];

export function EditLeadModal({ lead, open, onOpenChange, onSave }: EditLeadModalProps) {
  const { columns: pipelineColumns } = usePipeline();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    capital: '',
    profile: 'empresario' as LeadProfile,
    operation: 'investidor' as LeadOperation,
    interest: '',
    source: 'whatsapp' as LeadSource,
    status: 'novo' as LeadStatus,
    notes: '',
    meetingDate: '',
    meetingTime: '',
    meetingLink: '',
  });

  useEffect(() => {
    if (lead) {
      setFormData({
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        location: lead.location,
        capital: lead.capital,
        profile: lead.profile,
        operation: lead.operation,
        interest: lead.interest,
        source: lead.source,
        status: lead.status,
        notes: lead.notes || '',
        meetingDate: lead.meeting?.date || '',
        meetingTime: lead.meeting?.time || '',
        meetingLink: lead.meeting?.link || '',
      });
    }
  }, [lead]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lead) return;

    const updatedLead: Lead = {
      ...lead,
      ...formData,
      meeting: formData.meetingDate ? {
        date: formData.meetingDate,
        time: formData.meetingTime,
        link: formData.meetingLink
      } : undefined,
      updatedAt: new Date().toISOString(),
    };

    onSave(updatedLead);
    onOpenChange(false);
  };

  if (!lead) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-display">
            Editar Lead
          </DialogTitle>
          <DialogDescription className="sr-only">
            Formulário para editar os dados do lead
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Contact Info */}
          <div className="space-y-4">
            <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Dados de Contato
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: formatPhone(e.target.value) })}
                  required
                  maxLength={15}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Localização</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  required
                />
              </div>
            </div>
          </div>

          {/* Profile */}
          <div className="space-y-4">
            <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Perfil e Interesse
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="capital">Capital Disponível</Label>
                <Select
                  value={formData.capital}
                  onValueChange={(value) => setFormData({ ...formData, capital: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ate-100k">Até R$ 100 mil</SelectItem>
                    <SelectItem value="100k-250k">R$ 100 mil - R$ 250 mil</SelectItem>
                    <SelectItem value="250k-500k">R$ 250 mil - R$ 500 mil</SelectItem>
                    <SelectItem value="500k-1m">R$ 500 mil - R$ 1 milhão</SelectItem>
                    <SelectItem value="acima-1m">Acima de R$ 1 milhão</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="interest">Principal Interesse</Label>
                <Input
                  id="interest"
                  value={formData.interest}
                  onChange={(e) => setFormData({ ...formData, interest: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Perfil</Label>
                <Select
                  value={formData.profile}
                  onValueChange={(value) => setFormData({ ...formData, profile: value as LeadProfile })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {profileOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tipo de Operação</Label>
                <Select
                  value={formData.operation}
                  onValueChange={(value) => setFormData({ ...formData, operation: value as LeadOperation })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {operationOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="space-y-4">
            <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Status e Origem
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value as LeadStatus })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {pipelineColumns.map((col) => (
                      <SelectItem key={col.id} value={col.id}>
                        {col.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Origem</Label>
                <Select
                  value={formData.source}
                  onValueChange={(value) => setFormData({ ...formData, source: value as LeadSource })}
                >
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
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />
          </div>

          {/* Meeting */}
          <div className="space-y-4">
            <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Agendamento
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="meetingDate">Data</Label>
                <Input
                  id="meetingDate"
                  type="date"
                  value={formData.meetingDate}
                  onChange={(e) => setFormData({ ...formData, meetingDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="meetingTime">Horário</Label>
                <Input
                  id="meetingTime"
                  type="time"
                  value={formData.meetingTime}
                  onChange={(e) => setFormData({ ...formData, meetingTime: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="meetingLink">Link da Reunião</Label>
                <Input
                  id="meetingLink"
                  type="url"
                  placeholder="https://meet.google.com/..."
                  value={formData.meetingLink}
                  onChange={(e) => setFormData({ ...formData, meetingLink: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button type="submit">
              <Save className="h-4 w-4 mr-2" />
              Salvar Alterações
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
