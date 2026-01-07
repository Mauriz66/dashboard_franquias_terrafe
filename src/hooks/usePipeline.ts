import { useState, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { KanbanColumn } from '@/types/lead';
import { kanbanColumns as defaultColumns } from '@/data/config';

export interface PipelineStage {
  id: string;
  title: string;
  color: string;
  order_index: number;
}

export function usePipeline() {
  const [columns, setColumns] = useState<Omit<KanbanColumn, 'leads'>[]>(defaultColumns);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchPipeline = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('pipeline_stages')
        .select('*')
        .order('order_index');

      if (error) {
        // Se a tabela não existir, usamos o fallback silenciosamente
        // ou logamos apenas no console para debug
        console.warn('Pipeline table check:', error.message);
        return; 
      }

      if (data && data.length > 0) {
        setColumns(data.map(stage => ({
          id: stage.id,
          title: stage.title,
          color: stage.color
        })));
      }
    } catch (error) {
      console.error('Error fetching pipeline:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPipeline();
  }, [fetchPipeline]);

  const updateStageOrder = useCallback(async (newOrder: PipelineStage[]) => {
    // Implementação futura para reordenar estágios
    // Requereria updates em lote no supabase
  }, []);

  return {
    columns,
    loading,
    refreshPipeline: fetchPipeline
  };
}
