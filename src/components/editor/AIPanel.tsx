import React, { useState } from 'react';
import { Sparkles, Loader2, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface AIPanelProps {
  onGenerateMap: (prompt: string) => Promise<void>;
  isGenerating: boolean;
}

const EXAMPLE_PROMPTS = [
  'A lava-filled dungeon with floating platforms',
  'A peaceful forest level with hidden coins',
  'An ice cave with treacherous spikes',
  'A castle with doors and levers',
];

export const AIPanel: React.FC<AIPanelProps> = ({
  onGenerateMap,
  isGenerating,
}) => {
  const [prompt, setPrompt] = useState('');

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    await onGenerateMap(prompt);
  };

  const handleExampleClick = (example: string) => {
    setPrompt(example);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-primary" />
        <h3 className="text-sm font-medium text-foreground">AI Map Generator</h3>
      </div>

      <div className="space-y-2">
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe the level you want to create..."
          className="min-h-[100px] bg-surface-2 border-surface-3 text-foreground placeholder:text-muted-foreground resize-none"
        />
        
        <Button
          onClick={handleGenerate}
          disabled={!prompt.trim() || isGenerating}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Wand2 className="w-4 h-4 mr-2" />
              Generate Map
            </>
          )}
        </Button>
      </div>

      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">Try an example:</p>
        <div className="flex flex-wrap gap-2">
          {EXAMPLE_PROMPTS.map((example, index) => (
            <button
              key={index}
              onClick={() => handleExampleClick(example)}
              className="text-xs px-2 py-1 rounded bg-surface-2 text-muted-foreground hover:text-foreground hover:bg-surface-3 transition-colors"
            >
              {example.slice(0, 25)}...
            </button>
          ))}
        </div>
      </div>

      <div className="pt-4 border-t border-surface-2">
        <p className="text-xs text-muted-foreground">
          Powered by Google Gemini. AI will generate a map based on your description.
          If no API key is configured, procedural generation will be used.
        </p>
      </div>
    </div>
  );
};
