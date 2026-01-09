import { useState, useCallback, useEffect } from 'react';
import { Lead, LeadStatus, LeadActivity, LeadTag } from '@/types/lead';
import { useToast } from '@/hooks/use-toast';
import { pb } from '@/lib/pocketbase';

export function useLeads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true);
      const records = await pb.collection('leads').getFullList({
        sort: '-created',
        expand: 'tags,activities_via_lead', 
      });

      const formattedLeads: Lead[] = records.map((record: any) => {
        const expandedTags = record.expand?.tags || [];
        const expandedActivities = record.expand?.activities_via_lead || [];

        return {
          id: record.id,
          name: record.name,
          email: record.email,
          phone: record.phone,
          location: record.location,
          capital: record.capital,
          profile: record.profile,
          operation: record.operation,
          interest: record.interest,
          source: record.source,
          status: record.status,
          notes: record.notes,
          meeting: record.meeting_date ? {
            date: record.meeting_date,
            time: record.meeting_time,
            link: record.meeting_link
          } : undefined,
          tags: expandedTags.map((t: any) => ({
            id: t.id,
            name: t.name,
            color: t.color
          })),
          activities: expandedActivities.map((a: any) => ({
            id: a.id,
            type: a.type,
            content: a.content,
            createdAt: a.created,
            oldStatus: a.old_status,
            newStatus: a.new_status
          })),
          created_at: record.created,
          updated_at: record.updated,
        };
      });

      setLeads(formattedLeads);
    } catch (error) {
      console.error('Error fetching leads:', error);
      toast({ 
        title: 'Erro ao carregar leads', 
        description: 'Verifique sua conexão com o PocketBase.',
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
      
      const pbLeadData = {
        ...leadFields,
        meeting_date: meeting?.date,
        meeting_time: meeting?.time,
        meeting_link: meeting?.link,
        tags: tags?.map(t => t.id) || [],
        status: leadFields.status || 'novo'
      };

      const newLeadRecord = await pb.collection('leads').create(pbLeadData);

      try {
        await pb.collection('activities').create({
            lead: newLeadRecord.id,
            type: 'note',
            content: 'Lead criado'
        });
      } catch (e) {
        console.error("Failed to create initial activity", e);
      }

      await fetchLeads();
      toast({ title: 'Lead adicionado', description: newLeadRecord.name });
      return newLeadRecord; 
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

      const pbUpdateData = {
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
        tags: tags?.map(t => t.id) || [],
      };

      await pb.collection('leads').update(updatedLead.id, pbUpdateData);

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
      await pb.collection('leads').delete(leadId);
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
