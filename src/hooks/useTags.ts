import { useState, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { LeadTag } from '@/types/lead';
import { supabase } from '@/lib/supabase';

export function useTags() {
  const [tags, setTags] = useState<LeadTag[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchTags = useCallback(async () => {
    try {
      setLoading(true);
      const res = await supabase.from('tags').select('id,name,color').order('name', { ascending: true });
      if (res.error) throw res.error;
      setTags((res.data || []).map((r) => ({ id: r.id, name: r.name, color: r.color })));
    } catch (error) {
      console.error('Error fetching tags:', error);
      toast({ 
        title: 'Erro ao carregar tags', 
        description: 'Verifique a conexão/configuração do Supabase.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  const addTag = useCallback(async (tag: Omit<LeadTag, 'id'>) => {
    try {
      const res = await supabase.from('tags').insert([{ name: tag.name, color: tag.color }]).select('id,name,color').single();
      if (res.error) throw res.error;
      const newTag = { id: res.data.id, name: res.data.name, color: res.data.color };
      setTags(prev => [...prev, newTag]);
      toast({ title: 'Tag criada com sucesso' });
      return newTag;
    } catch (error) {
      console.error('Error adding tag:', error);
      toast({ 
        title: 'Erro ao criar tag', 
        description: 'Tente novamente.',
        variant: 'destructive'
      });
      return null;
    }
  }, [toast]);

  const updateTag = useCallback(async (tag: LeadTag) => {
    try {
      const res = await supabase.from('tags').update({ name: tag.name, color: tag.color }).eq('id', tag.id);
      if (res.error) throw res.error;

      setTags(prev => prev.map(t => t.id === tag.id ? tag : t));
      toast({ title: 'Tag atualizada' });
      return true;
    } catch (error) {
      console.error('Error updating tag:', error);
      toast({ 
        title: 'Erro ao atualizar tag', 
        variant: 'destructive'
      });
      return false;
    }
  }, [toast]);

  const deleteTag = useCallback(async (tagId: string) => {
    try {
      const res = await supabase.from('tags').delete().eq('id', tagId);
      if (res.error) throw res.error;
      setTags(prev => prev.filter(t => t.id !== tagId));
      toast({ title: 'Tag excluída' });
      return true;
    } catch (error) {
      console.error('Error deleting tag:', error);
      toast({ 
        title: 'Erro ao excluir tag', 
        description: 'Verifique se a tag está em uso.',
        variant: 'destructive' 
      });
      return false;
    }
  }, [toast]);

  return {
    tags,
    loading,
    addTag,
    updateTag,
    deleteTag,
    refreshTags: fetchTags
  };
}
