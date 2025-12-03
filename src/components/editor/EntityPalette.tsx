import React from 'react';
import {
  User,
  Bug,
  Bird,
  Coins,
  DoorClosed,
  ToggleLeft,
  Sparkles,
  Square,
} from 'lucide-react';
import { EntityType, ENTITY_PALETTE } from '@/types/editor';
import { cn } from '@/lib/utils';

interface EntityPaletteProps {
  selectedEntity: EntityType | null;
  onSelectEntity: (entity: EntityType) => void;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  User,
  Bug,
  Bird,
  Coins,
  DoorClosed,
  ToggleLeft,
  Sparkles,
  Square,
};

export const EntityPalette: React.FC<EntityPaletteProps> = ({
  selectedEntity,
  onSelectEntity,
}) => {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Entities</h3>
      <div className="grid grid-cols-4 gap-2">
        {ENTITY_PALETTE.map((entity) => {
          const Icon = iconMap[entity.icon] || Square;
          return (
            <button
              key={entity.type}
              onClick={() => onSelectEntity(entity.type)}
              className={cn(
                'tool-tile',
                selectedEntity === entity.type && 'tool-tile-active'
              )}
              title={entity.name}
              style={{ 
                '--entity-color': entity.color 
              } as React.CSSProperties}
            >
              <Icon 
                className="w-5 h-5" 
                style={{ color: entity.color }}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
};
