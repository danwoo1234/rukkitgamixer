import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Download, Star, Package } from 'lucide-react';

interface AssetStoreModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const mockAssets = [
  {
    id: '1',
    name: 'Fantasy Tileset',
    author: 'PixelMaster',
    downloads: 12500,
    rating: 4.8,
    tags: ['tiles', 'fantasy', 'dungeon'],
    preview: '🏰',
  },
  {
    id: '2',
    name: 'Sci-Fi Bundle',
    author: 'FutureArt',
    downloads: 8200,
    rating: 4.6,
    tags: ['tiles', 'sci-fi', 'space'],
    preview: '🚀',
  },
  {
    id: '3',
    name: 'Nature Pack',
    author: 'GreenThumb',
    downloads: 15800,
    rating: 4.9,
    tags: ['tiles', 'nature', 'forest'],
    preview: '🌲',
  },
  {
    id: '4',
    name: 'Enemy Sprites',
    author: 'SpriteKing',
    downloads: 9400,
    rating: 4.7,
    tags: ['entities', 'enemies', 'animated'],
    preview: '👾',
  },
  {
    id: '5',
    name: 'Sound FX Pack',
    author: 'AudioWiz',
    downloads: 6300,
    rating: 4.5,
    tags: ['audio', 'sfx', 'retro'],
    preview: '🔊',
  },
  {
    id: '6',
    name: 'UI Kit Pro',
    author: 'DesignPro',
    downloads: 11200,
    rating: 4.8,
    tags: ['ui', 'buttons', 'modern'],
    preview: '🎨',
  },
];

export const AssetStoreModal: React.FC<AssetStoreModalProps> = ({ isOpen, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredAssets = mockAssets.filter(asset =>
    asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    asset.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-surface-1 border-surface-2 text-foreground sm:max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" />
            Asset Store
          </DialogTitle>
        </DialogHeader>

        {/* Search */}
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search assets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-surface-2 border-surface-3"
          />
        </div>

        {/* Asset Grid */}
        <div className="grid grid-cols-2 gap-4 mt-4 overflow-y-auto max-h-[50vh] pr-2">
          {filteredAssets.map((asset) => (
            <div
              key={asset.id}
              className="p-4 bg-surface-2 rounded-lg hover:bg-surface-3 transition-colors cursor-pointer group"
            >
              <div className="flex gap-4">
                <div className="w-16 h-16 bg-surface-3 rounded-lg flex items-center justify-center text-3xl">
                  {asset.preview}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium truncate">{asset.name}</h3>
                  <p className="text-sm text-muted-foreground">{asset.author}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Star className="w-3 h-3 text-amber fill-current" />
                      {asset.rating}
                    </span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Download className="w-3 h-3" />
                      {(asset.downloads / 1000).toFixed(1)}k
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-1 mt-3">
                {asset.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs bg-surface-3">
                    {tag}
                  </Badge>
                ))}
              </div>
              <Button
                size="sm"
                className="w-full mt-3 bg-primary hover:bg-primary/90 text-primary-foreground opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>
          ))}
        </div>

        <p className="text-xs text-muted-foreground text-center mt-4">
          Asset store is simulated for demonstration purposes
        </p>
      </DialogContent>
    </Dialog>
  );
};
