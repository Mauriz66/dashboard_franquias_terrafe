import { useState, useCallback, useEffect } from 'react';
import { Lead, LeadStatus, LeadActivity, LeadTag } from '@/types/lead';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

type LeadRow = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  location: string | null;
  capital: string | null;
  profile: string | null;
  operation: string | null;
  interest: string | null;
  source: string | null;
  status: string | null;
  notes: string | null;
  submitted_at: string | null;
  meeting_date: string | null;
  meeting_time: string | null;
  meeting_link: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type TagRow = {
  id: string;
  name: string;
  color: string;
};

type LeadTagJoinRow = {
  tag?: TagRow | null;
};

type ActivityRow = {
  id: string;
  type: string;
  content: string | null;
  created_at: string | null;
  old_status: string | null;
  new_status: string | null;
};

type LeadWithRelationsRow = LeadRow & {
  lead_tags?: LeadTagJoinRow[] | null;
  activities?: ActivityRow[] | null;
};

const toLead = (row: LeadWithRelationsRow): Lead => {
  const tags: LeadTag[] = (row.lead_tags || [])
    .map((lt) => lt.tag)
    .filter((t): t is TagRow => Boolean(t))
    .map((t) => ({ id: t.id, name: t.name, color: t.color }));

  const activities: LeadActivity[] = (row.activities || []).map((a) => ({
    id: a.id,
    type: a.type as LeadActivity['type'],
    content: a.content || '',
    createdAt: a.created_at || new Date().toISOString(),
    created_at: a.created_at || undefined,
    oldStatus: a.old_status || undefined,
    newStatus: a.new_status || undefined,
  }));

  return {
    id: row.id,
    name: row.name || '',
    email: row.email || '',
    phone: row.phone || '',
    location: row.location || '',
    capital: row.capital || '',
    profile: row.profile || '',
    operation: row.operation || '',
    interest: row.interest || '',
    source: row.source || '',
    status: (row.status || 'novo') as LeadStatus,
    notes: row.notes || '',
    submitted_at: row.submitted_at || undefined,
    meeting: row.meeting_date
      ? { date: row.meeting_date, time: row.meeting_time || '', link: row.meeting_link || undefined }
      : undefined,
    tags,
    activities,
    created_at: row.created_at || undefined,
    updated_at: row.updated_at || undefined,
  };
};

export function useLeads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true);
      const withRelations = await supabase
        .from('leads')
        .select(
          `
          id,
          name,
          email,
          phone,
          location,
          capital,
          profile,
          operation,
          interest,
          source,
          status,
          notes,
          submitted_at,
          meeting_date,
          meeting_time,
          meeting_link,
          created_at,
          updated_at,
          lead_tags:lead_tags(
            tag:tags(
              id,
              name,
              color
            )
          ),
          activities:activities(
            id,
            type,
            content,
            created_at,
            old_status,
            new_status
          )
        `
        );

      let rows: LeadWithRelationsRow[] = [];

      if (withRelations.error) {
        const basic = await supabase.from('leads').select('*');
        if (basic.error) throw basic.error;
        rows = (basic.data || []) as unknown as LeadWithRelationsRow[];
      } else {
        rows = (withRelations.data || []) as unknown as LeadWithRelationsRow[];
      }

      const formattedLeads = rows.map(toLead);

      formattedLeads.sort((a, b) => {
        const dateA = new Date(a.submitted_at || a.created_at || 0).getTime();
        const dateB = new Date(b.submitted_at || b.created_at || 0).getTime();
        return dateB - dateA;
      });

      setLeads(formattedLeads);
    } catch (error) {
      console.error('Error fetching leads:', error);
      toast({ 
        title: 'Erro ao carregar leads', 
        description: 'Verifique a conexão/configuração do Supabase.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const addLead = useCallback(async (leadData: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const { tags, meeting, activities, ...leadFields } = leadData;

      const insertLead = await supabase
        .from('leads')
        .insert([
          {
            name: leadFields.name,
            email: leadFields.email || null,
            phone: leadFields.phone || null,
            location: leadFields.location || null,
            capital: leadFields.capital || null,
            profile: leadFields.profile || null,
            operation: leadFields.operation || null,
            interest: leadFields.interest || null,
            source: leadFields.source || null,
            status: leadFields.status || 'novo',
            notes: leadFields.notes || null,
            submitted_at: leadFields.submitted_at || null,
            meeting_date: meeting?.date || null,
            meeting_time: meeting?.time || null,
            meeting_link: meeting?.link || null,
          },
        ])
        .select('id,name')
        .single();

      if (insertLead.error) throw insertLead.error;

      const newLeadId = insertLead.data.id;

      if (tags && tags.length > 0) {
        try {
          await supabase.from('lead_tags').insert(tags.map((t) => ({ lead_id: newLeadId, tag_id: t.id })));
        } catch (e) {
          console.error('Error attaching tags to lead:', e);
        }
      }

      try {
        await supabase.from('activities').insert([
          { lead_id: newLeadId, type: 'note', content: 'Lead criado', old_status: null, new_status: null },
        ]);
      } catch (e) {
        console.error('Error creating initial activity:', e);
      }

      await fetchLeads();
      toast({ title: 'Lead adicionado', description: insertLead.data.name || '' });
      return insertLead.data; 
    } catch (error) {
      console.error('Error adding lead:', error);
      toast({ 
        title: 'Erro ao adicionar lead', 
        description: 'Tente novamente.',
        variant: 'destructive'
      });
    }
  }, [fetchLeads, toast]);

  const updateLead = useCallback(async (updatedLead: Lead) => {
    try {
      const { tags, meeting, activities, ...leadFields } = updatedLead;

      const update = await supabase
        .from('leads')
        .update({
          name: leadFields.name,
          email: leadFields.email || null,
          phone: leadFields.phone || null,
          location: leadFields.location || null,
          capital: leadFields.capital || null,
          profile: leadFields.profile || null,
          operation: leadFields.operation || null,
          interest: leadFields.interest || null,
          source: leadFields.source || null,
          status: leadFields.status || null,
          notes: leadFields.notes || null,
          submitted_at: leadFields.submitted_at || null,
          meeting_date: meeting?.date || null,
          meeting_time: meeting?.time || null,
          meeting_link: meeting?.link || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', updatedLead.id);

      if (update.error) throw update.error;

      try {
        await supabase.from('lead_tags').delete().eq('lead_id', updatedLead.id);
        if (tags && tags.length > 0) {
          await supabase.from('lead_tags').insert(tags.map((t) => ({ lead_id: updatedLead.id, tag_id: t.id })));
        }
      } catch (e) {
        console.error('Error updating lead tags:', e);
      }

      await fetchLeads();
      toast({ title: 'Lead atualizado', description: updatedLead.name });
    } catch (error) {
      console.error('Error updating lead:', error);
      toast({ 
        title: 'Erro ao atualizar lead', 
        variant: 'destructive' 
      });
    }
  }, [fetchLeads, toast]);

  const deleteLead = useCallback(async (leadId: string) => {
    try {
      const del = await supabase.from('leads').delete().eq('id', leadId);
      if (del.error) throw del.error;
      setLeads((prev) => prev.filter((l) => l.id !== leadId));
      toast({ title: 'Lead excluído' });
    } catch (error) {
      console.error('Error deleting lead:', error);
      toast({ 
        title: 'Erro ao excluir lead', 
        variant: 'destructive' 
      });
    }
  }, [toast]);

  const restoreLead = useCallback(async (lead: Lead) => {
      const { id, ...rest } = lead;
      await addLead(rest);
      toast({ title: 'Lead restaurado' });
  }, [addLead, toast]);

  const duplicateLead = useCallback(async (leadId: string) => {
    const lead = leads.find((l) => l.id === leadId);
    if (lead) {
      const { id, createdAt, updatedAt, created_at, updated_at, activities, ...rest } = lead;
      await addLead({
        ...rest,
        name: `${lead.name} (cópia)`,
        status: 'novo'
      });
      toast({ title: 'Lead duplicado' });
    }
  }, [leads, addLead, toast]);

  return {
    leads,
    loading,
    addLead,
    updateLead,
    deleteLead,
    restoreLead,
    duplicateLead,
    refreshLeads: fetchLeads
  };
}
