import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const systemPrompt = `You are a game level designer. Generate 2D platformer levels as JSON.

Tile types:
0 = Empty (air)
1 = Ground (solid platform)
2 = Wall (solid wall)
3 = Water (visual, not solid)
4 = Spike (hazard)
5 = Lava (hazard)

Entity types (place these strategically):
- player: The player spawn point (required, only one)
- slime: Ground enemy that patrols
- bat: Flying enemy
- coin: Collectible
- door: Locked door (needs lever)
- lever: Opens doors
- portal: Level exit (required, place at end)
- start: Start point marker
- end: End point marker

Return ONLY valid JSON with this structure:
{
  "tiles": [[0,1,1,...], ...],
  "entities": [
    {"type": "player", "x": 2, "y": 16},
    {"type": "portal", "x": 27, "y": 10},
    ...
  ]
}

Make levels fun with:
- Clear path from start to end
- Platforms at varying heights
- Hazards requiring skill to avoid
- Collectibles to reward exploration
- At least one puzzle element (lever/door)`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, width = 30, height = 20 } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const userPrompt = `Generate a ${width}x${height} platformer level based on: "${prompt}"`;

    console.log('Generating map with prompt:', userPrompt);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded, please try again later' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits exhausted' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error('AI gateway error');
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    console.log('AI response:', content);

    // Parse JSON from response
    const jsonMatch = content?.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON in response');
    }

    const mapData = JSON.parse(jsonMatch[0]);

    return new Response(JSON.stringify(mapData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error generating map:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
