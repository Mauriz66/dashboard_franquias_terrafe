import { Lead, LeadOperation, LeadProfile, LeadSource, LeadStatus } from '../types/lead';

export interface TypebotVariables {
  nome?: string;
  email?: string;
  telefone?: string;
  localizacao?: string;
  outra_localizacao?: string;
  capital?: string;
  perfil_operador?: string;
  origem_lead?: string;
  atracao?: string;
  visao_cliente?: string;
  prazo?: string;
  confirmacao?: string;
  [key: string]: any;
}

const mapSource = (source?: string): LeadSource => {
  if (!source) return 'outro';
  const s = source.toLowerCase();
  if (s.includes('instagram')) return 'instagram';
  if (s.includes('facebook')) return 'facebook';
  if (s.includes('whatsapp')) return 'whatsapp';
  if (s.includes('site') || s.includes('web')) return 'website';
  if (s.includes('indica')) return 'indicacao';
  return 'outro';
};

const mapOperation = (op?: string): LeadOperation => {
  if (!op) return 'definindo';
  const o = op.toLowerCase();
  if (o.includes('investidor')) return 'investidor';
  if (o.includes('operar') || o.includes('eu mesmo')) return 'operador';
  return 'definindo';
};

const mapProfile = (op?: string): LeadProfile => {
  if (!op) return 'outro';
  const o = op.toLowerCase();
  if (o.includes('investidor')) return 'investidor';
  if (o.includes('operar') || o.includes('eu mesmo')) return 'empresario'; // Assumindo empresário/operador
  return 'outro';
};

const determineTags = (data: TypebotVariables): { name: string; color: string }[] => {
  const tags: { name: string; color: string }[] = [];

  // Tags baseadas no Capital
  if (data.capital) {
    if (data.capital.includes('Acima de R$ 500 mil')) {
      tags.push({ name: 'Alto Valor', color: '#10B981' }); // Green
    } else if (data.capital.includes('Até R$ 250 mil')) {
      tags.push({ name: 'Entrada', color: '#9CA3AF' }); // Gray
    }
  }

  // Tags baseadas no Prazo
  if (data.prazo) {
    if (data.prazo.includes('próximos 3 meses')) {
      tags.push({ name: 'Urgente', color: '#EF4444' }); // Red
    } else if (data.prazo.includes('só pesquisando') || data.prazo.includes('próximo ano')) {
      tags.push({ name: 'Frio', color: '#3B82F6' }); // Blue
    }
  }

  // Tags baseadas na Operação
  if (data.perfil_operador) {
    if (data.perfil_operador.toLowerCase().includes('investidor')) {
      tags.push({ name: 'Investidor', color: '#8B5CF6' }); // Purple
    }
  }

  return tags;
};

const determineStatus = (data: TypebotVariables): LeadStatus => {
  return 'novo';
};

export function mapTypebotToLead(data: TypebotVariables): Partial<Lead> {
  const notesParts = [];
  if (data.visao_cliente) notesParts.push(`Visão: ${data.visao_cliente}`);
  if (data.atracao) notesParts.push(`Atração: ${data.atracao}`);
  if (data.prazo) notesParts.push(`Prazo: ${data.prazo}`);
  if (data.confirmacao) notesParts.push(`Status Agendamento: ${data.confirmacao}`);

  const generatedTags = determineTags(data);

  // Nota: 'tags' aqui é apenas um array de objetos, mas no banco a relação é via tabela lead_tags.
  // O importador/webhook precisará lidar com a criação dessas tags se elas não existirem.
  // Para fins de Partial<Lead>, mantemos vazio ou passamos para uso posterior.
  
  return {
    name: data.nome || 'Sem nome',
    email: data.email || '',
    phone: data.telefone || '',
    location: data.localizacao || data.outra_localizacao || '',
    capital: data.capital || '',
    profile: mapProfile(data.perfil_operador),
    operation: mapOperation(data.perfil_operador),
    interest: data.atracao || '',
    source: mapSource(data.origem_lead),
    status: determineStatus(data),
    notes: notesParts.join('\n\n'),
    // Passamos as tags geradas dentro de uma propriedade auxiliar (não oficial do Lead, mas útil)
    // ou podemos instruir o caller a usar. Como LeadTag[] exige ID, não podemos preencher tudo aqui.
    // Vamos deixar vazio para evitar erros de tipagem estrita no insert, 
    // mas poderíamos retornar um objeto estendido se mudássemos o tipo de retorno.
    tags: [], 
    activities: [],
    created_at: new Date().toISOString(),
  };
}

// Helper exportado para obter as tags sugeridas sem quebrar a tipagem do Lead
export function getSuggestedTags(data: TypebotVariables) {
  return determineTags(data);
}
