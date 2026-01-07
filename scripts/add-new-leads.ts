import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Carregar variáveis de ambiente
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Erro: VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY são obrigatórios no .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const leads = [
  {
    name: 'Jessé',
    email: 'jesseaguiaconsultoria@gmail.com',
    phone: '+55 27 99945-0904',
    location: 'Linhares - ES',
    capital: 'Acima de R$ 500 mil',
    profile: 'investidor',
    operation: 'investidor',
    interest: 'O potencial do negócio',
    source: 'whatsapp', // Assumindo WhatsApp dado o link de contato direto
    status: 'qualificado',
    notes: 'MOTIVAÇÃO: Criar um legado de investimento e ajudar a marca em sua expansão com a experiência prática que já temos com o café do pé a xícara',
    created_at: '2025-12-31T10:00:00Z', // Horário aproximado
    meeting_date: '2026-01-08',
    meeting_time: '16:00',
    meeting_link: 'https://calendar.app.google/Ss1Au61ugkaDCHCy7'
  },
  {
    name: 'Hebert',
    email: 'hebertdarc@hotmail.com',
    phone: '+55 27 99225-3992',
    location: 'Serra - ES',
    capital: 'Entre R$ 250 mil e R$ 400 mil',
    profile: 'investidor',
    operation: 'investidor',
    interest: 'O potencial do negócio',
    source: 'instagram', // Mapeando "Instagram / Facebook" para um valor válido do enum se necessário, ou mantendo texto se o front aguentar. O schema é text.
    status: 'qualificado',
    notes: 'MOTIVAÇÃO: Ter meu próprio negócio. Atrelado ao sonho de ter uma cafeteria',
    created_at: '2026-01-01T16:30:00Z',
    meeting_date: '2026-01-09',
    meeting_time: '18:00',
    meeting_link: 'https://calendar.app.google/Bjnup6yKLf7zcweJ6'
  }
];

async function addLeads() {
  console.log(`Adicionando ${leads.length} leads...`);

  for (const lead of leads) {
    const { data, error } = await supabase
      .from('leads')
      .insert([lead])
      .select();

    if (error) {
      console.error(`Erro ao adicionar ${lead.name}:`, error);
    } else {
      console.log(`Lead ${lead.name} adicionado com sucesso! ID: ${data[0].id}`);
    }
  }
}

addLeads();
