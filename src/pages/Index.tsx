import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/editor/Header';
import { Sidebar } from '@/components/editor/Sidebar';
import { EditorCanvas } from '@/components/editor/EditorCanvas';
import { GameEngine } from '@/components/game/GameEngine';
import { AuthModal } from '@/components/modals/AuthModal';
import { PublishModal } from '@/components/modals/PublishModal';
import { AnalyticsModal } from '@/components/modals/AnalyticsModal';
import { AssetStoreModal } from '@/components/modals/AssetStoreModal';
import { MapSettingsModal } from '@/components/modals/MapSettingsModal';
import { useEditorState } from '@/hooks/useEditorState';
import { exportMapToJson, importMapFromJson, createNewMap } from '@/utils/mapUtils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { User } from '@supabase/supabase-js';

const Index = () => {
  const navigate = useNavigate();
  const {
    map, editorState, setTool, setSelectedTile, setSelectedEntity, setActiveLayer,
    setZoom, setPanOffset, toggleGrid, togglePlayMode, paintTile, eraseTile,
    fillTiles, placeEntity, removeEntity, toggleLayerVisibility, toggleLayerLock,
    reorderLayers, loadMap, newMap, undo, redo, updateMap,
  } = useEditorState();

  const [user, setUser] = useState<User | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [isAnalyticsModalOpen, setIsAnalyticsModalOpen] = useState(false);
  const [isAssetStoreModalOpen, setIsAssetStoreModalOpen] = useState(false);
  const [isMapSettingsOpen, setIsMapSettingsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isStandaloneMode, setIsStandaloneMode] = useState(false);
  const [currentMapId, setCurrentMapId] = useState<string | null>(null);

  // Auth state
  useEffect(() => {
    supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
  }, []);

  // Check for standalone play mode or load shared map
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const playParam = params.get('play');
    if (playParam) {
      setIsStandaloneMode(true);
      // Try to load map by slug first, then by ID
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(playParam);
      
      const query = isUUID 
        ? supabase.from('game_maps').select('*').eq('id', playParam).maybeSingle()
        : supabase.from('game_maps').select('*').eq('slug', playParam).maybeSingle();
      
      query.then(({ data }) => {
        if (data?.map_data) {
          loadMap(data.map_data as any);
          setCurrentMapId(data.id);
          supabase.rpc('increment_play_count', { map_uuid: data.id });
        }
        togglePlayMode();
      });
    }
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (editorState.isPlaying) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); }
        else if (e.key === 'y') { e.preventDefault(); redo(); }
        else if (e.key === 's') { e.preventDefault(); handleSave(); }
      } else {
        switch (e.key.toLowerCase()) {
          case 'b': setTool('brush' as any); break;
          case 'e': setTool('eraser' as any); break;
          case 'f': setTool('fill' as any); break;
          case 'g': toggleGrid(); break;
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editorState.isPlaying, undo, redo, setTool, toggleGrid]);

  const handleExport = useCallback(() => {
    const json = exportMapToJson(map);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${map.name.replace(/\s+/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Map exported!');
  }, [map]);

  const handleSave = useCallback(async () => {
    if (user) {
      const { data, error } = await supabase.from('game_maps').upsert({
        id: currentMapId || map.id,
        user_id: user.id,
        name: map.name,
        width: map.width,
        height: map.height,
        tile_size: map.tileSize,
        map_data: map as any,
      }).select().single();
      if (error) toast.error('Failed to save');
      else {
        setCurrentMapId(data.id);
        toast.success('Saved to cloud!');
      }
    } else {
      localStorage.setItem('rukkit_map', exportMapToJson(map));
      toast.success('Saved locally!');
    }
  }, [map, user, currentMapId]);

  const handleImport = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const text = await file.text();
      const imported = importMapFromJson(text);
      if (imported) { loadMap(imported); toast.success('Imported!'); }
      else toast.error('Invalid format');
    };
    input.click();
  }, [loadMap]);

  const handleGenerateMap = useCallback(async (prompt: string) => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-map', {
        body: { prompt, width: map.width, height: map.height }
      });

      if (error) throw error;
      if (data?.tiles) {
        updateMap(currentMap => {
          const layer = currentMap.layers[1];
          for (let y = 0; y < currentMap.height; y++) {
            for (let x = 0; x < currentMap.width; x++) {
              layer.data[y][x] = data.tiles[y]?.[x] ?? 0;
            }
          }
          if (data.entities) {
            layer.entities = data.entities.map((e: any) => ({
              id: Math.random().toString(36).substr(2, 9),
              type: e.type, x: e.x * currentMap.tileSize, y: e.y * currentMap.tileSize,
              width: 28, height: 28
            }));
          }
          currentMap.name = prompt.slice(0, 30);
          return currentMap;
        });
        toast.success('Map generated with AI!');
      }
    } catch (error) {
      toast.error('Generation failed, try again');
    }
    setIsGenerating(false);
  }, [map, updateMap]);

  const handleMapSettings = useCallback((settings: { width: number; height: number; tileSize: number; name: string }) => {
    const newMapData = createNewMap(settings.width, settings.height);
    newMapData.name = settings.name;
    newMapData.tileSize = settings.tileSize;
    loadMap(newMapData);
    toast.success('Map settings applied!');
  }, [loadMap]);

  useEffect(() => {
    const saved = localStorage.getItem('rukkit_map');
    if (saved) {
      const imported = importMapFromJson(saved);
      if (imported) loadMap(imported);
    }
  }, []);

  const handleGameWin = useCallback(() => toast.success('Level Complete!'), []);
  const handleGameDeath = useCallback(() => { toast.error('Game Over'); togglePlayMode(); }, [togglePlayMode]);

  if (isStandaloneMode && editorState.isPlaying) {
    return <GameEngine map={map} onStop={() => { setIsStandaloneMode(false); togglePlayMode(); window.history.replaceState({}, '', '/'); }} onWin={handleGameWin} onDeath={handleGameDeath} />;
  }

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <Header isPlaying={editorState.isPlaying} onTogglePlay={togglePlayMode} onUndo={undo} onRedo={redo}
        onExport={handleExport} onSave={handleSave} onNew={newMap} onImport={handleImport}
        onOpenAssetStore={() => setIsAssetStoreModalOpen(true)} onOpenAnalytics={() => setIsAnalyticsModalOpen(true)}
        onOpenAuth={() => navigate('/auth')}
        onOpenPublish={() => setIsPublishModalOpen(true)} gridVisible={editorState.gridVisible} onToggleGrid={toggleGrid}
        onOpenMapSettings={() => setIsMapSettingsOpen(true)} onBrowse={() => navigate('/browse')}
        onMyMaps={() => navigate('/my-maps')} onLogout={() => supabase.auth.signOut()} user={user} />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar selectedTool={editorState.tool} selectedTile={editorState.selectedTile} selectedEntity={editorState.selectedEntity}
          layers={map.layers} activeLayerId={editorState.activeLayerId} map={map} onSelectTool={setTool}
          onSelectTile={setSelectedTile} onSelectEntity={setSelectedEntity} onSelectLayer={setActiveLayer}
          onToggleLayerVisibility={toggleLayerVisibility} onToggleLayerLock={toggleLayerLock}
          onReorderLayers={reorderLayers} onGenerateMap={handleGenerateMap} isGenerating={isGenerating} />

        <main className="flex-1 flex flex-col overflow-hidden">
          {editorState.isPlaying ? (
            <GameEngine map={map} onStop={togglePlayMode} onWin={handleGameWin} onDeath={handleGameDeath} />
          ) : (
            <EditorCanvas map={map} editorState={editorState} onPaintTile={paintTile} onEraseTile={eraseTile}
              onFillTiles={fillTiles} onPlaceEntity={placeEntity} onRemoveEntity={removeEntity}
              onZoom={setZoom} onPan={setPanOffset} />
          )}
        </main>
      </div>

      <footer className="h-8 bg-surface-1 border-t border-surface-2 flex items-center justify-between px-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <span>Map: {map.name}</span>
          <span>Size: {map.width}×{map.height}</span>
          <span>Zoom: {Math.round(editorState.zoom * 100)}%</span>
        </div>
        <div className="flex items-center gap-4">
          <span>{user ? `Logged in as ${user.email}` : 'Not logged in'}</span>
          <span className="font-mono">Rukkit v1.0</span>
        </div>
      </footer>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      <PublishModal isOpen={isPublishModalOpen} onClose={() => setIsPublishModalOpen(false)} mapName={map.name} map={map} user={user} existingMapId={currentMapId} />
      <AnalyticsModal isOpen={isAnalyticsModalOpen} onClose={() => setIsAnalyticsModalOpen(false)} />
      <AssetStoreModal isOpen={isAssetStoreModalOpen} onClose={() => setIsAssetStoreModalOpen(false)} />
      <MapSettingsModal isOpen={isMapSettingsOpen} onClose={() => setIsMapSettingsOpen(false)}
        currentWidth={map.width} currentHeight={map.height} currentTileSize={map.tileSize}
        mapName={map.name} onApply={handleMapSettings} />
    </div>
  );
};

export default Index;
