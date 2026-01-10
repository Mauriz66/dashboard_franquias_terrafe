const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

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

const parsePtBrDate = (dateStr) => {
  if (!dateStr) return new Date().toISOString();

  const months = {
    'jan.': 0, 'fev.': 1, 'mar.': 2, 'abr.': 3, 'mai.': 4, 'jun.': 5,
    'jul.': 6, 'ago.': 7, 'set.': 8, 'out.': 9, 'nov.': 10, 'dez.': 11,
    'jan': 0, 'fev': 1, 'mar': 2, 'abr': 3, 'mai': 4, 'jun': 5,
    'jul': 6, 'ago': 7, 'set': 8, 'out': 9, 'nov': 10, 'dez': 11,
  };

  const now = new Date();
  let year = now.getFullYear();
  let month = now.getMonth();
  let day = now.getDate();
  let hour = 0;
  let minute = 0;

  const cleanStr = String(dateStr).toLowerCase().replace(/de /g, '').trim();
  const parts = cleanStr.split(/[\s,]+/).filter(Boolean);

  if (parts.length >= 2) {
    day = Number.parseInt(parts[0], 10);
    const monthStr = parts[1];
    if (months[monthStr] !== undefined) month = months[monthStr];

    if (parts.length >= 4 && /^\d{4}$/.test(parts[2])) {
      year = Number.parseInt(parts[2], 10);
    }

    const timeStr = parts[parts.length - 1];
    if (timeStr.includes(':')) {
      const [h, m] = timeStr.split(':').map((n) => Number.parseInt(n, 10));
      hour = Number.isFinite(h) ? h : 0;
      minute = Number.isFinite(m) ? m : 0;
    }
  }

  const date = new Date(year, month, day, hour, minute);
  if (Number.isNaN(date.getTime())) return new Date().toISOString();

  if (date > new Date(now.getTime() + 1000 * 60 * 60 * 24 * 30)) {
    date.setFullYear(date.getFullYear() - 1);
  }

  return date.toISOString();
};

const parseSubmittedAt = (value) => {
  if (!value) return new Date().toISOString();
  if (value instanceof Date) return value.toISOString();

  const s = String(value).trim();
  if (!s) return new Date().toISOString();

  const isoCandidate = new Date(s);
  if (!Number.isNaN(isoCandidate.getTime())) return isoCandidate.toISOString();

  return parsePtBrDate(s);
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
      const find = await supabase.from('tags').select('id').eq('name', tag.name).maybeSingle();
      if (find.error) {
        console.error('Error finding tag:', find.error);
        continue;
      }
      if (find.data?.id) {
        tagIds.push(find.data.id);
        continue;
      }

      const created = await supabase.from('tags').insert([{ name: tag.name, color: tag.color }]).select('id').single();
      if (created.error) {
        console.error('Error creating tag:', created.error);
        continue;
      }
      tagIds.push(created.data.id);
    }

    const leadToInsert = {
      name: data.nome || 'Sem nome',
      email: data.email || null,
      phone: data.telefone || null,
      location: data.localizacao || data.outra_localizacao || null,
      capital: data.capital || null,
      profile: mapProfile(data.perfil_operador),
      operation: mapOperation(data.perfil_operador),
      interest: data.atracao || null,
      source: mapSource(data.origem_lead),
      status: 'novo',
      notes: notesParts.join('\n\n'),
      submitted_at: parseSubmittedAt(data.submitted_at || data.submittedAt || data['Submitted at']),
    };

    // 2. Insert or Update Lead
    let leadRecord = null;
    let isNew = false;

    if (leadToInsert.email) {
      const found = await supabase.from('leads').select('id').eq('email', leadToInsert.email).maybeSingle();
      if (found.error) throw found.error;
      if (found.data?.id) {
        const updated = await supabase.from('leads').update(leadToInsert).eq('id', found.data.id).select('id').single();
        if (updated.error) throw updated.error;
        leadRecord = updated.data;
      }
    }

    if (!leadRecord && leadToInsert.phone) {
      const found = await supabase.from('leads').select('id').eq('phone', leadToInsert.phone).maybeSingle();
      if (found.error) throw found.error;
      if (found.data?.id) {
        const updated = await supabase.from('leads').update(leadToInsert).eq('id', found.data.id).select('id').single();
        if (updated.error) throw updated.error;
        leadRecord = updated.data;
      }
    }

    if (!leadRecord) {
      const created = await supabase.from('leads').insert([leadToInsert]).select('id').single();
      if (created.error) throw created.error;
      leadRecord = created.data;
      isNew = true;
    }

    if (tagIds.length > 0) {
      try {
        await supabase.from('lead_tags').delete().eq('lead_id', leadRecord.id);
        await supabase.from('lead_tags').insert(tagIds.map((tagId) => ({ lead_id: leadRecord.id, tag_id: tagId })));
      } catch (tagError) {
        console.error('Error setting lead tags:', tagError);
      }
    }
    
    // 3. Insert Activity
    try {
      await supabase.from('activities').insert([
        {
          lead_id: leadRecord.id,
          type: 'note',
          content: isNew ? 'Lead criado via Webhook' : 'Lead atualizado via Webhook',
          old_status: null,
          new_status: null,
        },
      ]);
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
