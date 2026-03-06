import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';

const app = express();
const PORT = process.env.PORT || 3456;

let config = {
  openaiApiKey: process.env.OPENAI_API_KEY || null
};

app.use(cors());
app.use(express.json({ limit: '5mb' }));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', hasApiKey: !!config.openaiApiKey });
});

app.post('/api/config', (req, res) => {
  const { openaiApiKey } = req.body;
  if (openaiApiKey) {
    config.openaiApiKey = openaiApiKey;
    res.json({ success: true });
  } else {
    res.status(400).json({ error: 'Missing API key' });
  }
});

// Smart search - translates natural language to Netflix searches
app.post('/api/smart-search', async (req, res) => {
  try {
    const { query, availableTitles } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Missing query' });
    }

    if (!config.openaiApiKey) {
      return res.status(400).json({ error: 'OpenAI API key not configured. Click extension icon to set it.' });
    }

    console.log(`Smart search: "${query}"`);

    const openai = new OpenAI({ apiKey: config.openaiApiKey });

    // Ask AI to understand the query and suggest search terms
    const systemPrompt = `You are a Netflix search assistant. The user will describe what they want to watch in natural language (any language).

Your job is to:
1. Understand what they're looking for (genre, actor, similar show, mood, theme, etc.)
2. Suggest specific Netflix search terms that will help find it
3. If they ask for "shows like X" or "movies like X", suggest similar titles and relevant search terms

Respond with JSON only:
{
  "searchTerms": ["term1", "term2", "term3", "term4", "term5"],
  "explanation": "Brief explanation in the user's language",
  "suggestedTitles": ["Title 1", "Title 2", "Title 3"]
}

searchTerms: English search terms to use in Netflix search (actors, genres, show names)
explanation: What you understood they want (in their language)
suggestedTitles: Specific movie/show names that match their request

Examples:
- "סרטי גלישה" → searchTerms: ["surfing", "surf", "Point Break", "Blue Crush", "beach"]
- "series like Silicon Valley" → searchTerms: ["startup", "tech comedy", "The Playlist", "WeCrashed", "Halt and Catch Fire"]
- "scary Korean movies" → searchTerms: ["Korean horror", "Train to Busan", "The Wailing", "Korean thriller"]`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: query }
      ],
      temperature: 0.7,
      max_tokens: 500
    });

    const content = response.choices[0].message.content.trim();
    console.log('AI response:', content);

    let aiResult = { searchTerms: [], explanation: '', suggestedTitles: [] };
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        aiResult = JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.error('Failed to parse AI response:', e);
    }

    // Match against available titles on page
    const matchedTitles = [];
    if (availableTitles && availableTitles.length > 0) {
      const searchLower = [
        ...aiResult.searchTerms,
        ...aiResult.suggestedTitles,
        query
      ].map(s => s.toLowerCase());

      availableTitles.forEach(title => {
        const titleLower = title.title.toLowerCase();
        for (const term of searchLower) {
          if (titleLower.includes(term) || term.includes(titleLower)) {
            matchedTitles.push({
              ...title,
              matchReason: `Matches: ${term}`
            });
            break;
          }
        }
      });
    }

    res.json({
      query,
      searchTerms: aiResult.searchTerms || [],
      explanation: aiResult.explanation || '',
      suggestedTitles: aiResult.suggestedTitles || [],
      results: matchedTitles.slice(0, 10)
    });

  } catch (error) {
    console.error('Smart search error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Original search endpoint (for backwards compatibility)
app.post('/api/search', async (req, res) => {
  try {
    const { query, titles } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Missing query' });
    }

    if (!config.openaiApiKey) {
      return res.status(400).json({ error: 'OpenAI API key not configured.' });
    }

    if (!titles || titles.length === 0) {
      return res.status(400).json({ error: 'No titles found on page.' });
    }

    console.log(`Searching "${query}" in ${titles.length} titles`);

    const openai = new OpenAI({ apiKey: config.openaiApiKey });
    const titleList = titles.map((t, i) => `${i}: ${t.title}`).join('\n');

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a Netflix search assistant. Find titles matching the user's query.
Return ONLY a JSON array of matching indices, e.g. [5, 12, 3]. Max 15 results.`
        },
        { role: 'user', content: `Query: "${query}"\n\nTitles:\n${titleList}` }
      ],
      temperature: 0.3,
      max_tokens: 200
    });

    const content = response.choices[0].message.content.trim();
    let matchingIndices = [];
    try {
      const jsonMatch = content.match(/\[[\d,\s]*\]/);
      if (jsonMatch) {
        matchingIndices = JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.error('Failed to parse:', e);
    }

    const results = matchingIndices
      .filter(i => i >= 0 && i < titles.length)
      .map(i => ({ ...titles[i], matchReason: 'AI match' }));

    res.json({ query, results });

  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Netflix AI Search backend running on http://localhost:${PORT}`);
  if (!config.openaiApiKey) {
    console.log('Warning: OPENAI_API_KEY not set.');
  }
});
