import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface MapSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentWidth: number;
  currentHeight: number;
  currentTileSize: number;
  mapName: string;
  onApply: (settings: { width: number; height: number; tileSize: number; name: string }) => void;
}

export const MapSettingsModal: React.FC<MapSettingsModalProps> = ({
  isOpen,
  onClose,
  currentWidth,
  currentHeight,
  currentTileSize,
  mapName,
  onApply,
}) => {
  const [width, setWidth] = useState(currentWidth);
  const [height, setHeight] = useState(currentHeight);
  const [tileSize, setTileSize] = useState(currentTileSize);
  const [name, setName] = useState(mapName);

  const handleApply = () => {
    onApply({
      width: Math.max(10, Math.min(100, width)),
      height: Math.max(10, Math.min(100, height)),
      tileSize,
      name,
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-surface border-surface-2">
        <DialogHeader>
          <DialogTitle className="text-foreground">Map Settings</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="map-name" className="text-foreground">Map Name</Label>
            <Input
              id="map-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-surface-2 border-surface-3 text-foreground"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="width" className="text-foreground">Width (tiles)</Label>
              <Input
                id="width"
                type="number"
                min={10}
                max={100}
                value={width}
                onChange={(e) => setWidth(parseInt(e.target.value) || 10)}
                className="bg-surface-2 border-surface-3 text-foreground"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="height" className="text-foreground">Height (tiles)</Label>
              <Input
                id="height"
                type="number"
                min={10}
                max={100}
                value={height}
                onChange={(e) => setHeight(parseInt(e.target.value) || 10)}
                className="bg-surface-2 border-surface-3 text-foreground"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tile-size" className="text-foreground">Tile Size</Label>
            <Select value={tileSize.toString()} onValueChange={(v) => setTileSize(parseInt(v))}>
              <SelectTrigger className="bg-surface-2 border-surface-3 text-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-surface border-surface-2">
                <SelectItem value="16">16px</SelectItem>
                <SelectItem value="32">32px</SelectItem>
                <SelectItem value="64">64px</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="p-3 rounded-lg bg-surface-2 text-sm text-muted-foreground">
            <p>Canvas Size: {width * tileSize}px × {height * tileSize}px</p>
            <p className="text-yellow-500 mt-1">⚠️ Resizing may crop existing content</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleApply}>Apply Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
