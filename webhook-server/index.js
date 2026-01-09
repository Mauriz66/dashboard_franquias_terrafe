const express = require('express');
const cors = require('cors');
const PocketBase = require('pocketbase/cjs');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const POCKETBASE_URL = process.env.POCKETBASE_URL || 'http://127.0.0.1:8090';
const POCKETBASE_EMAIL = process.env.POCKETBASE_EMAIL;
const POCKETBASE_PASSWORD = process.env.POCKETBASE_PASSWORD;

const pb = new PocketBase(POCKETBASE_URL);

// Authenticate
const authenticate = async () => {
    try {
        if (POCKETBASE_EMAIL && POCKETBASE_PASSWORD) {
            await pb.admins.authWithPassword(POCKETBASE_EMAIL, POCKETBASE_PASSWORD);
            console.log('Authenticated with PocketBase');
        } else {
            console.warn('PocketBase credentials not provided. Ensure public access or set env vars.');
        }
    } catch (e) {
        console.error('PocketBase Auth Error:', e);
    }
};

authenticate();

// --- Mapping Logic ---
const mapSource = (source) => {
  if (!source) return 'outro';
  const s = source.toLowerCase();
  if (s.includes('instagram')) return 'instagram';
  if (s.includes('facebook')) return 'facebook';
  if (s.includes('whatsapp')) return 'whatsapp';
  if (s.includes('site') || s.includes('web')) return 'website';
  if (s.includes('indica')) return 'indicacao';
  return 'outro';
};

const mapOperation = (op) => {
  if (!op) return 'definindo';
  const o = op.toLowerCase();
  if (o.includes('investidor')) return 'investidor';
  if (o.includes('operar') || o.includes('eu mesmo')) return 'operador';
  return 'definindo';
};

const mapProfile = (op) => {
  if (!op) return 'outro';
  const o = op.toLowerCase();
  if (o.includes('investidor')) return 'investidor';
  if (o.includes('operar') || o.includes('eu mesmo')) return 'empresario';
  return 'outro';
};

const determineTags = (data) => {
  const tags = [];

  if (data.capital) {
    if (data.capital.includes('Acima de R$ 500 mil')) {
      tags.push({ name: 'Alto Valor', color: '#10B981' });
    } else if (data.capital.includes('Até R$ 250 mil')) {
      tags.push({ name: 'Entrada', color: '#9CA3AF' });
    }
  }

  if (data.prazo) {
    if (data.prazo.includes('próximos 3 meses')) {
      tags.push({ name: 'Urgente', color: '#EF4444' });
    } else if (data.prazo.includes('só pesquisando') || data.prazo.includes('próximo ano')) {
      tags.push({ name: 'Frio', color: '#3B82F6' });
    }
  }

  if (data.perfil_operador) {
    if (data.perfil_operador.toLowerCase().includes('investidor')) {
      tags.push({ name: 'Investidor', color: '#8B5CF6' });
    }
  }

  return tags;
};

// --- Route ---
app.post('/', async (req, res) => {
  try {
    const data = req.body;
    console.log('Received payload:', JSON.stringify(data));

    const notesParts = [];
    if (data.visao_cliente) notesParts.push(`Visão: ${data.visao_cliente}`);
    if (data.atracao) notesParts.push(`Atração: ${data.atracao}`);
    if (data.prazo) notesParts.push(`Prazo: ${data.prazo}`);
    if (data.confirmacao) notesParts.push(`Status Agendamento: ${data.confirmacao}`);

    // 1. Handle Tags
    const tagsToApply = determineTags(data);
    const tagIds = [];
    
    for (const tag of tagsToApply) {
        try {
            // Check if tag exists
            const existingTag = await pb.collection('tags').getFirstListItem(`name="${tag.name}"`);
            tagIds.push(existingTag.id);
        } catch (e) {
            // If 404 or error, try creating
             try {
                const newTag = await pb.collection('tags').create({ name: tag.name, color: tag.color });
                tagIds.push(newTag.id);
             } catch (createError) {
                 console.error('Error creating tag:', createError);
             }
        }
    }

    const leadToInsert = {
      name: data.nome || 'Sem nome',
      email: data.email || undefined,
      phone: data.telefone || undefined,
      location: data.localizacao || data.outra_localizacao || undefined,
      capital: data.capital || undefined,
      profile: mapProfile(data.perfil_operador),
      operation: mapOperation(data.perfil_operador),
      interest: data.atracao || undefined,
      source: mapSource(data.origem_lead),
      status: 'novo',
      notes: notesParts.join('\n\n'),
      tags: tagIds,
    };

    // 2. Insert or Update Lead (Upsert Logic)
    let leadRecord;
    let isNew = false;

    // Try to find existing lead by email
    if (leadToInsert.email) {
        try {
            const existingLead = await pb.collection('leads').getFirstListItem(`email="${leadToInsert.email}"`);
            // Update existing
            leadRecord = await pb.collection('leads').update(existingLead.id, leadToInsert);
            console.log('Lead updated:', leadRecord.id);
        } catch (e) {
            // Not found, proceed to create
        }
    }

    // If not found by email, try by phone (if provided)
    if (!leadRecord && leadToInsert.phone) {
         try {
            // Clean phone for search might be needed, but assuming exact match for now
            const existingLead = await pb.collection('leads').getFirstListItem(`phone="${leadToInsert.phone}"`);
            // Update existing
            leadRecord = await pb.collection('leads').update(existingLead.id, leadToInsert);
            console.log('Lead updated (by phone):', leadRecord.id);
        } catch (e) {
            // Not found
        }
    }

    // If still no record, create new
    if (!leadRecord) {
        leadRecord = await pb.collection('leads').create(leadToInsert);
        isNew = true;
        console.log('Lead created:', leadRecord.id);
    }
    
    // 3. Insert Activity
    try {
        await pb.collection('activities').create({
            lead: leadRecord.id,
            type: 'note',
            content: isNew ? 'Lead criado via Webhook' : 'Lead atualizado via Webhook'
        });
    } catch (actError) {
        console.error('Error creating activity:', actError);
    }

    res.status(200).json({ success: true, leadId: leadRecord.id, isNew });

  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Webhook server listening on port ${PORT}`);
});
