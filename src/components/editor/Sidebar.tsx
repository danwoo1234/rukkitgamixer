import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Hammer, Layers, Sparkles, Settings } from 'lucide-react';
import { BuildPalette } from './BuildPalette';
import { LayerPanel } from './LayerPanel';
import { AIPanel } from './AIPanel';
import { PropertiesPanel } from './PropertiesPanel';
import { EditorTool, TileType, EntityType, GameMap, Layer } from '@/types/editor';

interface SidebarProps {
  selectedTool: EditorTool;
  selectedTile: TileType;
  selectedEntity: EntityType | null;
  layers: Layer[];
  activeLayerId: string;
  map: GameMap;
  onSelectTool: (tool: EditorTool) => void;
  onSelectTile: (tile: TileType) => void;
  onSelectEntity: (entity: EntityType) => void;
  onSelectLayer: (layerId: string) => void;
  onToggleLayerVisibility: (layerId: string) => void;
  onToggleLayerLock: (layerId: string) => void;
  onReorderLayers: (startIndex: number, endIndex: number) => void;
  onGenerateMap: (prompt: string) => Promise<void>;
  onGenerateBoss?: (prompt: string) => Promise<void>;
  onGenerateBackground?: (prompt: string) => Promise<void>;
  isGenerating: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  selectedTool,
  selectedTile,
  selectedEntity,
  layers,
  activeLayerId,
  map,
  onSelectTool,
  onSelectTile,
  onSelectEntity,
  onSelectLayer,
  onToggleLayerVisibility,
  onToggleLayerLock,
  onReorderLayers,
  onGenerateMap,
  onGenerateBoss,
  onGenerateBackground,
  isGenerating,
}) => {
  return (
    <aside className="w-64 bg-surface-1 border-r border-surface-2 flex flex-col h-full">
      <Tabs defaultValue="build" className="flex-1 flex flex-col">
        <TabsList className="w-full justify-start rounded-none border-b border-surface-2 bg-transparent p-0 h-10">
          <TabsTrigger
            value="build"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary px-3 py-2 text-xs"
          >
            <Hammer className="w-3.5 h-3.5 mr-1" />
            Build
          </TabsTrigger>
          <TabsTrigger
            value="layers"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary px-3 py-2 text-xs"
          >
            <Layers className="w-3.5 h-3.5 mr-1" />
            Layers
          </TabsTrigger>
          <TabsTrigger
            value="ai"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary px-3 py-2 text-xs"
          >
            <Sparkles className="w-3.5 h-3.5 mr-1" />
            AI
          </TabsTrigger>
          <TabsTrigger
            value="props"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary px-3 py-2 text-xs"
          >
            <Settings className="w-3.5 h-3.5 mr-1" />
            Props
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-y-auto scrollbar-thin">
          <TabsContent value="build" className="m-0 p-3">
            <BuildPalette
              selectedTool={selectedTool}
              selectedTile={selectedTile}
              selectedEntity={selectedEntity}
              onSelectTool={onSelectTool}
              onSelectTile={onSelectTile}
              onSelectEntity={onSelectEntity}
            />
          </TabsContent>

          <TabsContent value="layers" className="m-0 p-3">
            <LayerPanel
              layers={layers}
              activeLayerId={activeLayerId}
              onSelectLayer={onSelectLayer}
              onToggleVisibility={onToggleLayerVisibility}
              onToggleLock={onToggleLayerLock}
              onReorderLayers={onReorderLayers}
            />
          </TabsContent>

          <TabsContent value="ai" className="m-0 p-3">
            <AIPanel
              onGenerateMap={onGenerateMap}
              onGenerateBoss={onGenerateBoss}
              onGenerateBackground={onGenerateBackground}
              isGenerating={isGenerating}
            />
          </TabsContent>

          <TabsContent value="props" className="m-0 p-3">
            <PropertiesPanel map={map} />
          </TabsContent>
        </div>
      </Tabs>
    </aside>
  );
};
