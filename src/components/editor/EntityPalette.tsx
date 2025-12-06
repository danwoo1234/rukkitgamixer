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
  Skull,
  Ghost,
  Gem,
  Key,
  Heart,
  Minus,
  ArrowUp,
  Flag,
  Target,
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
  Skull,
  Ghost,
  Gem,
  Key,
  Heart,
  Minus,
  ArrowUp,
  Flag,
  Target,
};

// Group entities by category
const entityCategories = [
  { 
    name: 'Spawn Points', 
    types: [EntityType.Player, EntityType.Start, EntityType.End, EntityType.Checkpoint] 
  },
  { 
    name: 'Enemies', 
    types: [EntityType.Slime, EntityType.Bat, EntityType.Skeleton, EntityType.Ghost, EntityType.Spider] 
  },
  { 
    name: 'Items', 
    types: [EntityType.Coin, EntityType.Gem, EntityType.Key, EntityType.Heart] 
  },
  { 
    name: 'Interactive', 
    types: [EntityType.Door, EntityType.Lever, EntityType.Portal, EntityType.WallBlock, EntityType.MovingPlatform, EntityType.Trampoline] 
  },
];

export const EntityPalette: React.FC<EntityPaletteProps> = ({
  selectedEntity,
  onSelectEntity,
}) => {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Entities</h3>
      
      {entityCategories.map((category) => {
        const categoryEntities = ENTITY_PALETTE.filter(e => category.types.includes(e.type));
        if (categoryEntities.length === 0) return null;
        
        return (
          <div key={category.name} className="space-y-2">
            <h4 className="text-xs text-muted-foreground/70">{category.name}</h4>
            <div className="grid grid-cols-3 gap-2">
              {categoryEntities.map((entity) => {
                const Icon = iconMap[entity.icon] || Square;
                return (
                  <button
                    key={entity.type}
                    onClick={() => onSelectEntity(entity.type)}
                    className="flex flex-col items-center gap-1 group"
                  >
                    <div
                      className={cn(
                        'tool-tile',
                        selectedEntity === entity.type && 'tool-tile-active'
                      )}
                    >
                      <Icon 
                        className="w-5 h-5" 
                        style={{ color: entity.color }}
                      />
                    </div>
                    <span className={cn(
                      "text-[10px] text-muted-foreground group-hover:text-foreground transition-colors truncate w-full text-center",
                      selectedEntity === entity.type && "text-primary font-medium"
                    )}>
                      {entity.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};