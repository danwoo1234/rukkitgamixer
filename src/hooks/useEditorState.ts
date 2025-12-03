import { useState, useCallback, useRef } from 'react';
import {
  GameMap,
  EditorState,
  EditorTool,
  TileType,
  EntityType,
  HistoryEntry,
  Entity,
} from '@/types/editor';
import {
  createNewMap,
  cloneMap,
  floodFill,
  createEntity,
} from '@/utils/mapUtils';

const MAX_HISTORY = 50;

export const useEditorState = () => {
  const [map, setMap] = useState<GameMap>(() => createNewMap());
  const [editorState, setEditorState] = useState<EditorState>({
    tool: EditorTool.Brush,
    selectedTile: TileType.Ground,
    selectedEntity: null,
    activeLayerId: '',
    zoom: 1,
    panOffset: { x: 0, y: 0 },
    gridVisible: true,
    isPlaying: false,
  });

  const historyRef = useRef<HistoryEntry[]>([]);
  const historyIndexRef = useRef<number>(-1);
  const isUndoingRef = useRef(false);

  // Initialize active layer
  useState(() => {
    if (map.layers.length > 0 && !editorState.activeLayerId) {
      setEditorState(prev => ({
        ...prev,
        activeLayerId: map.layers[1]?.id || map.layers[0].id,
      }));
    }
  });

  // Save to history
  const saveToHistory = useCallback((newMap: GameMap) => {
    if (isUndoingRef.current) return;

    const entry: HistoryEntry = {
      map: cloneMap(newMap),
      timestamp: Date.now(),
    };

    // Remove any future history if we're not at the end
    if (historyIndexRef.current < historyRef.current.length - 1) {
      historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
    }

    historyRef.current.push(entry);
    if (historyRef.current.length > MAX_HISTORY) {
      historyRef.current.shift();
    }
    historyIndexRef.current = historyRef.current.length - 1;
  }, []);

  // Undo
  const undo = useCallback(() => {
    if (historyIndexRef.current <= 0) return;
    
    isUndoingRef.current = true;
    historyIndexRef.current--;
    const entry = historyRef.current[historyIndexRef.current];
    if (entry) {
      setMap(cloneMap(entry.map));
    }
    isUndoingRef.current = false;
  }, []);

  // Redo
  const redo = useCallback(() => {
    if (historyIndexRef.current >= historyRef.current.length - 1) return;
    
    isUndoingRef.current = true;
    historyIndexRef.current++;
    const entry = historyRef.current[historyIndexRef.current];
    if (entry) {
      setMap(cloneMap(entry.map));
    }
    isUndoingRef.current = false;
  }, []);

  // Update map
  const updateMap = useCallback((updater: (map: GameMap) => GameMap) => {
    setMap(prev => {
      const newMap = updater(cloneMap(prev));
      newMap.updatedAt = Date.now();
      saveToHistory(newMap);
      return newMap;
    });
  }, [saveToHistory]);

  // Set tool
  const setTool = useCallback((tool: EditorTool) => {
    setEditorState(prev => ({ ...prev, tool }));
  }, []);

  // Set selected tile
  const setSelectedTile = useCallback((tile: TileType) => {
    setEditorState(prev => ({
      ...prev,
      selectedTile: tile,
      selectedEntity: null,
      tool: EditorTool.Brush,
    }));
  }, []);

  // Set selected entity
  const setSelectedEntity = useCallback((entity: EntityType) => {
    setEditorState(prev => ({
      ...prev,
      selectedEntity: entity,
      tool: EditorTool.Entity,
    }));
  }, []);

  // Set active layer
  const setActiveLayer = useCallback((layerId: string) => {
    setEditorState(prev => ({ ...prev, activeLayerId: layerId }));
  }, []);

  // Set zoom
  const setZoom = useCallback((zoom: number) => {
    setEditorState(prev => ({
      ...prev,
      zoom: Math.max(0.25, Math.min(4, zoom)),
    }));
  }, []);

  // Set pan offset
  const setPanOffset = useCallback((offset: { x: number; y: number }) => {
    setEditorState(prev => ({ ...prev, panOffset: offset }));
  }, []);

  // Toggle grid
  const toggleGrid = useCallback(() => {
    setEditorState(prev => ({ ...prev, gridVisible: !prev.gridVisible }));
  }, []);

  // Toggle play mode
  const togglePlayMode = useCallback(() => {
    setEditorState(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
  }, []);

  // Paint tile at position
  const paintTile = useCallback((x: number, y: number) => {
    updateMap(currentMap => {
      const layer = currentMap.layers.find(l => l.id === editorState.activeLayerId);
      if (!layer || layer.locked || !layer.visible) return currentMap;

      if (x < 0 || x >= currentMap.width || y < 0 || y >= currentMap.height) {
        return currentMap;
      }

      layer.data[y][x] = editorState.selectedTile;
      return currentMap;
    });
  }, [editorState.activeLayerId, editorState.selectedTile, updateMap]);

  // Erase tile at position
  const eraseTile = useCallback((x: number, y: number) => {
    updateMap(currentMap => {
      const layer = currentMap.layers.find(l => l.id === editorState.activeLayerId);
      if (!layer || layer.locked || !layer.visible) return currentMap;

      if (x < 0 || x >= currentMap.width || y < 0 || y >= currentMap.height) {
        return currentMap;
      }

      layer.data[y][x] = TileType.Empty;
      return currentMap;
    });
  }, [editorState.activeLayerId, updateMap]);

  // Flood fill at position
  const fillTiles = useCallback((x: number, y: number) => {
    updateMap(currentMap => {
      const layer = currentMap.layers.find(l => l.id === editorState.activeLayerId);
      if (!layer || layer.locked || !layer.visible) return currentMap;

      if (x < 0 || x >= currentMap.width || y < 0 || y >= currentMap.height) {
        return currentMap;
      }

      layer.data = floodFill(layer.data, x, y, editorState.selectedTile);
      return currentMap;
    });
  }, [editorState.activeLayerId, editorState.selectedTile, updateMap]);

  // Place entity
  const placeEntity = useCallback((x: number, y: number) => {
    if (!editorState.selectedEntity) return;

    updateMap(currentMap => {
      const layer = currentMap.layers.find(l => l.id === editorState.activeLayerId);
      if (!layer || layer.locked || !layer.visible) return currentMap;

      // Check if player already exists
      if (editorState.selectedEntity === EntityType.Player) {
        const hasPlayer = currentMap.layers.some(l =>
          l.entities.some(e => e.type === EntityType.Player)
        );
        if (hasPlayer) {
          // Remove existing player
          currentMap.layers.forEach(l => {
            l.entities = l.entities.filter(e => e.type !== EntityType.Player);
          });
        }
      }

      const worldX = x * currentMap.tileSize;
      const worldY = y * currentMap.tileSize;
      const entity = createEntity(editorState.selectedEntity, worldX, worldY);
      layer.entities.push(entity);

      return currentMap;
    });
  }, [editorState.activeLayerId, editorState.selectedEntity, updateMap]);

  // Remove entity at position
  const removeEntity = useCallback((x: number, y: number) => {
    updateMap(currentMap => {
      const layer = currentMap.layers.find(l => l.id === editorState.activeLayerId);
      if (!layer || layer.locked || !layer.visible) return currentMap;

      const worldX = x * currentMap.tileSize;
      const worldY = y * currentMap.tileSize;

      layer.entities = layer.entities.filter(e => {
        const inX = worldX >= e.x && worldX < e.x + e.width;
        const inY = worldY >= e.y && worldY < e.y + e.height;
        return !(inX && inY);
      });

      return currentMap;
    });
  }, [editorState.activeLayerId, updateMap]);

  // Toggle layer visibility
  const toggleLayerVisibility = useCallback((layerId: string) => {
    updateMap(currentMap => {
      const layer = currentMap.layers.find(l => l.id === layerId);
      if (layer) {
        layer.visible = !layer.visible;
      }
      return currentMap;
    });
  }, [updateMap]);

  // Toggle layer lock
  const toggleLayerLock = useCallback((layerId: string) => {
    updateMap(currentMap => {
      const layer = currentMap.layers.find(l => l.id === layerId);
      if (layer) {
        layer.locked = !layer.locked;
      }
      return currentMap;
    });
  }, [updateMap]);

  // Reorder layers
  const reorderLayers = useCallback((startIndex: number, endIndex: number) => {
    updateMap(currentMap => {
      const layers = [...currentMap.layers];
      const [removed] = layers.splice(startIndex, 1);
      layers.splice(endIndex, 0, removed);
      currentMap.layers = layers;
      return currentMap;
    });
  }, [updateMap]);

  // Load map
  const loadMap = useCallback((newMap: GameMap) => {
    setMap(newMap);
    setEditorState(prev => ({
      ...prev,
      activeLayerId: newMap.layers[1]?.id || newMap.layers[0]?.id || '',
    }));
    historyRef.current = [];
    historyIndexRef.current = -1;
    saveToHistory(newMap);
  }, [saveToHistory]);

  // New map
  const newMap = useCallback(() => {
    const freshMap = createNewMap();
    loadMap(freshMap);
  }, [loadMap]);

  return {
    map,
    editorState,
    setTool,
    setSelectedTile,
    setSelectedEntity,
    setActiveLayer,
    setZoom,
    setPanOffset,
    toggleGrid,
    togglePlayMode,
    paintTile,
    eraseTile,
    fillTiles,
    placeEntity,
    removeEntity,
    toggleLayerVisibility,
    toggleLayerLock,
    reorderLayers,
    loadMap,
    newMap,
    undo,
    redo,
    updateMap,
  };
};
