import React from 'react';
import { Eye, EyeOff, Lock, Unlock, GripVertical } from 'lucide-react';
import { Layer } from '@/types/editor';
import { cn } from '@/lib/utils';

interface LayerPanelProps {
  layers: Layer[];
  activeLayerId: string;
  onSelectLayer: (layerId: string) => void;
  onToggleVisibility: (layerId: string) => void;
  onToggleLock: (layerId: string) => void;
  onReorderLayers: (startIndex: number, endIndex: number) => void;
}

export const LayerPanel: React.FC<LayerPanelProps> = ({
  layers,
  activeLayerId,
  onSelectLayer,
  onToggleVisibility,
  onToggleLock,
  onReorderLayers,
}) => {
  const [draggedIndex, setDraggedIndex] = React.useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = React.useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDragEnd = () => {
    if (draggedIndex !== null && dragOverIndex !== null && draggedIndex !== dragOverIndex) {
      onReorderLayers(draggedIndex, dragOverIndex);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // Reverse layers for display (top layer first)
  const displayLayers = [...layers].reverse();

  return (
    <div className="space-y-2">
      {displayLayers.map((layer, displayIndex) => {
        const actualIndex = layers.length - 1 - displayIndex;
        const isActive = layer.id === activeLayerId;
        const isDragging = draggedIndex === actualIndex;
        const isDragOver = dragOverIndex === actualIndex;

        return (
          <div
            key={layer.id}
            draggable
            onDragStart={(e) => handleDragStart(e, actualIndex)}
            onDragOver={(e) => handleDragOver(e, actualIndex)}
            onDragEnd={handleDragEnd}
            onClick={() => onSelectLayer(layer.id)}
            className={cn(
              'rukkit-layer group',
              isActive && 'rukkit-layer-active',
              isDragging && 'opacity-50',
              isDragOver && 'border-t-2 border-primary'
            )}
          >
            <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab opacity-0 group-hover:opacity-100 transition-opacity" />
            
            <div className="flex-1 truncate">
              <span className={cn(
                'text-sm',
                isActive ? 'text-foreground font-medium' : 'text-muted-foreground'
              )}>
                {layer.name}
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleVisibility(layer.id);
                }}
                className="p-1 rounded hover:bg-surface-3 transition-colors"
                title={layer.visible ? 'Hide layer' : 'Show layer'}
              >
                {layer.visible ? (
                  <Eye className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <EyeOff className="w-4 h-4 text-muted-foreground/50" />
                )}
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleLock(layer.id);
                }}
                className="p-1 rounded hover:bg-surface-3 transition-colors"
                title={layer.locked ? 'Unlock layer' : 'Lock layer'}
              >
                {layer.locked ? (
                  <Lock className="w-4 h-4 text-amber" />
                ) : (
                  <Unlock className="w-4 h-4 text-muted-foreground" />
                )}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
