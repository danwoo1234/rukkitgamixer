import { TileType, EntityType, GameMap } from '@/types/editor';
import { createNewMap, generateProceduralMap, createEntity } from '@/utils/mapUtils';

// AI Generation Service
// Uses Google Gemini if API key is available, otherwise falls back to procedural generation

interface GeneratedMapData {
  tiles: number[][];
  entities: Array<{
    type: string;
    x: number;
    y: number;
  }>;
}

// Prompt template for Gemini
const createPrompt = (userPrompt: string, width: number, height: number): string => {
  return `You are a game level designer. Generate a 2D platformer level based on this description: "${userPrompt}"

The level should be ${width} tiles wide and ${height} tiles high.

Tile types:
0 = Empty (air)
1 = Ground (solid platform)
2 = Wall (solid wall)
3 = Water (visual, not solid)
4 = Spike (hazard)
5 = Lava (hazard)

Entity types (place these strategically):
- player: The player spawn point (required, only one)
- slime: Ground enemy that patrols
- bat: Flying enemy
- coin: Collectible
- door: Locked door (needs lever)
- lever: Opens doors
- portal: Level exit (required, place at end)

Return ONLY a valid JSON object with this exact structure, no markdown or explanation:
{
  "tiles": [[0,1,1,...], ...],
  "entities": [
    {"type": "player", "x": 2, "y": 16},
    {"type": "portal", "x": 27, "y": 10},
    ...
  ]
}

Make the level fun and challenging with:
- A clear path from start to end
- Platforms at varying heights
- Hazards that require skill to avoid
- Collectibles to reward exploration
- At least one puzzle element (lever/door)`;
};

// Parse AI response
const parseAIResponse = (response: string): GeneratedMapData | null => {
  try {
    // Try to extract JSON from the response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    
    const data = JSON.parse(jsonMatch[0]) as GeneratedMapData;
    
    // Validate structure
    if (!Array.isArray(data.tiles) || !Array.isArray(data.entities)) {
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Failed to parse AI response:', error);
    return null;
  }
};

// Generate map using AI or fallback
export const generateMapWithAI = async (
  prompt: string,
  apiKey?: string
): Promise<GameMap> => {
  const width = 30;
  const height = 20;

  // Try AI generation if API key is provided
  if (apiKey) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: createPrompt(prompt, width, height),
              }],
            }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 8192,
            },
          }),
        }
      );

      if (response.ok) {
        const result = await response.json();
        const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (text) {
          const parsedData = parseAIResponse(text);
          
          if (parsedData) {
            return convertToGameMap(parsedData, width, height, prompt);
          }
        }
      }
    } catch (error) {
      console.error('AI generation failed, using procedural fallback:', error);
    }
  }

  // Fallback to procedural generation
  return generateProceduralMapFromPrompt(prompt, width, height);
};

// Convert AI response to GameMap
const convertToGameMap = (
  data: GeneratedMapData,
  width: number,
  height: number,
  name: string
): GameMap => {
  const map = createNewMap(width, height);
  map.name = name;

  // Set tiles on gameplay layer
  const gameplayLayer = map.layers[1];
  
  // Ensure tiles array is correct size
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const tileValue = data.tiles[y]?.[x] ?? TileType.Empty;
      gameplayLayer.data[y][x] = Math.min(Math.max(tileValue, 0), 5) as TileType;
    }
  }

  // Add entities
  const entityTypeMap: Record<string, EntityType> = {
    player: EntityType.Player,
    slime: EntityType.Slime,
    bat: EntityType.Bat,
    coin: EntityType.Coin,
    door: EntityType.Door,
    lever: EntityType.Lever,
    portal: EntityType.Portal,
    wallBlock: EntityType.WallBlock,
  };

  data.entities.forEach(entityData => {
    const entityType = entityTypeMap[entityData.type.toLowerCase()];
    if (entityType) {
      const entity = createEntity(
        entityType,
        entityData.x * map.tileSize,
        entityData.y * map.tileSize
      );
      gameplayLayer.entities.push(entity);
    }
  });

  return map;
};

