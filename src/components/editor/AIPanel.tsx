import React, { useState } from 'react';
import { Sparkles, Loader2, Wand2, Skull, Image, Map } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface AIPanelProps {
  onGenerateMap: (prompt: string) => Promise<void>;
  onGenerateBoss?: (prompt: string) => Promise<void>;
  onGenerateBackground?: (prompt: string) => Promise<void>;
  isGenerating: boolean;
}

const MAP_EXAMPLES = [
  'A lava dungeon with floating platforms',
  'A peaceful forest with hidden coins',
  'An ice cave with spikes',
];

const BOSS_EXAMPLES = [
  'A fire dragon with 3 attack patterns',
  'A giant slime that splits into smaller ones',
  'A skeleton king with sword attacks',
];

const BG_EXAMPLES = [
  'A sunset mountain range',
  'A dark spooky forest',
  'An underwater coral reef',
];

export const AIPanel: React.FC<AIPanelProps> = ({
  onGenerateMap,
  onGenerateBoss,
  onGenerateBackground,
  isGenerating,
}) => {
  const [mapPrompt, setMapPrompt] = useState('');
  const [bossPrompt, setBossPrompt] = useState('');
  const [bgPrompt, setBgPrompt] = useState('');

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-medium text-foreground">AI Generators</h3>
      </div>

      <Tabs defaultValue="map" className="w-full">
        <TabsList className="w-full grid grid-cols-3 h-8">
          <TabsTrigger value="map" className="text-xs px-2">
            <Map className="w-3 h-3 mr-1" />
            Map
          </TabsTrigger>
          <TabsTrigger value="boss" className="text-xs px-2">
            <Skull className="w-3 h-3 mr-1" />
            Boss
          </TabsTrigger>
          <TabsTrigger value="bg" className="text-xs px-2">
            <Image className="w-3 h-3 mr-1" />
            Background
          </TabsTrigger>
        </TabsList>

        <TabsContent value="map" className="mt-3 space-y-2">
          <Textarea
            value={mapPrompt}
            onChange={(e) => setMapPrompt(e.target.value)}
            placeholder="Describe your level..."
            className="min-h-[80px] bg-surface-2 border-surface-3 text-sm resize-none"
          />
          <Button
            onClick={() => onGenerateMap(mapPrompt)}
            disabled={!mapPrompt.trim() || isGenerating}
            className="w-full h-8 text-sm"
          >
            {isGenerating ? (
              <><Loader2 className="w-3 h-3 mr-1 animate-spin" />Generating...</>
            ) : (
              <><Wand2 className="w-3 h-3 mr-1" />Generate Map</>
            )}
          </Button>
          <div className="flex flex-wrap gap-1">
            {MAP_EXAMPLES.map((ex, i) => (
              <button
                key={i}
                onClick={() => setMapPrompt(ex)}
                className="text-[10px] px-1.5 py-0.5 rounded bg-surface-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {ex.slice(0, 20)}...
              </button>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="boss" className="mt-3 space-y-2">
          <Textarea
            value={bossPrompt}
            onChange={(e) => setBossPrompt(e.target.value)}
            placeholder="Describe your boss enemy..."
            className="min-h-[80px] bg-surface-2 border-surface-3 text-sm resize-none"
          />
          <Button
            onClick={() => onGenerateBoss?.(bossPrompt)}
            disabled={!bossPrompt.trim() || isGenerating}
            className="w-full h-8 text-sm"
          >
            {isGenerating ? (
              <><Loader2 className="w-3 h-3 mr-1 animate-spin" />Generating...</>
            ) : (
              <><Skull className="w-3 h-3 mr-1" />Generate Boss</>
            )}
          </Button>
          <div className="flex flex-wrap gap-1">
            {BOSS_EXAMPLES.map((ex, i) => (
              <button
                key={i}
                onClick={() => setBossPrompt(ex)}
                className="text-[10px] px-1.5 py-0.5 rounded bg-surface-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {ex.slice(0, 22)}...
              </button>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="bg" className="mt-3 space-y-2">
          <Textarea
            value={bgPrompt}
            onChange={(e) => setBgPrompt(e.target.value)}
            placeholder="Describe your background..."
            className="min-h-[80px] bg-surface-2 border-surface-3 text-sm resize-none"
          />
          <Button
            onClick={() => onGenerateBackground?.(bgPrompt)}
            disabled={!bgPrompt.trim() || isGenerating}
            className="w-full h-8 text-sm"
          >
            {isGenerating ? (
              <><Loader2 className="w-3 h-3 mr-1 animate-spin" />Generating...</>
            ) : (
              <><Image className="w-3 h-3 mr-1" />Generate Background</>
            )}
          </Button>
          <div className="flex flex-wrap gap-1">
            {BG_EXAMPLES.map((ex, i) => (
              <button
                key={i}
                onClick={() => setBgPrompt(ex)}
                className="text-[10px] px-1.5 py-0.5 rounded bg-surface-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {ex.slice(0, 18)}...
              </button>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <p className="text-[10px] text-muted-foreground pt-2 border-t border-surface-2">
        Powered by Google Gemini AI
      </p>
    </div>
  );
};
