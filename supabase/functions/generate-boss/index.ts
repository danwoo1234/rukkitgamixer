import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const systemPrompt = `You are a game boss designer. Generate boss enemy configurations as JSON.

Boss structure:
- name: Boss name
- health: Total HP (100-1000)
- size: { width, height } in tiles
- color: Primary color (hex)
- patterns: Array of attack patterns

Attack pattern types:
- "charge": Rush toward player
- "jump": Jump attack
- "projectile": Shoot projectiles
- "slam": Ground slam (AoE)
- "summon": Spawn minions
- "breath": Breath attack (cone)

Each pattern has:
- type: Pattern type
- damage: Damage dealt (10-50)
- duration: Attack duration in ms
- cooldown: Time between uses in ms
- description: What happens visually

Return ONLY valid JSON:
{
  "name": "Boss Name",
  "health": 500,
  "size": { "width": 3, "height": 3 },
  "color": "#FF4444",
  "patterns": [
    {
      "type": "charge",
      "damage": 20,
      "duration": 1000,
      "cooldown": 3000,
      "description": "Charges at player"
    }
  ]
}`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Generating boss with prompt:', prompt);

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
          { role: 'user', content: `Create a boss enemy: "${prompt}"` }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
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

    const jsonMatch = content?.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON in response');
    }

    const bossData = JSON.parse(jsonMatch[0]);

    return new Response(JSON.stringify(bossData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error generating boss:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
