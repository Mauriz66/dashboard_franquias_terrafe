import { useState, useCallback, useEffect } from 'react';
import { pb } from '@/lib/pocketbase';
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

  const fetchPipeline = useCallback(async () => {
    try {
      setLoading(true);
      const records = await pb.collection('pipeline_stages').getFullList({
        sort: 'order_index',
      });

      if (records && records.length > 0) {
        setColumns(records.map((stage: any) => ({
          id: stage.slug || stage.id, // Usa o slug (ex: 'novo') se existir, senão o ID gerado
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
  }, []);

  return {
    columns,
    loading,
    refreshPipeline: fetchPipeline
  };
}
