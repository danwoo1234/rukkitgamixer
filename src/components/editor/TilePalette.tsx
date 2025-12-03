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
      default:
        return <div className="w-full h-full rounded-sm" style={{ background: tile.color }} />;
    }
  };

  return (
    <div
      className={cn(
        'tool-tile',
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
      <div className="grid grid-cols-4 gap-2">
        {TILE_PALETTE.map((tile) => (
          <button
            key={tile.type}
            onClick={() => onSelectTile(tile.type)}
            title={tile.name}
          >
            <TilePreview tile={tile} isSelected={selectedTile === tile.type} />
          </button>
        ))}
      </div>
    </div>
  );
};
