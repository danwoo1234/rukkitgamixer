import React from 'react';
import { EditorTool, TileType, EntityType, TILE_PALETTE, ENTITY_PALETTE, TileInfo } from '@/types/editor';
import { cn } from '@/lib/utils';
import {
  Brush, Eraser, PaintBucket, MousePointer, Move,
  User, Bug, Bird, Coins, DoorClosed, ToggleLeft, Sparkles, Square,
  Skull, Ghost, Gem, Key, Heart, Minus, ArrowUp, Flag, Target,
} from 'lucide-react';

interface BuildPaletteProps {
  selectedTool: EditorTool;
  selectedTile: TileType;
  selectedEntity: EntityType | null;
  onSelectTool: (tool: EditorTool) => void;
  onSelectTile: (tile: TileType) => void;
  onSelectEntity: (entity: EntityType) => void;
}

const tools = [
  { type: EditorTool.Brush, icon: Brush, label: 'Brush' },
  { type: EditorTool.Eraser, icon: Eraser, label: 'Eraser' },
  { type: EditorTool.Fill, icon: PaintBucket, label: 'Fill' },
  { type: EditorTool.Select, icon: MousePointer, label: 'Select' },
  { type: EditorTool.Pan, icon: Move, label: 'Pan' },
];

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  User, Bug, Bird, Coins, DoorClosed, ToggleLeft, Sparkles, Square,
  Skull, Ghost, Gem, Key, Heart, Minus, ArrowUp, Flag, Target,
};

const TilePreview: React.FC<{ tile: TileInfo }> = ({ tile }) => {
  const colors: Record<TileType, string> = {
    [TileType.Empty]: 'bg-transparent',
    [TileType.Ground]: 'bg-gradient-to-b from-amber-600 to-amber-800',
    [TileType.Wall]: 'bg-gray-600',
    [TileType.Water]: 'bg-gradient-to-b from-sky-400 to-sky-600',
    [TileType.Spike]: 'bg-slate-500',
    [TileType.Lava]: 'bg-gradient-to-b from-orange-400 to-red-600',
    [TileType.Ice]: 'bg-gradient-to-b from-cyan-200 to-cyan-400',
    [TileType.Sand]: 'bg-gradient-to-b from-yellow-300 to-amber-500',
    [TileType.Grass]: 'bg-gradient-to-b from-green-400 to-green-600',
    [TileType.Stone]: 'bg-gradient-to-b from-gray-400 to-gray-600',
    [TileType.Wood]: 'bg-gradient-to-b from-amber-600 to-amber-900',
    [TileType.Metal]: 'bg-gradient-to-b from-gray-300 to-gray-500',
  };
  return <div className={cn('w-full h-full rounded-sm', colors[tile.type])} />;
};

export const BuildPalette: React.FC<BuildPaletteProps> = ({
  selectedTool,
  selectedTile,
  selectedEntity,
  onSelectTool,
  onSelectTile,
  onSelectEntity,
}) => {
  return (
    <div className="space-y-3">
      {/* Tools - horizontal row */}
      <div>
        <h4 className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-1.5">Tools</h4>
        <div className="flex gap-1">
          {tools.map(({ type, icon: Icon, label }) => (
            <button
              key={type}
              onClick={() => onSelectTool(type)}
              title={label}
              className={cn(
                'w-7 h-7 flex items-center justify-center rounded transition-colors',
                'bg-surface-2 hover:bg-surface-3',
                selectedTool === type && 'bg-primary text-primary-foreground'
              )}
            >
              <Icon className="w-3.5 h-3.5" />
            </button>
          ))}
        </div>
      </div>

      {/* Tiles - compact grid */}
      <div>
        <h4 className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-1.5">Tiles</h4>
        <div className="grid grid-cols-6 gap-1">
          {TILE_PALETTE.map((tile) => (
            <button
              key={tile.type}
              onClick={() => onSelectTile(tile.type)}
              title={tile.name}
              className={cn(
                'w-7 h-7 rounded border-2 transition-all',
                'hover:scale-110 hover:z-10',
                selectedTile === tile.type 
                  ? 'border-primary shadow-lg' 
                  : 'border-transparent'
              )}
            >
              <TilePreview tile={tile} />
            </button>
          ))}
        </div>
      </div>

      {/* Entities - compact grid */}
      <div>
        <h4 className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-1.5">Entities</h4>
        <div className="grid grid-cols-6 gap-1">
          {ENTITY_PALETTE.map((entity) => {
            const Icon = iconMap[entity.icon] || Square;
            return (
              <button
                key={entity.type}
                onClick={() => onSelectEntity(entity.type)}
                title={entity.name}
                className={cn(
                  'w-7 h-7 rounded border-2 flex items-center justify-center transition-all',
                  'bg-surface-2 hover:bg-surface-3 hover:scale-110 hover:z-10',
                  selectedEntity === entity.type 
                    ? 'border-primary shadow-lg' 
                    : 'border-transparent'
                )}
              >
                <Icon className="w-3.5 h-3.5" style={{ color: entity.color }} />
              </button>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="border-t border-surface-2 pt-2">
        <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[9px] text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-gradient-to-b from-amber-600 to-amber-800 rounded-sm" />
            Ground
          </div>
          <div className="flex items-center gap-1">
            <User className="w-2 h-2 text-blue-400" />
            Player
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-gradient-to-b from-orange-400 to-red-600 rounded-sm" />
            Lava
          </div>
          <div className="flex items-center gap-1">
            <Bug className="w-2 h-2 text-green-500" />
            Slime
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-gradient-to-b from-cyan-200 to-cyan-400 rounded-sm" />
            Ice
          </div>
          <div className="flex items-center gap-1">
            <Sparkles className="w-2 h-2 text-purple-400" />
            Portal
          </div>
        </div>
      </div>
    </div>
  );
};
