import PocketBase from 'pocketbase';
import dotenv from 'dotenv';
import path from 'path';

// Carregar variáveis de ambiente
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const pbUrl = process.env.VITE_POCKETBASE_URL || 'http://127.0.0.1:8090';
const pbEmail = process.env.POCKETBASE_EMAIL;
const pbPassword = process.env.POCKETBASE_PASSWORD;

const pb = new PocketBase(pbUrl);

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
    source: 'whatsapp',
    status: 'qualificado',
    notes: 'MOTIVAÇÃO: Criar um legado de investimento e ajudar a marca em sua expansão com a experiência prática que já temos com o café do pé a xícara',
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
    source: 'instagram',
    status: 'qualificado',
    notes: 'MOTIVAÇÃO: Ter meu próprio negócio. Atrelado ao sonho de ter uma cafeteria',
    meeting_date: '2026-01-09',
    meeting_time: '18:00',
    meeting_link: 'https://calendar.app.google/Bjnup6yKLf7zcweJ6'
  }
];

async function addLeads() {
  if (pbEmail && pbPassword) {
      try {
        await pb.admins.authWithPassword(pbEmail, pbPassword);
      } catch (e) {
        console.warn('Admin auth failed, proceeding as guest/public if allowed');
      }
  }

  console.log(`Adicionando ${leads.length} leads...`);

  for (const lead of leads) {
    try {
        const { meeting_date, meeting_time, meeting_link, ...rest } = lead;
        const pbData = {
            ...rest,
            meeting_date,
            meeting_time,
            meeting_link,
            // PB doesn't allow setting created via API easily
        };

        const record = await pb.collection('leads').create(pbData);
        console.log(`Lead ${lead.name} adicionado com sucesso! ID: ${record.id}`);
    } catch (error) {
      console.error(`Erro ao adicionar ${lead.name}:`, error);
    }
  }
}

addLeads();
