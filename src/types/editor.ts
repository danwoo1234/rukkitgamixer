// Tile Types
export enum TileType {
  Empty = 0,
  Ground = 1,
  Wall = 2,
  Water = 3,
  Spike = 4,
  Lava = 5,
}

// Entity Types
export enum EntityType {
  Player = 'player',
  Slime = 'slime',
  Bat = 'bat',
  Coin = 'coin',
  Door = 'door',
  Lever = 'lever',
  Portal = 'portal',
  WallBlock = 'wallBlock',
}

// Entity data structure
export interface Entity {
  id: string;
  type: EntityType;
  x: number;
  y: number;
  width: number;
  height: number;
  properties?: Record<string, unknown>;
}

// Layer definition
export interface Layer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  data: number[][];
  entities: Entity[];
}

// Map data structure
export interface GameMap {
  id: string;
  name: string;
  width: number;
  height: number;
  tileSize: number;
  layers: Layer[];
  createdAt: number;
  updatedAt: number;
}

// Editor tools
export enum EditorTool {
  Brush = 'brush',
  Eraser = 'eraser',
  Fill = 'fill',
  Select = 'select',
  Pan = 'pan',
  Entity = 'entity',
}

// Editor state
export interface EditorState {
  tool: EditorTool;
  selectedTile: TileType;
  selectedEntity: EntityType | null;
  activeLayerId: string;
  zoom: number;
  panOffset: { x: number; y: number };
  gridVisible: boolean;
  isPlaying: boolean;
}

// History entry for undo/redo
export interface HistoryEntry {
  map: GameMap;
  timestamp: number;
}

// Tile info for palette
export interface TileInfo {
  type: TileType;
  name: string;
  color: string;
}

// Entity info for palette
export interface EntityInfo {
  type: EntityType;
  name: string;
  color: string;
  icon: string;
}

// Game physics constants
export const PHYSICS = {
  GRAVITY: 0.5,
  FRICTION: 0.8,
  PLAYER_SPEED: 4,
  PLAYER_JUMP: -12,
  MAX_FALL_SPEED: 12,
  TILE_SIZE: 32,
};

// Default tile palette
export const TILE_PALETTE: TileInfo[] = [
  { type: TileType.Ground, name: 'Ground', color: '#8B7355' },
  { type: TileType.Wall, name: 'Wall', color: '#4A5568' },
  { type: TileType.Water, name: 'Water', color: '#0EA5E9' },
  { type: TileType.Spike, name: 'Spike', color: '#64748B' },
  { type: TileType.Lava, name: 'Lava', color: '#EF4444' },
];

// Default entity palette
export const ENTITY_PALETTE: EntityInfo[] = [
  { type: EntityType.Player, name: 'Player', color: '#10B981', icon: 'User' },
  { type: EntityType.Slime, name: 'Slime', color: '#22C55E', icon: 'Bug' },
  { type: EntityType.Bat, name: 'Bat', color: '#8B5CF6', icon: 'Bird' },
  { type: EntityType.Coin, name: 'Coin', color: '#EAB308', icon: 'Coins' },
  { type: EntityType.Door, name: 'Door', color: '#A16207', icon: 'DoorClosed' },
  { type: EntityType.Lever, name: 'Lever', color: '#64748B', icon: 'ToggleLeft' },
  { type: EntityType.Portal, name: 'Portal', color: '#A855F7', icon: 'Sparkles' },
  { type: EntityType.WallBlock, name: 'Wall Block', color: '#374151', icon: 'Square' },
];
