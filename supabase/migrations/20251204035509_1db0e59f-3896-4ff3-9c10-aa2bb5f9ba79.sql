-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (new.id, new.raw_user_meta_data ->> 'username');
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create game_maps table
CREATE TABLE public.game_maps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL DEFAULT 'Untitled Map',
  width INTEGER NOT NULL DEFAULT 30,
  height INTEGER NOT NULL DEFAULT 20,
  tile_size INTEGER NOT NULL DEFAULT 32,
  map_data JSONB NOT NULL,
  is_public BOOLEAN DEFAULT FALSE,
  play_count INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.game_maps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own maps"
  ON public.game_maps FOR SELECT
  USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "Users can insert own maps"
  ON public.game_maps FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own maps"
  ON public.game_maps FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own maps"
  ON public.game_maps FOR DELETE
  USING (auth.uid() = user_id);

-- Create map_likes table for tracking likes
CREATE TABLE public.map_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  map_id UUID REFERENCES public.game_maps(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(map_id, user_id)
);

ALTER TABLE public.map_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view likes"
  ON public.map_likes FOR SELECT
  USING (true);

CREATE POLICY "Users can like maps"
  ON public.map_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike maps"
  ON public.map_likes FOR DELETE
  USING (auth.uid() = user_id);

-- Function to increment play count
CREATE OR REPLACE FUNCTION public.increment_play_count(map_uuid UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  UPDATE public.game_maps
  SET play_count = play_count + 1
  WHERE id = map_uuid;
END;
$$;

-- Function to update likes count
CREATE OR REPLACE FUNCTION public.update_likes_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.game_maps SET likes = likes + 1 WHERE id = NEW.map_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.game_maps SET likes = likes - 1 WHERE id = OLD.map_id;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER on_like_change
  AFTER INSERT OR DELETE ON public.map_likes
  FOR EACH ROW EXECUTE FUNCTION public.update_likes_count();