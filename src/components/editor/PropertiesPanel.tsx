import React from 'react';
import { GameMap, TileType, EntityType } from '@/types/editor';
import { Map, Layers, Box, Grid2X2 } from 'lucide-react';

interface PropertiesPanelProps {
  map: GameMap;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ map }) => {
  // Calculate stats
  const totalTiles = map.width * map.height;
  const filledTiles = map.layers.reduce((acc, layer) => {
    return acc + layer.data.flat().filter(t => t !== TileType.Empty).length;
  }, 0);

  const totalEntities = map.layers.reduce((acc, layer) => {
    return acc + layer.entities.length;
  }, 0);

  const entityCounts = map.layers.reduce((acc, layer) => {
    layer.entities.forEach(e => {
      acc[e.type] = (acc[e.type] || 0) + 1;
    });
    return acc;
  }, {} as Record<EntityType, number>);

  const tileCounts = map.layers.reduce((acc, layer) => {
    layer.data.flat().forEach(t => {
      if (t !== TileType.Empty) {
        acc[t] = (acc[t] || 0) + 1;
      }
    });
    return acc;
  }, {} as Record<TileType, number>);

  const tileNames: Record<TileType, string> = {
    [TileType.Empty]: 'Empty',
    [TileType.Ground]: 'Ground',
    [TileType.Wall]: 'Wall',
    [TileType.Water]: 'Water',
    [TileType.Spike]: 'Spike',
    [TileType.Lava]: 'Lava',
    [TileType.Ice]: 'Ice',
    [TileType.Sand]: 'Sand',
    [TileType.Grass]: 'Grass',
    [TileType.Stone]: 'Stone',
    [TileType.Wood]: 'Wood',
    [TileType.Metal]: 'Metal',
  };

  return (
    <div className="space-y-4">
      {/* Map Info */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Map className="w-4 h-4 text-primary" />
          <h4 className="text-sm font-medium text-foreground">Map Info</h4>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="px-2 py-1 rounded bg-surface-2">
            <span className="text-muted-foreground">Name:</span>
            <span className="ml-2 text-foreground font-mono">{map.name}</span>
          </div>
          <div className="px-2 py-1 rounded bg-surface-2">
            <span className="text-muted-foreground">Size:</span>
            <span className="ml-2 text-foreground font-mono">{map.width}x{map.height}</span>
          </div>
        </div>
      </div>

      {/* Grid Stats */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Grid2X2 className="w-4 h-4 text-primary" />
          <h4 className="text-sm font-medium text-foreground">Grid Stats</h4>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="px-2 py-1 rounded bg-surface-2">
            <span className="text-muted-foreground">Total:</span>
            <span className="ml-2 text-foreground font-mono">{totalTiles}</span>
          </div>
          <div className="px-2 py-1 rounded bg-surface-2">
            <span className="text-muted-foreground">Filled:</span>
            <span className="ml-2 text-foreground font-mono">{filledTiles}</span>
          </div>
        </div>
      </div>

      {/* Tile Breakdown */}
      {Object.keys(tileCounts).length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-primary" />
            <h4 className="text-sm font-medium text-foreground">Tiles</h4>
          </div>
          <div className="space-y-1">
            {Object.entries(tileCounts).map(([type, count]) => (
              <div key={type} className="flex justify-between text-sm px-2 py-1 rounded bg-surface-2">
                <span className="text-muted-foreground">{tileNames[parseInt(type) as TileType]}</span>
                <span className="text-foreground font-mono">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Entity Breakdown */}
      {totalEntities > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Box className="w-4 h-4 text-primary" />
            <h4 className="text-sm font-medium text-foreground">Entities ({totalEntities})</h4>
          </div>
          <div className="space-y-1">
            {Object.entries(entityCounts).map(([type, count]) => (
              <div key={type} className="flex justify-between text-sm px-2 py-1 rounded bg-surface-2">
                <span className="text-muted-foreground capitalize">{type}</span>
                <span className="text-foreground font-mono">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
