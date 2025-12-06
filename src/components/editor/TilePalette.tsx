import React from 'react';
import { TileType, TILE_PALETTE, TileInfo } from '@/types/editor';
import { cn } from '@/lib/utils';

interface TilePaletteProps {
  selectedTile: TileType;
  onSelectTile: (tile: TileType) => void;
}

const TilePreview: React.FC<{ tile: TileInfo; isSelected: boolean }> = ({ tile, isSelected }) => {
  const renderTilePreview = () => {
    switch (tile.type) {
      case TileType.Ground:
        return (
          <div className="w-full h-full rounded-sm" style={{ background: 'linear-gradient(180deg, #A8896A 0%, #8B7355 50%, #6B5744 100%)' }}>
            <div className="w-full h-1" style={{ background: '#4A3728' }} />
          </div>
        );
      case TileType.Wall:
        return (
          <div className="w-full h-full rounded-sm grid grid-cols-2 grid-rows-2 gap-px" style={{ background: '#374151' }}>
            <div style={{ background: '#4B5563' }} />
            <div style={{ background: '#4B5563' }} />
            <div style={{ background: '#4B5563' }} />
            <div style={{ background: '#4B5563' }} />
          </div>
        );
      case TileType.Water:
        return (
          <div className="w-full h-full rounded-sm" style={{ background: 'linear-gradient(180deg, #38BDF8 0%, #0EA5E9 50%, #0284C7 100%)' }}>
            <div className="w-full h-2 opacity-50" style={{ background: 'linear-gradient(90deg, transparent, white, transparent)' }} />
          </div>
        );
      case TileType.Spike:
        return (
          <div className="w-full h-full flex items-end justify-center" style={{ background: '#374151' }}>
            <div className="w-0 h-0" style={{ 
              borderLeft: '8px solid transparent',
              borderRight: '8px solid transparent',
              borderBottom: '16px solid #94A3B8'
            }} />
          </div>
        );
      case TileType.Lava:
        return (
          <div className="w-full h-full rounded-sm animate-pulse" style={{ background: 'linear-gradient(180deg, #FCD34D 0%, #F97316 30%, #DC2626 100%)' }}>
            <div className="w-full h-1" style={{ background: '#FDE047' }} />
          </div>
        );
      case TileType.Ice:
        return (
          <div className="w-full h-full rounded-sm" style={{ background: 'linear-gradient(180deg, #E0F2FE 0%, #67E8F9 50%, #22D3EE 100%)' }}>
            <div className="w-full h-1 opacity-70" style={{ background: 'white' }} />
          </div>
        );
      case TileType.Sand:
        return (
          <div className="w-full h-full rounded-sm" style={{ background: 'linear-gradient(180deg, #FDE68A 0%, #FCD34D 50%, #F59E0B 100%)' }}>
            <div className="w-1 h-1 absolute" style={{ background: '#D97706', top: '30%', left: '20%', borderRadius: '50%' }} />
          </div>
        );
      case TileType.Grass:
        return (
          <div className="w-full h-full rounded-sm" style={{ background: 'linear-gradient(180deg, #4ADE80 0%, #22C55E 50%, #16A34A 100%)' }}>
            <div className="w-full h-1" style={{ background: '#15803D' }} />
          </div>
        );
      case TileType.Stone:
        return (
          <div className="w-full h-full rounded-sm" style={{ background: 'linear-gradient(135deg, #9CA3AF 0%, #6B7280 50%, #4B5563 100%)' }}>
          </div>
        );
      case TileType.Wood:
        return (
          <div className="w-full h-full rounded-sm" style={{ background: 'linear-gradient(180deg, #D97706 0%, #A16207 50%, #854D0E 100%)' }}>
            <div className="w-full h-px" style={{ background: '#713F12', marginTop: '6px' }} />
            <div className="w-full h-px" style={{ background: '#713F12', marginTop: '4px' }} />
          </div>
        );
      case TileType.Metal:
        return (
          <div className="w-full h-full rounded-sm" style={{ background: 'linear-gradient(135deg, #E5E7EB 0%, #9CA3AF 30%, #6B7280 70%, #9CA3AF 100%)' }}>
            <div className="w-2 h-2 absolute" style={{ background: '#D1D5DB', top: '20%', left: '20%', borderRadius: '50%' }} />
          </div>
        );
      default:
        return <div className="w-full h-full rounded-sm" style={{ background: tile.color }} />;
    }
  };

  return (
    <div
      className={cn(
        'tool-tile relative',
        isSelected && 'tool-tile-active'
      )}
    >
      {renderTilePreview()}
    </div>
  );
};

export const TilePalette: React.FC<TilePaletteProps> = ({
  selectedTile,
  onSelectTile,
}) => {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Tiles</h3>
      <div className="grid grid-cols-3 gap-2">
        {TILE_PALETTE.map((tile) => (
          <button
            key={tile.type}
            onClick={() => onSelectTile(tile.type)}
            className="flex flex-col items-center gap-1 group"
          >
            <TilePreview tile={tile} isSelected={selectedTile === tile.type} />
            <span className={cn(
              "text-[10px] text-muted-foreground group-hover:text-foreground transition-colors truncate w-full text-center",
              selectedTile === tile.type && "text-primary font-medium"
            )}>
              {tile.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};