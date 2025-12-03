import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Hammer, Layers, Sparkles, Settings } from 'lucide-react';
import { ToolPalette } from './ToolPalette';
import { TilePalette } from './TilePalette';
import { EntityPalette } from './EntityPalette';
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
  isGenerating,
}) => {
  return (
    <aside className="w-72 bg-surface-1 border-r border-surface-2 flex flex-col h-full">
      <Tabs defaultValue="build" className="flex-1 flex flex-col">
        <TabsList className="w-full justify-start rounded-none border-b border-surface-2 bg-transparent p-0">
          <TabsTrigger
            value="build"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary px-4 py-3"
          >
            <Hammer className="w-4 h-4 mr-2" />
            Build
          </TabsTrigger>
          <TabsTrigger
            value="layers"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary px-4 py-3"
          >
            <Layers className="w-4 h-4 mr-2" />
            Layers
          </TabsTrigger>
          <TabsTrigger
            value="ai"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary px-4 py-3"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            AI
          </TabsTrigger>
          <TabsTrigger
            value="properties"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary px-4 py-3"
          >
            <Settings className="w-4 h-4 mr-2" />
            Props
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-y-auto scrollbar-thin">
          <TabsContent value="build" className="m-0 p-4 space-y-6">
            <ToolPalette
              selectedTool={selectedTool}
              onSelectTool={onSelectTool}
            />
            <TilePalette
              selectedTile={selectedTile}
              onSelectTile={onSelectTile}
            />
            <EntityPalette
              selectedEntity={selectedEntity}
              onSelectEntity={onSelectEntity}
            />
          </TabsContent>

          <TabsContent value="layers" className="m-0 p-4">
            <LayerPanel
              layers={layers}
              activeLayerId={activeLayerId}
              onSelectLayer={onSelectLayer}
              onToggleVisibility={onToggleLayerVisibility}
              onToggleLock={onToggleLayerLock}
              onReorderLayers={onReorderLayers}
            />
          </TabsContent>

          <TabsContent value="ai" className="m-0 p-4">
            <AIPanel
              onGenerateMap={onGenerateMap}
              isGenerating={isGenerating}
            />
          </TabsContent>

          <TabsContent value="properties" className="m-0 p-4">
            <PropertiesPanel map={map} />
          </TabsContent>
        </div>
      </Tabs>
    </aside>
  );
};