// Procedural generation based on prompt keywords
const generateProceduralMapFromPrompt = (
  prompt: string,
  width: number,
  height: number
): GameMap => {
  const lowerPrompt = prompt.toLowerCase();
  
  // Determine theme
  let theme: 'grass' | 'lava' | 'ice' | 'dungeon' = 'grass';
  if (lowerPrompt.includes('lava') || lowerPrompt.includes('fire') || lowerPrompt.includes('volcano')) {
    theme = 'lava';
  } else if (lowerPrompt.includes('ice') || lowerPrompt.includes('snow') || lowerPrompt.includes('cold')) {
    theme = 'ice';
  } else if (lowerPrompt.includes('dungeon') || lowerPrompt.includes('castle') || lowerPrompt.includes('cave')) {
    theme = 'dungeon';
  }

  const map = createNewMap(width, height);
  map.name = prompt.slice(0, 30);

  // Generate base terrain
  const gameplayLayer = map.layers[1];
  gameplayLayer.data = generateProceduralMap(width, height, theme);

  // Add floor
  for (let x = 0; x < width; x++) {
    gameplayLayer.data[height - 1][x] = TileType.Ground;
    gameplayLayer.data[height - 2][x] = TileType.Ground;
  }

  // Add platforms
  const platformCount = 5 + Math.floor(Math.random() * 5);
  for (let i = 0; i < platformCount; i++) {
    const px = Math.floor(Math.random() * (width - 8)) + 4;
    const py = Math.floor(Math.random() * (height - 8)) + 3;
    const pWidth = Math.floor(Math.random() * 5) + 3;
    
    for (let x = px; x < px + pWidth && x < width - 1; x++) {
      gameplayLayer.data[py][x] = TileType.Ground;
    }
  }

  // Add hazards based on theme
  if (theme === 'lava') {
    for (let x = 2; x < width - 2; x++) {
      if (Math.random() < 0.2) {
        gameplayLayer.data[height - 1][x] = TileType.Lava;
      }
    }
  } else if (theme === 'ice') {
    for (let x = 2; x < width - 2; x++) {
      if (Math.random() < 0.15) {
        const y = Math.floor(Math.random() * (height - 4)) + 2;
        gameplayLayer.data[y][x] = TileType.Water;
      }
    }
  }

  // Add spikes
  for (let x = 3; x < width - 3; x++) {
    if (Math.random() < 0.1) {
      for (let y = height - 3; y >= 0; y--) {
        if (gameplayLayer.data[y][x] === TileType.Ground) {
          if (y > 0 && gameplayLayer.data[y - 1][x] === TileType.Empty) {
            gameplayLayer.data[y - 1][x] = TileType.Spike;
          }
          break;
        }
      }
    }
  }

  // Add player at start
  const player = createEntity(EntityType.Player, 64, (height - 4) * 32);
  gameplayLayer.entities.push(player);

  // Add portal at end
  const portal = createEntity(EntityType.Portal, (width - 3) * 32, (height - 5) * 32);
  gameplayLayer.entities.push(portal);

  // Add coins
  const coinCount = 5 + Math.floor(Math.random() * 5);
  for (let i = 0; i < coinCount; i++) {
    const cx = Math.floor(Math.random() * (width - 6)) + 3;
    const cy = Math.floor(Math.random() * (height - 6)) + 2;
    const coin = createEntity(EntityType.Coin, cx * 32, cy * 32);
    gameplayLayer.entities.push(coin);
  }

  // Add enemies
  const enemyCount = 3 + Math.floor(Math.random() * 3);
  for (let i = 0; i < enemyCount; i++) {
    const ex = Math.floor(Math.random() * (width - 10)) + 5;
    const ey = Math.floor(Math.random() * (height - 6)) + 2;
    const enemyType = Math.random() > 0.5 ? EntityType.Slime : EntityType.Bat;
    const enemy = createEntity(enemyType, ex * 32, ey * 32);
    gameplayLayer.entities.push(enemy);
  }

  // Add door and lever if dungeon/castle theme
  if (theme === 'dungeon' || lowerPrompt.includes('puzzle') || lowerPrompt.includes('door')) {
    const doorX = Math.floor(width * 0.6);
    const door = createEntity(EntityType.Door, doorX * 32, (height - 4) * 32);
    gameplayLayer.entities.push(door);

    const leverX = Math.floor(width * 0.3);
    const lever = createEntity(EntityType.Lever, leverX * 32, (height - 4) * 32);
    gameplayLayer.entities.push(lever);
  }

  return map;
};
