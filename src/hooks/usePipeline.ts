import { useState, useCallback, useEffect } from 'react';
import { KanbanColumn } from '@/types/lead';
import { kanbanColumns as defaultColumns } from '@/data/config';
import { supabase } from '@/lib/supabase';

export interface PipelineStage {
  id: string;
  title: string;
  color: string;
  order_index: number;
}

type PipelineStageRow = {
  id: string;
  slug: string | null;
  title: string;
  color: string;
  order_index: number | null;
};

export function usePipeline() {
  const [columns, setColumns] = useState<Omit<KanbanColumn, 'leads'>[]>(defaultColumns);
  const [loading, setLoading] = useState(true);

  const fetchPipeline = useCallback(async () => {
    try {
      setLoading(true);
      const res = await supabase
        .from('pipeline_stages')
        .select('id,slug,title,color,order_index')
        .order('order_index', { ascending: true, nullsFirst: false });

      if (res.error) {
        setColumns(defaultColumns);
        return;
      }

      const records = (res.data || []) as PipelineStageRow[];
      if (records.length > 0) {
        setColumns(
          records.map((stage) => ({
            id: stage.slug || stage.id,
            title: stage.title,
            color: stage.color,
          }))
        );
      } else {
        setColumns(defaultColumns);
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
  }, []);

  return {
    columns,
    loading,
    refreshPipeline: fetchPipeline
  };
}
