-- Add custom slug column to game_maps table
ALTER TABLE public.game_maps 
ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

-- Create index for faster slug lookups
CREATE INDEX IF NOT EXISTS idx_game_maps_slug ON public.game_maps(slug);