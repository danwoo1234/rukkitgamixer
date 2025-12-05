import { GameMap, Layer, TileType, Entity, EntityType } from '@/types/editor';

// Generate a simple UUID
const generateId = (): string => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

// Create empty tile data
export const createEmptyTileData = (width: number, height: number): number[][] => {
  return Array(height).fill(null).map(() => Array(width).fill(TileType.Empty));
};

// Create a new layer
export const createLayer = (name: string, width: number, height: number): Layer => ({
  id: generateId(),
  name,
  visible: true,
  locked: false,
  data: createEmptyTileData(width, height),
  entities: [],
});

// Create a new map
export const createNewMap = (width: number = 30, height: number = 20): GameMap => {
  const now = Date.now();
  return {
    id: generateId(),
    name: 'Untitled Map',
    width,
    height,
    tileSize: 32,
    layers: [
      createLayer('Background', width, height),
      createLayer('Gameplay', width, height),
      createLayer('Foreground', width, height),
    ],
    createdAt: now,
    updatedAt: now,
  };
};

// Deep clone a map
export const cloneMap = (map: GameMap): GameMap => {
  return JSON.parse(JSON.stringify(map));
};

// Clone a layer
export const cloneLayer = (layer: Layer): Layer => {
  return JSON.parse(JSON.stringify(layer));
};

// Create an entity
export const createEntity = (
  type: EntityType,
  x: number,
  y: number
): Entity => {
  const sizes: Record<EntityType, { width: number; height: number }> = {
    [EntityType.Player]: { width: 28, height: 28 },
    [EntityType.Slime]: { width: 28, height: 20 },
    [EntityType.Bat]: { width: 24, height: 24 },
    [EntityType.Coin]: { width: 20, height: 20 },
    [EntityType.Door]: { width: 32, height: 64 },
    [EntityType.Lever]: { width: 24, height: 24 },
    [EntityType.Portal]: { width: 32, height: 48 },
    [EntityType.WallBlock]: { width: 32, height: 32 },
    [EntityType.Start]: { width: 32, height: 32 },
    [EntityType.End]: { width: 32, height: 32 },
    // New enemies
    [EntityType.Skeleton]: { width: 28, height: 32 },
    [EntityType.Ghost]: { width: 28, height: 28 },
    [EntityType.Spider]: { width: 24, height: 16 },
    // New items
    [EntityType.Gem]: { width: 20, height: 20 },
    [EntityType.Key]: { width: 20, height: 24 },
    [EntityType.Heart]: { width: 24, height: 24 },
    // Interactive
    [EntityType.MovingPlatform]: { width: 64, height: 16 },
    [EntityType.Trampoline]: { width: 32, height: 16 },
    [EntityType.Checkpoint]: { width: 32, height: 48 },
  };

  const size = sizes[type] || { width: 32, height: 32 };

  return {
    id: generateId(),
    type,
    x,
    y,
    width: size.width,
    height: size.height,
    properties: type === EntityType.Door ? { isOpen: false } : {},
  };
};

// Flood fill algorithm
export const floodFill = (
  data: number[][],
  startX: number,
  startY: number,
  newValue: number
): number[][] => {
  const height = data.length;
  const width = data[0].length;
  const targetValue = data[startY][startX];
  
  if (targetValue === newValue) return data;
  
  const result = data.map(row => [...row]);
  const stack: [number, number][] = [[startX, startY]];
  const visited = new Set<string>();
  
  while (stack.length > 0) {
    const [x, y] = stack.pop()!;
    const key = `${x},${y}`;
    
    if (visited.has(key)) continue;
    if (x < 0 || x >= width || y < 0 || y >= height) continue;
    if (result[y][x] !== targetValue) continue;
    
    visited.add(key);
    result[y][x] = newValue;
    
    stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }
  
  return result;
};

// Export map to JSON
export const exportMapToJson = (map: GameMap): string => {
  return JSON.stringify(map, null, 2);
};

// Import map from JSON
export const importMapFromJson = (json: string): GameMap | null => {
  try {
    const map = JSON.parse(json) as GameMap;
    // Basic validation
    if (!map.id || !map.layers || !Array.isArray(map.layers)) {
      return null;
    }
    return map;
  } catch {
    return null;
  }
};

// Generate a simple procedural map
export const generateProceduralMap = (
  width: number,
  height: number,
  theme: 'grass' | 'lava' | 'ice' | 'dungeon' = 'grass'
): number[][] => {
  const data = createEmptyTileData(width, height);
  
  // Create ground floor
  for (let x = 0; x < width; x++) {
    const groundHeight = height - 3 + Math.floor(Math.random() * 2);
    for (let y = groundHeight; y < height; y++) {
      data[y][x] = TileType.Ground;
    }
  }
  
  // Add platforms
  const platformCount = Math.floor(width / 8);
  for (let i = 0; i < platformCount; i++) {
    const px = Math.floor(Math.random() * (width - 6)) + 3;
    const py = Math.floor(Math.random() * (height - 8)) + 4;
    const pWidth = Math.floor(Math.random() * 4) + 3;
    
    for (let x = px; x < px + pWidth && x < width; x++) {
      data[py][x] = TileType.Ground;
    }
  }
  
  // Add theme-specific hazards
  if (theme === 'lava') {
    for (let x = 0; x < width; x++) {
      if (data[height - 1][x] === TileType.Ground && Math.random() < 0.3) {
        data[height - 1][x] = TileType.Lava;
      }
    }
  } else if (theme === 'ice') {
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (data[y][x] === TileType.Ground && Math.random() < 0.1) {
          data[y][x] = TileType.Water;
        }
      }
    }
  }
  
  // Add walls at edges
  for (let y = 0; y < height; y++) {
    data[y][0] = TileType.Wall;
    data[y][width - 1] = TileType.Wall;
  }
  
  return data;
};
