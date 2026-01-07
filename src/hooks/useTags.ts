import { useState, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { LeadTag } from '@/types/lead';

export function useTags() {
  const [tags, setTags] = useState<LeadTag[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchTags = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .order('name');

      if (error) throw error;

      setTags(data || []);
    } catch (error) {
      console.error('Error fetching tags:', error);
      toast({ 
        title: 'Erro ao carregar tags', 
        description: 'Verifique sua conexão.',
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
      const { data, error } = await supabase
        .from('tags')
        .insert(tag)
        .select()
        .single();

      if (error) throw error;

      setTags(prev => [...prev, data]);
      toast({ title: 'Tag criada com sucesso' });
      return data;
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
      const { error } = await supabase
        .from('tags')
        .update({ name: tag.name, color: tag.color })
        .eq('id', tag.id);

      if (error) throw error;

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
      // Note: This might fail if there are foreign key constraints without cascade delete
      // Usually, you'd want to handle cleanup in lead_tags first or rely on DB cascade
      const { error } = await supabase
        .from('tags')
        .delete()
        .eq('id', tagId);

      if (error) throw error;

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
