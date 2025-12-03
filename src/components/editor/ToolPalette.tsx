import React from 'react';
import {
  Paintbrush,
  Eraser,
  PaintBucket,
  Move,
  MousePointer2,
} from 'lucide-react';
import { EditorTool } from '@/types/editor';
import { cn } from '@/lib/utils';

interface ToolPaletteProps {
  selectedTool: EditorTool;
  onSelectTool: (tool: EditorTool) => void;
}

const tools = [
  { tool: EditorTool.Brush, icon: Paintbrush, label: 'Brush (B)' },
  { tool: EditorTool.Eraser, icon: Eraser, label: 'Eraser (E)' },
  { tool: EditorTool.Fill, icon: PaintBucket, label: 'Fill (F)' },
  { tool: EditorTool.Select, icon: MousePointer2, label: 'Select (S)' },
  { tool: EditorTool.Pan, icon: Move, label: 'Pan (P)' },
];

export const ToolPalette: React.FC<ToolPaletteProps> = ({
  selectedTool,
  onSelectTool,
}) => {
  return (
    <div className="flex gap-1 p-2 bg-surface-2 rounded-lg">
      {tools.map(({ tool, icon: Icon, label }) => (
        <button
          key={tool}
          onClick={() => onSelectTool(tool)}
          className={cn(
            'rukkit-tool',
            selectedTool === tool && 'rukkit-tool-active'
          )}
          title={label}
        >
          <Icon className="w-5 h-5" />
        </button>
      ))}
    </div>
  );
};
