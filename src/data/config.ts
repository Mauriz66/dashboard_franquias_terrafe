import { Lead, KanbanColumn } from '@/types/lead';

export const defaultTags = [
  { id: '1', name: 'Prioritário', color: 'bg-red-500' },
  { id: '2', name: 'Alto Potencial', color: 'bg-emerald-500' },
  { id: '3', name: 'Retorno', color: 'bg-amber-500' },
  { id: '4', name: 'VIP', color: 'bg-purple-500' },
  { id: '5', name: 'Primeira Compra', color: 'bg-blue-500' },
];

export const initialLeads: Lead[] = [];

export const kanbanColumns: Omit<KanbanColumn, 'leads'>[] = [
  { id: 'novo', title: 'Novos', color: 'bg-lead-new' },
  { id: 'contato', title: 'Em Contato', color: 'bg-lead-contacted' },
  { id: 'qualificado', title: 'Qualificados', color: 'bg-lead-qualified' },
  { id: 'proposta', title: 'Proposta', color: 'bg-lead-proposal' },
  { id: 'negociacao', title: 'Negociação', color: 'bg-lead-negotiation' },
  { id: 'ganho', title: 'Ganhos', color: 'bg-lead-won' },
  { id: 'perdido', title: 'Perdidos', color: 'bg-lead-lost' },
];
