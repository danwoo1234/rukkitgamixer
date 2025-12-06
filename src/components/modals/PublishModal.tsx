import React, { useState, useEffect } from 'react';
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
import { Copy, Loader2, Rocket, ExternalLink, RefreshCw, Link } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { GameMap } from '@/types/editor';
import { User } from '@supabase/supabase-js';

interface PublishModalProps {
  isOpen: boolean;
  onClose: () => void;
  mapName: string;
  map: GameMap;
  user: User | null;
  existingMapId?: string | null;
}

export const PublishModal: React.FC<PublishModalProps> = ({ 
  isOpen, 
  onClose, 
  mapName, 
  map, 
  user,
  existingMapId 
}) => {
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishedUrl, setPublishedUrl] = useState<string | null>(null);
  const [gameName, setGameName] = useState(mapName);
  const [customSlug, setCustomSlug] = useState('');
  const [isUpdate, setIsUpdate] = useState(false);
  const [existingSlug, setExistingSlug] = useState<string | null>(null);

  useEffect(() => {
    setGameName(mapName);
    setPublishedUrl(null);
    setIsUpdate(!!existingMapId);
    
    // Load existing slug if updating
    if (existingMapId) {
      loadExistingMap();
    } else {
      setCustomSlug('');
      setExistingSlug(null);
    }
  }, [isOpen, mapName, existingMapId]);

  const loadExistingMap = async () => {
    if (!existingMapId) return;
    
    const { data } = await supabase
      .from('game_maps')
      .select('slug, name')
      .eq('id', existingMapId)
      .maybeSingle();
    
    if (data) {
      setExistingSlug(data.slug);
      setCustomSlug(data.slug || '');
      setGameName(data.name);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 50);
  };

  const handlePublish = async () => {
    if (!user) {
      toast.error('Please login to publish your game');
      return;
    }

    setIsPublishing(true);

    try {
      const slug = customSlug.trim() || generateSlug(gameName);
      
      // Check if slug is already taken (only for new games or changed slugs)
      if (!isUpdate || (existingSlug !== slug)) {
        const { data: existingSlugData } = await supabase
          .from('game_maps')
          .select('id')
          .eq('slug', slug)
          .neq('id', existingMapId || '')
          .maybeSingle();
        
        if (existingSlugData) {
          toast.error('This URL slug is already taken. Please choose a different one.');
          setIsPublishing(false);
          return;
        }
      }

      const mapData = {
        name: gameName,
        user_id: user.id,
        width: map.width,
        height: map.height,
        tile_size: map.tileSize,
        map_data: JSON.parse(JSON.stringify(map)),
        is_public: true,
        slug: slug,
        updated_at: new Date().toISOString(),
      };

      let resultId: string;

      if (isUpdate && existingMapId) {
        // Update existing map
        const { data, error } = await supabase
          .from('game_maps')
          .update(mapData)
          .eq('id', existingMapId)
          .eq('user_id', user.id)
          .select()
          .single();

        if (error) throw error;
        resultId = data.id;
        
        toast.success('Game Updated!', {
          description: 'Your changes are now live.',
        });
      } else {
        // Create new map
        const { data, error } = await supabase
          .from('game_maps')
          .insert([mapData])
          .select()
          .single();

        if (error) throw error;
        resultId = data.id;
        
        toast.success('Game Published!', {
          description: 'Your game is now live and ready to share.',
        });
      }

      // Use slug if available, otherwise use ID
      const urlParam = slug || resultId;
      const url = `${window.location.origin}?play=${urlParam}`;
      setPublishedUrl(url);
      
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
            {isUpdate ? 'Update Your Game' : 'Publish Your Game'}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {isUpdate 
              ? 'Update your published game with the latest changes'
              : 'Deploy your game and share it with the world'
            }
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

            <div className="space-y-2">
              <Label htmlFor="custom-slug" className="flex items-center gap-2">
                <Link className="w-4 h-4" />
                Custom URL (optional)
              </Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground whitespace-nowrap">
                  {window.location.origin}?play=
                </span>
                <Input
                  id="custom-slug"
                  value={customSlug}
                  onChange={(e) => setCustomSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  className="bg-surface-2 border-surface-3"
                  placeholder={generateSlug(gameName) || 'my-game'}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Only lowercase letters, numbers, and hyphens allowed
              </p>
            </div>

            <div className="p-4 bg-surface-2 rounded-lg space-y-2">
              <h4 className="font-medium text-sm">
                {isUpdate ? 'What happens when you update:' : 'What happens when you publish:'}
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                {isUpdate ? (
                  <>
                    <li>• Your existing link keeps working</li>
                    <li>• Changes are applied immediately</li>
                    <li>• Play count and likes are preserved</li>
                  </>
                ) : (
                  <>
                    <li>• Your game gets a unique shareable link</li>
                    <li>• Anyone with the link can play your game</li>
                    <li>• Analytics tracking is enabled</li>
                    <li>• You can update your game anytime</li>
                  </>
                )}
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
                  {isUpdate ? 'Updating...' : 'Publishing...'}
                </>
              ) : (
                <>
                  {isUpdate ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Update Game
                    </>
                  ) : (
                    <>
                      <Rocket className="w-4 h-4 mr-2" />
                      Publish Game
                    </>
                  )}
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4 mt-4">
            <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg space-y-3">
              <div className="flex items-center gap-2 text-primary">
                <Rocket className="w-5 h-5" />
                <span className="font-medium">
                  {isUpdate ? 'Game Updated Successfully!' : 'Game Published Successfully!'}
                </span>
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