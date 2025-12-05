import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Copy, Loader2, Rocket, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { GameMap } from '@/types/editor';
import { User } from '@supabase/supabase-js';

interface PublishModalProps {
  isOpen: boolean;
  onClose: () => void;
  mapName: string;
  map: GameMap;
  user: User | null;
}

export const PublishModal: React.FC<PublishModalProps> = ({ isOpen, onClose, mapName, map, user }) => {
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishedUrl, setPublishedUrl] = useState<string | null>(null);
  const [gameName, setGameName] = useState(mapName);

  const handlePublish = async () => {
    if (!user) {
      toast.error('Please login to publish your game');
      return;
    }

    setIsPublishing(true);

    try {
      const mapData = {
        name: gameName,
        user_id: user.id,
        width: map.width,
        height: map.height,
        tile_size: map.tileSize,
        map_data: JSON.parse(JSON.stringify(map)),
        is_public: true,
      };
      
      const { data, error } = await supabase
        .from('game_maps')
        .insert([mapData])
        .select()
        .single();

      if (error) throw error;

      const url = `${window.location.origin}?play=${data.id}`;
      setPublishedUrl(url);
      
      toast.success('Game Published!', {
        description: 'Your game is now live and ready to share.',
      });
    } catch (error) {
      console.error('Error publishing:', error);
      toast.error('Failed to publish game');
    }

    setIsPublishing(false);
  };

  const copyToClipboard = () => {
    if (publishedUrl) {
      navigator.clipboard.writeText(publishedUrl);
      toast.success('Link copied to clipboard!');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-surface-1 border-surface-2 text-foreground sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Rocket className="w-5 h-5 text-primary" />
            Publish Your Game
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Deploy your game and share it with the world
          </DialogDescription>
        </DialogHeader>

        {!publishedUrl ? (
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="game-name">Game Name</Label>
              <Input
                id="game-name"
                value={gameName}
                onChange={(e) => setGameName(e.target.value)}
                className="bg-surface-2 border-surface-3"
                placeholder="My Awesome Game"
              />
            </div>

            <div className="p-4 bg-surface-2 rounded-lg space-y-2">
              <h4 className="font-medium text-sm">What happens when you publish:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Your game gets a unique shareable link</li>
                <li>• Anyone with the link can play your game</li>
                <li>• Analytics tracking is enabled</li>
                <li>• You can update your game anytime</li>
              </ul>
            </div>

            <Button
              onClick={handlePublish}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground glow-primary"
              disabled={isPublishing || !gameName.trim()}
            >
              {isPublishing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Publishing...
                </>
              ) : (
                <>
                  <Rocket className="w-4 h-4 mr-2" />
                  Publish Game
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4 mt-4">
            <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg space-y-3">
              <div className="flex items-center gap-2 text-primary">
                <Rocket className="w-5 h-5" />
                <span className="font-medium">Game Published Successfully!</span>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Share this link:</Label>
                <div className="flex gap-2">
                  <Input
                    value={publishedUrl}
                    readOnly
                    className="bg-surface-2 border-surface-3 font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={copyToClipboard}
                    className="border-surface-3 hover:bg-surface-2"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 border-surface-3 hover:bg-surface-2"
                onClick={() => window.open(publishedUrl, '_blank')}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Open Game
              </Button>
              <Button
                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                onClick={onClose}
              >
                Done
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
