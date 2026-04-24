import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
}

Deno.serve(async (req) => {
  console.log(`Request received: ${req.method} ${req.url}`)

  // CORS handling for preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      status: 200, 
      headers: corsHeaders 
    })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  const NEWS_API_KEY = Deno.env.get('NEWS_API_KEY')
  if (!NEWS_API_KEY) {
    return new Response(JSON.stringify({ error: 'Missing NEWS_API_KEY' }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })
  }

  try {
    // 1. Get active keywords
    const { data: keywords } = await supabase
      .from('monitoring_keywords')
      .select('term')
      .eq('is_active', true)

    if (!keywords || keywords.length === 0) {
      return new Response(JSON.stringify({ message: 'No active keywords' }), { status: 200 })
    }

    let totalAdded = 0;

    // 2. Fetch news for each keyword
    for (const { term } of keywords) {
      console.log(`Fetching news for: ${term}`)
      // Search for Indonesian news
      const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(term)}&language=id&sortBy=publishedAt&pageSize=10&apiKey=${NEWS_API_KEY}`
      const response = await fetch(url)
      const data = await response.json()

      if (data.articles && Array.isArray(data.articles)) {
        for (const article of data.articles) {
          // Check if already exists to avoid duplicates
          const { data: existing } = await supabase
            .from('media_monitoring')
            .select('id')
            .eq('url', article.url)
            .maybeSingle()

          if (!existing) {
            // Very simple sentiment detection for now
            let sentiment = 'neutral'
            const lowerTitle = article.title.toLowerCase()
            if (lowerTitle.includes('sukses') || lowerTitle.includes('menang') || lowerTitle.includes('apresiasi')) sentiment = 'positive'
            if (lowerTitle.includes('gagal') || lowerTitle.includes('tolak') || lowerTitle.includes('korupsi')) sentiment = 'negative'

            const { error: insertError } = await supabase.from('media_monitoring').insert({
              title: article.title,
              source: 'online',
              media_name: article.source.name,
              url: article.url,
              content: article.description || article.content || '',
              sentiment: sentiment,
              priority: sentiment === 'negative' ? 'high' : 'medium',
              reported_at: article.publishedAt,
              category: 'Automated'
            })
            
            if (!insertError) totalAdded++;
          }
        }
      }
    }

    return new Response(JSON.stringify({ 
      message: `Success! Added ${totalAdded} new items.`,
      count: totalAdded 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
