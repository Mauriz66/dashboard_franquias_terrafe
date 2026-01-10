import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const data = await req.json()
    console.log('Received payload:', JSON.stringify(data))

    // --- Helper Functions ---

    const mapSource = (source: string) => {
      if (!source) return 'outro'
      const s = source.toLowerCase()
      if (s.includes('instagram')) return 'instagram'
      if (s.includes('facebook')) return 'facebook'
      if (s.includes('whatsapp')) return 'whatsapp'
      if (s.includes('site') || s.includes('web')) return 'website'
      if (s.includes('indica')) return 'indicacao'
      return 'outro'
    }

    const mapOperation = (op: string) => {
      if (!op) return 'definindo'
      const o = op.toLowerCase()
      if (o.includes('investidor')) return 'investidor'
      if (o.includes('operar') || o.includes('eu mesmo')) return 'operador'
      return 'definindo'
    }

    const mapProfile = (op: string) => {
      if (!op) return 'outro'
      const o = op.toLowerCase()
      if (o.includes('investidor')) return 'investidor'
      if (o.includes('operar') || o.includes('eu mesmo')) return 'empresario'
      return 'outro'
    }

    const determineTags = (data: any) => {
      const tags = []

      if (data.capital) {
        if (data.capital.includes('Acima de R$ 500 mil')) {
          tags.push({ name: 'Alto Valor', color: '#10B981' })
        } else if (data.capital.includes('Até R$ 250 mil')) {
          tags.push({ name: 'Entrada', color: '#9CA3AF' })
        }
      }

      if (data.prazo) {
        if (data.prazo.includes('próximos 3 meses')) {
          tags.push({ name: 'Urgente', color: '#EF4444' })
        } else if (data.prazo.includes('só pesquisando') || data.prazo.includes('próximo ano')) {
          tags.push({ name: 'Frio', color: '#3B82F6' })
        }
      }

      if (data.perfil_operador) {
        if (data.perfil_operador.toLowerCase().includes('investidor')) {
          tags.push({ name: 'Investidor', color: '#8B5CF6' })
        }
      }

      return tags
    }

    const parsePtBrDate = (dateStr: any) => {
      if (!dateStr) return new Date().toISOString()

      const months: Record<string, number> = {
        'jan.': 0, 'fev.': 1, 'mar.': 2, 'abr.': 3, 'mai.': 4, 'jun.': 5,
        'jul.': 6, 'ago.': 7, 'set.': 8, 'out.': 9, 'nov.': 10, 'dez.': 11,
        'jan': 0, 'fev': 1, 'mar': 2, 'abr': 3, 'mai': 4, 'jun': 5,
        'jul': 6, 'ago': 7, 'set': 8, 'out': 9, 'nov': 10, 'dez': 11,
      }

      const now = new Date()
      let year = now.getFullYear()
      let month = now.getMonth()
      let day = now.getDate()
      let hour = 0
      let minute = 0

      const cleanStr = String(dateStr).toLowerCase().replace(/de /g, '').trim()
      const parts = cleanStr.split(/[\s,]+/).filter(Boolean)

      if (parts.length >= 2) {
        day = parseInt(parts[0], 10)
        const monthStr = parts[1]
        if (months[monthStr] !== undefined) month = months[monthStr]

        if (parts.length >= 4 && /^\d{4}$/.test(parts[2])) {
          year = parseInt(parts[2], 10)
        }

        const timeStr = parts[parts.length - 1]
        if (timeStr.includes(':')) {
          const [h, m] = timeStr.split(':').map((n) => parseInt(n, 10))
          hour = Number.isFinite(h) ? h : 0
          minute = Number.isFinite(m) ? m : 0
        }
      }

      const date = new Date(year, month, day, hour, minute)
      if (Number.isNaN(date.getTime())) return new Date().toISOString()

      if (date > new Date(now.getTime() + 1000 * 60 * 60 * 24 * 30)) {
        date.setFullYear(date.getFullYear() - 1)
      }

      return date.toISOString()
    }

    const parseSubmittedAt = (value: any) => {
      if (!value) return new Date().toISOString()
      
      // Try if it's already a valid date string/object
      const isoCandidate = new Date(value)
      if (!Number.isNaN(isoCandidate.getTime()) && String(value).includes('-')) { 
        return isoCandidate.toISOString()
      }

      // Fallback to PT-BR parsing
      return parsePtBrDate(value)
    }

    // --- Main Logic ---

    const notesParts = []
    if (data.visao_cliente) notesParts.push(`Visão: ${data.visao_cliente}`)
    if (data.atracao) notesParts.push(`Atração: ${data.atracao}`)
    if (data.prazo) notesParts.push(`Prazo: ${data.prazo}`)
    if (data.confirmacao) notesParts.push(`Status Agendamento: ${data.confirmacao}`)

    // 1. Handle Tags
    const tagsToApply = determineTags(data)
    const tagIds = []

    for (const tag of tagsToApply) {
      const { data: find, error: findError } = await supabaseClient
        .from('tags')
        .select('id')
        .eq('name', tag.name)
        .maybeSingle()

      if (findError) {
        console.error('Error finding tag:', findError)
        continue
      }
      if (find?.id) {
        tagIds.push(find.id)
        continue
      }

      const { data: created, error: createError } = await supabaseClient
        .from('tags')
        .insert([{ name: tag.name, color: tag.color }])
        .select('id')
        .single()

      if (createError) {
        console.error('Error creating tag:', createError)
        continue
      }
      tagIds.push(created.id)
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
      submitted_at: parseSubmittedAt(data.submitted_at || data.submittedAt || data['Submitted at'] || data['Criado em']),
    }

    // 2. Insert or Update Lead
    let leadRecord = null
    let isNew = false

    // Check by Email
    if (leadToInsert.email) {
      const { data: found } = await supabaseClient
        .from('leads')
        .select('id')
        .eq('email', leadToInsert.email)
        .maybeSingle()
      
      if (found?.id) {
        const { data: updated, error } = await supabaseClient
          .from('leads')
          .update(leadToInsert)
          .eq('id', found.id)
          .select('id')
          .single()
        if (error) throw error
        leadRecord = updated
      }
    }

    // Check by Phone if not found
    if (!leadRecord && leadToInsert.phone) {
      const { data: found } = await supabaseClient
        .from('leads')
        .select('id')
        .eq('phone', leadToInsert.phone)
        .maybeSingle()
      
      if (found?.id) {
        const { data: updated, error } = await supabaseClient
          .from('leads')
          .update(leadToInsert)
          .eq('id', found.id)
          .select('id')
          .single()
        if (error) throw error
        leadRecord = updated
      }
    }

    // Create if new
    if (!leadRecord) {
      const { data: created, error } = await supabaseClient
        .from('leads')
        .insert([leadToInsert])
        .select('id')
        .single()
      if (error) throw error
      leadRecord = created
      isNew = true
    }

    // 3. Link Tags
    if (tagIds.length > 0 && leadRecord) {
      try {
        await supabaseClient.from('lead_tags').delete().eq('lead_id', leadRecord.id)
        await supabaseClient.from('lead_tags').insert(
          tagIds.map((tagId) => ({ lead_id: leadRecord.id, tag_id: tagId }))
        )
      } catch (tagError) {
        console.error('Error setting lead tags:', tagError)
      }
    }

    // 4. Create Activity
    if (leadRecord) {
        try {
        await supabaseClient.from('activities').insert([
            {
            lead_id: leadRecord.id,
            type: 'note',
            content: isNew ? 'Lead criado via Webhook' : 'Lead atualizado via Webhook',
            old_status: null,
            new_status: null,
            },
        ])
        } catch (actError) {
        console.error('Error creating activity:', actError)
        }
    }

    return new Response(
      JSON.stringify({ success: true, leadId: leadRecord?.id, isNew }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error: any) {
    console.error('Error processing webhook:', error)
    return new Response(JSON.stringify({ error: error.message || 'Unknown error' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
