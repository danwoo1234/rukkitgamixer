import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ArrowLeft, Play, Edit, Trash2, Globe, Lock, Loader2 } from 'lucide-react';

interface MyMap {
  id: string;
  name: string;
  width: number;
  height: number;
  is_public: boolean;
  play_count: number;
  likes: number;
  created_at: string;
}

const MyMaps = () => {
  const navigate = useNavigate();
  const [maps, setMaps] = useState<MyMap[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please login to view your maps');
        navigate('/auth');
        return;
      }
      setUserId(session.user.id);
      fetchMaps(session.user.id);
    };
    checkAuth();
  }, [navigate]);

  const fetchMaps = async (uid: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('game_maps')
      .select('id, name, width, height, is_public, play_count, likes, created_at')
      .eq('user_id', uid)
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to load maps');
    } else {
      setMaps(data || []);
    }
    setLoading(false);
  };

  const handleTogglePublic = async (mapId: string, isPublic: boolean) => {
    const { error } = await supabase
      .from('game_maps')
      .update({ is_public: !isPublic })
      .eq('id', mapId);

    if (error) {
      toast.error('Failed to update visibility');
    } else {
      setMaps(maps.map(m => m.id === mapId ? { ...m, is_public: !isPublic } : m));
      toast.success(isPublic ? 'Map is now private' : 'Map is now public!');
    }
  };

  const handleDelete = async (mapId: string) => {
    if (!confirm('Are you sure you want to delete this map?')) return;
    
    const { error } = await supabase.from('game_maps').delete().eq('id', mapId);
    if (error) {
      toast.error('Failed to delete');
    } else {
      setMaps(maps.filter(m => m.id !== mapId));
      toast.success('Map deleted');
    }
  };

  const handlePlay = (mapId: string) => {
    navigate(`/?play=${mapId}`);
  };

  const handleEdit = async (mapId: string) => {
    const { data } = await supabase
      .from('game_maps')
      .select('map_data')
      .eq('id', mapId)
      .single();
    
    if (data?.map_data) {
      localStorage.setItem('rukkit_map', JSON.stringify(data.map_data));
      navigate('/');
      toast.success('Map loaded for editing');
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-3xl font-bold text-foreground">My Maps</h1>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : maps.length === 0 ? (
          <Card className="bg-surface border-surface-2">
            <CardContent className="py-16 text-center">
              <p className="text-muted-foreground mb-4">You haven't created any maps yet</p>
              <Button onClick={() => navigate('/')}>Create Your First Map</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {maps.map(map => (
              <Card key={map.id} className="bg-surface border-surface-2 hover:border-primary/50 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-foreground text-lg">{map.name}</CardTitle>
                      <CardDescription className="text-muted-foreground">
                        {map.width}×{map.height} tiles
                      </CardDescription>
                    </div>
                    {map.is_public ? (
                      <Globe className="w-5 h-5 text-primary" />
                    ) : (
                      <Lock className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                    <span>▶ {map.play_count} plays</span>
                    <span>❤ {map.likes} likes</span>
                  </div>
                  
                  <div className="flex items-center justify-between mb-4">
                    <Label htmlFor={`public-${map.id}`} className="text-sm text-foreground">
                      Make Public
                    </Label>
                    <Switch
                      id={`public-${map.id}`}
                      checked={map.is_public}
                      onCheckedChange={() => handleTogglePublic(map.id, map.is_public)}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button size="sm" variant="default" onClick={() => handlePlay(map.id)} className="flex-1">
                      <Play className="w-4 h-4 mr-1" /> Play
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => handleEdit(map.id)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(map.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyMaps;