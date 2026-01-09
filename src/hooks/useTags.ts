import { useState, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { pb } from '@/lib/pocketbase';
import { LeadTag } from '@/types/lead';

type PbTag = {
  id: string;
  name: string;
  color?: string;
};

export function useTags() {
  const [tags, setTags] = useState<LeadTag[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchTags = useCallback(async () => {
    try {
      setLoading(true);
      const records = await pb.collection('tags').getFullList<PbTag>({
        sort: 'name',
      });

      setTags(records.map((r) => ({
        id: r.id,
        name: r.name,
        color: r.color,
      })));
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
      const record = await pb.collection('tags').create(tag);
      const newTag = { id: record.id, name: record.name, color: record.color };
      
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
      await pb.collection('tags').update(tag.id, {
        name: tag.name,
        color: tag.color
      });

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
      await pb.collection('tags').delete(tagId);
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
