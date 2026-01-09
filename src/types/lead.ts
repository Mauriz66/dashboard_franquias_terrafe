export type LeadStatus = string;

export type LeadSource = 
  | 'instagram'
  | 'facebook'
  | 'whatsapp'
  | 'website'
  | 'indicacao'
  | 'outro'
  | string;

export type LeadProfile = 
  | 'empresario'
  | 'investidor'
  | 'autonomo'
  | 'assalariado'
  | 'outro'
  | string;

export type LeadOperation = 
  | 'investidor'
  | 'operador'
  | 'definindo'
  | 'outro'
  | string;

export interface LeadTag {
  id: string;
  name: string;
  color: string;
}

export interface LeadMeeting {
  date: string;
  time: string;
  link?: string;
}

export interface LeadActivity {
  id: string;
  type: 'note' | 'status_change' | 'call' | 'email' | 'meeting';
  content: string;
  createdAt: string;
  created_at?: string;
  oldStatus?: LeadStatus;
  newStatus?: LeadStatus;
}

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  capital: string;
  profile: LeadProfile;
  operation: LeadOperation;
  interest: string;
  source: LeadSource;
  status: LeadStatus;
  tags: LeadTag[];
  meeting?: LeadMeeting;
  notes?: string;
  activities?: LeadActivity[];
  createdAt?: string; // Mantido para compatibilidade
  created_at?: string; // Campo do Supabase
  updatedAt?: string; // Mantido para compatibilidade
  updated_at?: string; // Campo do Supabase
}

export interface KanbanColumn {
  id: LeadStatus;
  title: string;
  color: string;
  leads: Lead[];
}
