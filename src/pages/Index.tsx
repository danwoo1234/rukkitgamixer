import React, { useState, useCallback, useEffect } from 'react';
import { Header } from '@/components/editor/Header';
import { Sidebar } from '@/components/editor/Sidebar';
import { EditorCanvas } from '@/components/editor/EditorCanvas';
import { GameEngine } from '@/components/game/GameEngine';
import { AuthModal } from '@/components/modals/AuthModal';
import { PublishModal } from '@/components/modals/PublishModal';
import { AnalyticsModal } from '@/components/modals/AnalyticsModal';
import { AssetStoreModal } from '@/components/modals/AssetStoreModal';
import { useEditorState } from '@/hooks/useEditorState';
import { generateMapWithAI } from '@/services/aiService';
import { exportMapToJson, importMapFromJson } from '@/utils/mapUtils';
import { toast } from 'sonner';

const Index = () => {
  const {
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
  } = useEditorState();

  // Modal states
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [isAnalyticsModalOpen, setIsAnalyticsModalOpen] = useState(false);
  const [isAssetStoreModalOpen, setIsAssetStoreModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Check for standalone play mode
  const [isStandaloneMode, setIsStandaloneMode] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const playId = params.get('play');
    if (playId) {
      setIsStandaloneMode(true);
      togglePlayMode();
    }
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (editorState.isPlaying) return;

      // Check if we're in an input field
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z') {
          e.preventDefault();
          if (e.shiftKey) {
            redo();
          } else {
            undo();
          }
        } else if (e.key === 'y') {
          e.preventDefault();
          redo();
        } else if (e.key === 's') {
          e.preventDefault();
          handleSave();
        }
      } else {
        switch (e.key.toLowerCase()) {
          case 'b':
            setTool('brush' as any);
            break;
          case 'e':
            setTool('eraser' as any);
            break;
          case 'f':
            setTool('fill' as any);
            break;
          case 's':
            setTool('select' as any);
            break;
          case 'p':
            setTool('pan' as any);
            break;
          case 'g':
            toggleGrid();
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editorState.isPlaying, undo, redo, setTool, toggleGrid]);

  // Export map
  const handleExport = useCallback(() => {
    const json = exportMapToJson(map);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${map.name.replace(/\s+/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Map exported successfully!');
  }, [map]);

  // Save map
  const handleSave = useCallback(() => {
    localStorage.setItem('rukkit_map', exportMapToJson(map));
    toast.success('Map saved to browser storage!');
  }, [map]);

  // Import map
  const handleImport = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const text = await file.text();
      const imported = importMapFromJson(text);
      
      if (imported) {
        loadMap(imported);
        toast.success('Map imported successfully!');
      } else {
        toast.error('Failed to import map. Invalid format.');
      }
    };
    input.click();
  }, [loadMap]);

  // Generate map with AI
  const handleGenerateMap = useCallback(async (prompt: string) => {
    setIsGenerating(true);
    
    try {
      // You can add your Gemini API key here or use environment variable
      const apiKey = undefined; // process.env.GEMINI_API_KEY;
      const generatedMap = await generateMapWithAI(prompt, apiKey);
      loadMap(generatedMap);
      toast.success('Map generated!', {
        description: apiKey ? 'Generated with AI' : 'Generated with procedural algorithm',
      });
    } catch (error) {
      toast.error('Failed to generate map');
      console.error(error);
    }
    
    setIsGenerating(false);
  }, [loadMap]);

  // Load saved map on mount
  useEffect(() => {
    const saved = localStorage.getItem('rukkit_map');
    if (saved) {
      const imported = importMapFromJson(saved);
      if (imported) {
        loadMap(imported);
      }
    }
  }, []);

  // Game callbacks
  const handleGameWin = useCallback(() => {
    toast.success('Level Complete!', {
      description: 'Congratulations! You beat the level.',
    });
  }, []);

  const handleGameDeath = useCallback(() => {
    toast.error('Game Over', {
      description: 'You died! Try again.',
    });
    togglePlayMode();
  }, [togglePlayMode]);

  // Standalone mode - only show game
  if (isStandaloneMode && editorState.isPlaying) {
    return (
      <GameEngine
        map={map}
        onStop={() => {
          setIsStandaloneMode(false);
          togglePlayMode();
          window.history.replaceState({}, '', window.location.pathname);
        }}
        onWin={handleGameWin}
        onDeath={handleGameDeath}
      />
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <Header
        isPlaying={editorState.isPlaying}
        onTogglePlay={togglePlayMode}
        onUndo={undo}
        onRedo={redo}
        onExport={handleExport}
        onSave={handleSave}
        onNew={newMap}
        onImport={handleImport}
        onOpenAssetStore={() => setIsAssetStoreModalOpen(true)}
        onOpenAnalytics={() => setIsAnalyticsModalOpen(true)}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onOpenPublish={() => setIsPublishModalOpen(true)}
        gridVisible={editorState.gridVisible}
        onToggleGrid={toggleGrid}
      />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          selectedTool={editorState.tool}
          selectedTile={editorState.selectedTile}
          selectedEntity={editorState.selectedEntity}
          layers={map.layers}
          activeLayerId={editorState.activeLayerId}
          map={map}
          onSelectTool={setTool}
          onSelectTile={setSelectedTile}
          onSelectEntity={setSelectedEntity}
          onSelectLayer={setActiveLayer}
          onToggleLayerVisibility={toggleLayerVisibility}
          onToggleLayerLock={toggleLayerLock}
          onReorderLayers={reorderLayers}
          onGenerateMap={handleGenerateMap}
          isGenerating={isGenerating}
        />

        <main className="flex-1 flex flex-col overflow-hidden">
          {editorState.isPlaying ? (
            <GameEngine
              map={map}
              onStop={togglePlayMode}
              onWin={handleGameWin}
              onDeath={handleGameDeath}
            />
          ) : (
            <EditorCanvas
              map={map}
              editorState={editorState}
              onPaintTile={paintTile}
              onEraseTile={eraseTile}
              onFillTiles={fillTiles}
              onPlaceEntity={placeEntity}
              onRemoveEntity={removeEntity}
              onZoom={setZoom}
              onPan={setPanOffset}
            />
          )}
        </main>
      </div>

      {/* Status Bar */}
      <footer className="h-8 bg-surface-1 border-t border-surface-2 flex items-center justify-between px-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <span>Map: {map.name}</span>
          <span>Size: {map.width}×{map.height}</span>
          <span>Zoom: {Math.round(editorState.zoom * 100)}%</span>
        </div>
        <div className="flex items-center gap-4">
          <span>Layer: {map.layers.find(l => l.id === editorState.activeLayerId)?.name || 'None'}</span>
          <span className="font-mono">Rukkit Editor v1.0</span>
        </div>
      </footer>

      {/* Modals */}
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      <PublishModal isOpen={isPublishModalOpen} onClose={() => setIsPublishModalOpen(false)} mapName={map.name} />
      <AnalyticsModal isOpen={isAnalyticsModalOpen} onClose={() => setIsAnalyticsModalOpen(false)} />
      <AssetStoreModal isOpen={isAssetStoreModalOpen} onClose={() => setIsAssetStoreModalOpen(false)} />
    </div>
  );
};

export default Index;
