import { useState } from 'react';
import { Plus, Pencil, Trash2, Check, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Lead, LeadTag } from '@/types/lead';
import { useTags } from '@/hooks/useTags';

const colorOptions = [
  { name: 'Vermelho', class: 'bg-red-500' },
  { name: 'Laranja', class: 'bg-orange-500' },
  { name: 'Âmbar', class: 'bg-amber-500' },
  { name: 'Verde', class: 'bg-emerald-500' },
  { name: 'Azul', class: 'bg-blue-500' },
  { name: 'Roxo', class: 'bg-purple-500' },
  { name: 'Rosa', class: 'bg-pink-500' },
  { name: 'Ciano', class: 'bg-cyan-500' },
];

interface TagsViewProps {
  leads?: Lead[];
}

export function TagsView({ leads = [] }: TagsViewProps) {
  const { tags, loading, addTag, updateTag, deleteTag } = useTags();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('bg-blue-500');
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');

  const getTagUsageCount = (tagId: string) => {
    return leads.filter(lead => 
      lead.tags.some(tag => tag.id === tagId)
    ).length;
  };

  const handleAddTag = async () => {
    if (!newTagName.trim()) return;
    
    await addTag({
      name: newTagName.trim(),
      color: newTagColor,
    });
    
    setNewTagName('');
    setNewTagColor('bg-blue-500');
    setIsAdding(false);
  };

  const handleEditTag = (tag: LeadTag) => {
    setEditingId(tag.id);
    setEditName(tag.name);
    setEditColor(tag.color);
  };

  const handleSaveEdit = async (id: string) => {
    await updateTag({
      id,
      name: editName,
      color: editColor,
    });
    setEditingId(null);
  };

  const handleDeleteTag = async (id: string) => {
    await deleteTag(id);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-display font-bold">Etiquetas</h2>
          <p className="text-sm text-muted-foreground">
            Gerencie as etiquetas para categorizar seus leads
          </p>
        </div>
        <Button onClick={() => setIsAdding(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Nova Etiqueta
        </Button>
      </div>

      {/* Add New Tag Form */}
      {isAdding && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-end gap-4">
              <div className="flex-1 min-w-[200px] space-y-2">
                <label className="text-sm font-medium">Nome da Etiqueta</label>
                <Input
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  placeholder="Ex: VIP, Urgente, Follow-up..."
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Cor</label>
                <div className="flex gap-2">
                  {colorOptions.map((color) => (
                    <button
                      key={color.class}
                      onClick={() => setNewTagColor(color.class)}
                      className={cn(
                        'h-8 w-8 rounded-full transition-all',
                        color.class,
                        newTagColor === color.class && 'ring-2 ring-offset-2 ring-primary'
                      )}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleAddTag} size="sm" className="gap-1">
                  <Check className="h-4 w-4" />
                  Salvar
                </Button>
                <Button
                  onClick={() => {
                    setIsAdding(false);
                    setNewTagName('');
                  }}
                  size="sm"
                  variant="outline"
                  className="gap-1"
                >
                  <X className="h-4 w-4" />
                  Cancelar
                </Button>
              </div>
            </div>
            <div className="mt-3">
              <span className="text-sm text-muted-foreground">Preview: </span>
              <Badge className={cn('text-white border-0 ml-2', newTagColor)}>
                {newTagName || 'Nome da etiqueta'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tags List */}
      <div className="grid gap-4">
        {tags.map((tag) => (
          <Card key={tag.id}>
            <CardContent className="p-4">
              {editingId === tag.id ? (
                <div className="flex flex-wrap items-end gap-4">
                  <div className="flex-1 min-w-[200px] space-y-2">
                    <label className="text-sm font-medium">Nome</label>
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      autoFocus
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Cor</label>
                    <div className="flex gap-2">
                      {colorOptions.map((color) => (
                        <button
                          key={color.class}
                          onClick={() => setEditColor(color.class)}
                          className={cn(
                            'h-8 w-8 rounded-full transition-all',
                            color.class,
                            editColor === color.class && 'ring-2 ring-offset-2 ring-primary'
                          )}
                          title={color.name}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => handleSaveEdit(tag.id)} size="sm" className="gap-1">
                      <Check className="h-4 w-4" />
                      Salvar
                    </Button>
                    <Button
                      onClick={() => setEditingId(null)}
                      size="sm"
                      variant="outline"
                      className="gap-1"
                    >
                      <X className="h-4 w-4" />
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Badge className={cn('text-white border-0 text-sm px-3 py-1', tag.color)}>
                      {tag.name}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {getTagUsageCount(tag.id)} lead(s) usando esta etiqueta
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEditTag(tag)}
                      className="h-8 w-8"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteTag(tag.id)}
                      className="h-8 w-8 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {tags.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">
              Nenhuma etiqueta criada ainda. Clique em "Nova Etiqueta" para começar.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
