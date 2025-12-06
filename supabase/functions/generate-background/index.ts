import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const systemPrompt = `You are a game background designer. Generate parallax background layer configurations as JSON.

Background structure:
- name: Theme name
- layers: Array of parallax layers (back to front)

Each layer has:
- depth: 0.0 (far) to 1.0 (close) - affects parallax speed
- color: Base color (hex)
- gradient: Optional gradient end color (hex)
- elements: Array of decorative elements

Element types:
- "mountain": Mountain silhouette
- "cloud": Floating cloud
- "tree": Tree silhouette
- "star": Twinkling star
- "building": City building
- "wave": Water wave
- "moon": Moon/sun

Each element has:
- type: Element type
- count: How many to generate
- minSize/maxSize: Size range
- y: Vertical position (0-100%)

Return ONLY valid JSON:
{
  "name": "Sunset Mountains",
  "layers": [
    {
      "depth": 0.1,
      "color": "#1a1a2e",
      "gradient": "#16213e",
      "elements": [
        { "type": "star", "count": 50, "minSize": 1, "maxSize": 3, "y": 20 }
      ]
    },
    {
      "depth": 0.3,
      "color": "#2d4a3e",
      "elements": [
        { "type": "mountain", "count": 3, "minSize": 150, "maxSize": 250, "y": 60 }
      ]
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

    console.log('Generating background with prompt:', prompt);

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
          { role: 'user', content: `Create a game background: "${prompt}"` }
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

    const bgData = JSON.parse(jsonMatch[0]);

    return new Response(JSON.stringify(bgData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error generating background:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
