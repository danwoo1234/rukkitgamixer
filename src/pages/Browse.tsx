import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Heart, Play, ArrowLeft, Search, User } from 'lucide-react';
import { toast } from 'sonner';

interface SharedMap {
  id: string;
  name: string;
  width: number;
  height: number;
  play_count: number;
  likes: number;
  created_at: string;
  profiles?: { username: string | null };
}

const Browse = () => {
  const navigate = useNavigate();
  const [maps, setMaps] = useState<SharedMap[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [likedMaps, setLikedMaps] = useState<Set<string>>(new Set());

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id ?? null);
      if (session?.user?.id) {
        fetchLikedMaps(session.user.id);
      }
    });
    fetchMaps();
  }, []);

  const fetchMaps = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('game_maps')
      .select('id, name, width, height, play_count, likes, created_at, user_id')
      .eq('is_public', true)
      .order('likes', { ascending: false });

    if (error) {
      console.error('Error fetching maps:', error);
      toast.error('Failed to load maps');
    } else {
      setMaps((data as unknown as SharedMap[]) || []);
    }
    setLoading(false);
  };

  const fetchLikedMaps = async (uid: string) => {
    const { data } = await supabase
      .from('map_likes')
      .select('map_id')
      .eq('user_id', uid);
    
    if (data) {
      setLikedMaps(new Set(data.map(l => l.map_id)));
    }
  };

  const handleLike = async (mapId: string) => {
    if (!userId) {
      toast.error('Please login to like maps');
      return;
    }

    const isLiked = likedMaps.has(mapId);

    if (isLiked) {
      await supabase.from('map_likes').delete().eq('map_id', mapId).eq('user_id', userId);
      setLikedMaps(prev => {
        const next = new Set(prev);
        next.delete(mapId);
        return next;
      });
    } else {
      await supabase.from('map_likes').insert({ map_id: mapId, user_id: userId });
      setLikedMaps(prev => new Set(prev).add(mapId));
    }

    fetchMaps();
  };

  const handlePlay = (mapId: string) => {
    navigate(`/?play=${mapId}`);
  };

  const filteredMaps = maps.filter(m => 
    m.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-surface-2 bg-surface p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold text-foreground">Browse Maps</h1>
          </div>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search maps..."
              className="pl-10 bg-surface-2 border-surface-3"
            />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6">
        {loading ? (
          <div className="text-center text-muted-foreground py-12">Loading maps...</div>
        ) : filteredMaps.length === 0 ? (
          <div className="text-center text-muted-foreground py-12">
            No public maps found. Be the first to share one!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMaps.map((map) => (
              <Card key={map.id} className="bg-surface border-surface-2 hover:border-primary/50 transition-colors">
                <CardHeader>
                  <CardTitle className="text-foreground flex items-center justify-between">
                    <span className="truncate">{map.name}</span>
                    <span className="text-xs text-muted-foreground font-normal">
                      {map.width}x{map.height}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="aspect-video bg-surface-2 rounded-lg flex items-center justify-center mb-3">
                    <div className="text-4xl opacity-50">🎮</div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="w-4 h-4" />
                    <span>{map.profiles?.username || 'Anonymous'}</span>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Play className="w-4 h-4" /> {map.play_count}
                    </span>
                    <button
                      onClick={() => handleLike(map.id)}
                      className={`flex items-center gap-1 transition-colors ${
                        likedMaps.has(map.id) ? 'text-red-500' : 'hover:text-red-500'
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${likedMaps.has(map.id) ? 'fill-current' : ''}`} />
                      {map.likes}
                    </button>
                  </div>
                  <Button size="sm" onClick={() => handlePlay(map.id)}>
                    <Play className="w-4 h-4 mr-1" /> Play
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Browse;
