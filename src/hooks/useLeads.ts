import { useState, useCallback, useMemo, useEffect } from 'react';
import { Lead, LeadStatus, LeadActivity, LeadTag } from '@/types/lead';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

export function useLeads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('leads')
        .select(`
          *,
          lead_tags (
            tags (*)
          ),
          activities (*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedLeads: Lead[] = (data || []).map((item: any) => ({
        ...item,
        tags: item.lead_tags?.map((lt: any) => lt.tags) || [],
        meeting: item.meeting_date ? {
          date: item.meeting_date,
          time: item.meeting_time,
          link: item.meeting_link
        } : undefined,
        activities: item.activities || []
      }));

      setLeads(formattedLeads);
    } catch (error) {
      console.error('Error fetching leads:', error);
      toast({ 
        title: 'Erro ao carregar leads', 
        description: 'Verifique sua conexão com o Supabase.',
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
      
      // 1. Insert Lead
      const { data: newLead, error: leadError } = await supabase
        .from('leads')
        .insert({
          ...leadFields,
          meeting_date: meeting?.date,
          meeting_time: meeting?.time,
          meeting_link: meeting?.link,
        })
        .select()
        .single();

      if (leadError) throw leadError;

      // 2. Insert Tags Relations
      if (tags && tags.length > 0) {
        const tagRelations = tags.map(tag => ({
          lead_id: newLead.id,
          tag_id: tag.id
        }));
        const { error: tagError } = await supabase
          .from('lead_tags')
          .insert(tagRelations);
          
        if (tagError) throw tagError;
      }

      // 3. Insert Initial Activity
      const { error: activityError } = await supabase
        .from('activities')
        .insert({
          lead_id: newLead.id,
          type: 'note',
          content: 'Lead criado'
        });

      if (activityError) throw activityError;

      await fetchLeads(); // Refresh data
      toast({ title: 'Lead adicionado', description: newLead.name });
      return newLead;
    } catch (error) {
      console.error('Error adding lead:', error);
      toast({ 
        title: 'Erro ao adicionar lead', 
        description: 'Tente novamente mais tarde.',
        variant: 'destructive'
      });
    }
  }, [fetchLeads, toast]);

  const updateLead = useCallback(async (updatedLead: Lead) => {
    try {
      const { tags, meeting, activities, lead_tags, ...leadFields } = updatedLead as any;

      // 1. Update Lead Fields
      const { error: leadError } = await supabase
        .from('leads')
        .update({
          name: leadFields.name,
          email: leadFields.email,
          phone: leadFields.phone,
          location: leadFields.location,
          capital: leadFields.capital,
          profile: leadFields.profile,
          operation: leadFields.operation,
          interest: leadFields.interest,
          source: leadFields.source,
          status: leadFields.status,
          notes: leadFields.notes,
          meeting_date: meeting?.date,
          meeting_time: meeting?.time,
          meeting_link: meeting?.link,
          updated_at: new Date().toISOString()
        })
        .eq('id', updatedLead.id);

      if (leadError) throw leadError;

      // 2. Sync Tags (Delete all and re-insert for simplicity)
      // First delete existing relations
      await supabase.from('lead_tags').delete().eq('lead_id', updatedLead.id);
      
      // Then insert new ones
      if (tags && tags.length > 0) {
        const tagRelations = tags.map((tag: LeadTag) => ({
          lead_id: updatedLead.id,
          tag_id: tag.id
        }));
        await supabase.from('lead_tags').insert(tagRelations);
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
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', leadId);

      if (error) throw error;

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
    // Implement restore logic if needed (usually requires soft delete in DB)
    // For now, we'll just re-add it
    await addLead(lead);
    toast({ title: 'Lead restaurado' });
  }, [addLead, toast]);

  const duplicateLead = useCallback(async (leadId: string) => {
    const lead = leads.find((l) => l.id === leadId);
    if (lead) {
      const { id, createdAt, updatedAt, ...rest } = lead;
      await addLead({
        ...rest,
        name: `${lead.name} (cópia)`,
        status: 'novo'
      });
      toast({ title: 'Lead duplicado' });
    }
  }, [leads, addLead, toast]);

  const updateLeadStatus = useCallback(async (leadId: string, newStatus: LeadStatus) => {
    const lead = leads.find(l => l.id === leadId);
    if (!lead) return;
    
    const oldStatus = lead.status;
    if (oldStatus === newStatus) return;

    // Optimistic Update
    setLeads(currentLeads => 
      currentLeads.map(l => 
        l.id === leadId 
          ? { ...l, status: newStatus, updated_at: new Date().toISOString() } 
          : l
      )
    );

    try {
      const { error: leadError } = await supabase
        .from('leads')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', leadId);

      if (leadError) throw leadError;

      // Add status change activity
      await supabase.from('activities').insert({
        lead_id: leadId,
        type: 'status_change',
        content: 'Status alterado',
        old_status: oldStatus,
        new_status: newStatus
      });

      // No need to fetchLeads() as we already updated the state
    } catch (error) {
      console.error('Error updating status:', error);
      toast({ title: 'Erro ao atualizar status', variant: 'destructive' });
      
      // Rollback
      setLeads(currentLeads => 
        currentLeads.map(l => 
          l.id === leadId 
            ? { ...l, status: oldStatus, updated_at: lead.updated_at } 
            : l
        )
      );
    }
  }, [leads, toast]);

  const addNote = useCallback(async (leadId: string, content: string) => {
    try {
      const { error } = await supabase
        .from('activities')
        .insert({
          lead_id: leadId,
          type: 'note',
          content
        });

      if (error) throw error;

      await supabase
        .from('leads')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', leadId);

      await fetchLeads();
      toast({ title: 'Nota adicionada' });
    } catch (error) {
      console.error('Error adding note:', error);
      toast({ title: 'Erro ao adicionar nota', variant: 'destructive' });
    }
  }, [fetchLeads, toast]);

  const stats = useMemo(() => {
    const total = leads.length;
    const byStatus = {
      novo: leads.filter((l) => l.status === 'novo').length,
      contato: leads.filter((l) => l.status === 'contato').length,
      qualificado: leads.filter((l) => l.status === 'qualificado').length,
      proposta: leads.filter((l) => l.status === 'proposta').length,
      negociacao: leads.filter((l) => l.status === 'negociacao').length,
      ganho: leads.filter((l) => l.status === 'ganho').length,
      perdido: leads.filter((l) => l.status === 'perdido').length,
    };
    const conversionRate = total > 0 ? Math.round((byStatus.ganho / total) * 100) : 0;
    
    const avgTimePerStage = {
      novo: '2 dias',
      contato: '3 dias',
      qualificado: '5 dias',
      proposta: '4 dias',
      negociacao: '7 dias',
    };

    return { total, byStatus, conversionRate, avgTimePerStage };
  }, [leads]);

  return {
    leads,
    setLeads,
    loading,
    addLead,
    updateLead,
    deleteLead,
    restoreLead,
    duplicateLead,
    updateLeadStatus,
    addNote,
    stats,
  };
}
