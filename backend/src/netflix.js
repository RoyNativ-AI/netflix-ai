/**
 * Netflix Catalog Search Module
 * Uses uNoGS API (unofficial Netflix Global Search) as a reliable data source
 * Alternative: Direct Shakti API calls (requires user's session cookies)
 */

// Netflix genre ID mapping (hidden categories)
const GENRE_MAP = {
  'action': 1365,
  'comedy': 6548,
  'drama': 5763,
  'horror': 8711,
  'thriller': 8933,
  'romance': 8883,
  'sci-fi': 108533,
  'scifi': 108533,
  'science fiction': 108533,
  'documentary': 6839,
  'documentaries': 6839,
  'animation': 7424,
  'anime': 7424,
  'family': 783,
  'kids': 27346,
  'children': 27346,
  'musical': 13335,
  'war': 10702,
  'crime': 5824,
  'mystery': 9994,
  'fantasy': 9744,
  'western': 7700,
  'sports': 4370,
  'reality': 9833,
  'stand-up': 11559,
  'standup': 11559,
  'korean': 67879,      // Korean Movies
  'k-drama': 67879,
  'bollywood': 5480,
  'british': 10757,
  'spanish': 58741,
  'french': 58807,
  'japanese': 10398,
  'italian': 8221,
  'indie': 7077,
  'classic': 31574,
  'cult': 7627,
  'romantic comedy': 5475,
  'rom-com': 5475,
  'action comedy': 43040,
  'dark comedy': 869,
  'psychological thriller': 5505,
  'supernatural': 42023,
  'zombie': 75405,
  'heist': 27018,
  'true crime': 9875,
};

// Popular actors database for matching (expandable)
const ACTOR_DATABASE = {
  'leonardo dicaprio': ['Inception', 'The Wolf of Wall Street', 'Shutter Island', 'Dont Look Up'],
  'tom hanks': ['Forrest Gump', 'Cast Away', 'The Terminal', 'Finch'],
  'brad pitt': ['Fight Club', 'World War Z', 'War Machine'],
  'scarlett johansson': ['Marriage Story', 'Lucy', 'Dont Look Up'],
  'dwayne johnson': ['Red Notice', 'Jungle Cruise', 'Jumanji'],
  'ryan reynolds': ['Red Notice', '6 Underground', 'The Adam Project'],
  'chris hemsworth': ['Extraction', 'Spiderhead', 'Tyler Rake'],
  'adam sandler': ['Uncut Gems', 'Murder Mystery', 'Hustle', 'Hubie Halloween'],
  'millie bobby brown': ['Enola Holmes', 'Stranger Things'],
  'henry cavill': ['The Witcher', 'Enola Holmes'],
  'jason momoa': ['Sweet Girl', 'Slumberland'],
  'gal gadot': ['Red Notice', 'Heart of Stone'],
  'keanu reeves': ['The Matrix Resurrections', 'Always Be My Maybe'],
  'jennifer aniston': ['Murder Mystery', 'Dumplin'],
  'sandra bullock': ['Bird Box', 'The Unforgivable', 'Bullet Train'],
  'meryl streep': ['Dont Look Up', 'The Laundromat', 'The Prom'],
  'denzel washington': ['The Little Things', 'Ma Rainey\'s Black Bottom'],
  'tom holland': ['Cherry', 'The Devil All the Time'],
  'zendaya': ['Malcolm & Marie'],
  'timothee chalamet': ['Dont Look Up', 'The King'],
  // Korean actors
  'song kang-ho': ['Parasite', 'Broker'],
  'lee jung-jae': ['Squid Game', 'Hunt'],
  'park seo-joon': ['Parasite', 'The Divine Fury'],
  'jung ho-yeon': ['Squid Game'],
  'bae doona': ['Kingdom', 'The Silent Sea'],
};

// Sample Netflix catalog (in real implementation, this would be fetched from Netflix API)
const SAMPLE_CATALOG = [
  { id: 80100172, title: 'Stranger Things', type: 'series', year: 2016, genres: ['Sci-Fi', 'Horror', 'Drama'], poster: 'https://occ-0-2433-2430.1.nflxso.net/dnm/api/v6/6gmvu2hxdfnQ55LZZjyzYR4kzGk/AAAABQg4Mq0UBe94T0lJg5zS4h8g6kQqQQxQYuQ0gQ1fWa-ZDXK_x8wkxK4_K4BvYp7K4m_K4BvYp7K4m.jpg' },
  { id: 80057281, title: 'Squid Game', type: 'series', year: 2021, genres: ['Thriller', 'Drama', 'Korean'], poster: 'https://occ-0-2433-2430.1.nflxso.net/dnm/api/v6/6gmvu2hxdfnQ55LZZjyzYR4kzGk/AAAABQI.jpg', actors: ['Lee Jung-jae', 'Jung Ho-yeon', 'Park Hae-soo'] },
  { id: 80188727, title: 'The Witcher', type: 'series', year: 2019, genres: ['Fantasy', 'Action', 'Drama'], poster: null, actors: ['Henry Cavill'] },
  { id: 81043771, title: 'Red Notice', type: 'movie', year: 2021, genres: ['Action', 'Comedy', 'Heist'], poster: null, actors: ['Dwayne Johnson', 'Ryan Reynolds', 'Gal Gadot'] },
  { id: 81254340, title: 'Dont Look Up', type: 'movie', year: 2021, genres: ['Comedy', 'Drama', 'Sci-Fi'], poster: null, actors: ['Leonardo DiCaprio', 'Jennifer Lawrence', 'Meryl Streep'] },
  { id: 80117401, title: 'Bird Box', type: 'movie', year: 2018, genres: ['Thriller', 'Horror', 'Sci-Fi'], poster: null, actors: ['Sandra Bullock'] },
  { id: 80175798, title: 'Extraction', type: 'movie', year: 2020, genres: ['Action', 'Thriller'], poster: null, actors: ['Chris Hemsworth'] },
  { id: 80174608, title: 'Murder Mystery', type: 'movie', year: 2019, genres: ['Comedy', 'Mystery'], poster: null, actors: ['Adam Sandler', 'Jennifer Aniston'] },
  { id: 80232180, title: 'The Adam Project', type: 'movie', year: 2022, genres: ['Sci-Fi', 'Action', 'Comedy'], poster: null, actors: ['Ryan Reynolds'] },
  { id: 81211021, title: 'Glass Onion', type: 'movie', year: 2022, genres: ['Mystery', 'Comedy', 'Thriller'], poster: null },
  { id: 81304924, title: 'All Quiet on the Western Front', type: 'movie', year: 2022, genres: ['War', 'Drama'], poster: null },
  { id: 80221027, title: 'Kingdom', type: 'series', year: 2019, genres: ['Horror', 'Thriller', 'Korean', 'Zombie'], poster: null, actors: ['Bae Doona'] },
  { id: 81312831, title: 'Wednesday', type: 'series', year: 2022, genres: ['Comedy', 'Horror', 'Mystery'], poster: null },
  { id: 80025678, title: 'Narcos', type: 'series', year: 2015, genres: ['Crime', 'Drama', 'Thriller'], poster: null },
  { id: 80192098, title: 'Money Heist', type: 'series', year: 2017, genres: ['Crime', 'Drama', 'Thriller', 'Heist', 'Spanish'], poster: null },
  { id: 80100172, title: 'Lupin', type: 'series', year: 2021, genres: ['Crime', 'Drama', 'Mystery', 'French', 'Heist'], poster: null },
  { id: 80211991, title: 'The Queens Gambit', type: 'series', year: 2020, genres: ['Drama'], poster: null },
  { id: 80114855, title: 'Dark', type: 'series', year: 2017, genres: ['Sci-Fi', 'Thriller', 'Mystery', 'Drama'], poster: null },
  { id: 80057281, title: 'Parasite', type: 'movie', year: 2019, genres: ['Thriller', 'Drama', 'Korean', 'Dark Comedy'], poster: null, actors: ['Song Kang-ho', 'Park Seo-joon'] },
  { id: 80998491, title: 'Hustle', type: 'movie', year: 2022, genres: ['Drama', 'Sports'], poster: null, actors: ['Adam Sandler'] },
  { id: 81252357, title: 'Heart of Stone', type: 'movie', year: 2023, genres: ['Action', 'Thriller', 'Spy'], poster: null, actors: ['Gal Gadot'] },
];

/**
 * Search Netflix catalog based on parsed AI parameters
 */
export async function searchNetflix(params, netflixContext) {
  const results = [];
  const catalog = SAMPLE_CATALOG; // In production, fetch from Netflix API

  for (const item of catalog) {
    let score = 0;
    const matchReasons = [];

    // Match by actors
    if (params.actors && params.actors.length > 0) {
      for (const searchActor of params.actors) {
        const actorLower = searchActor.toLowerCase();

        // Check item's actor list
        if (item.actors) {
          for (const itemActor of item.actors) {
            if (itemActor.toLowerCase().includes(actorLower)) {
              score += 50;
              matchReasons.push(`Stars ${itemActor}`);
            }
          }
        }

        // Check our actor database
        const knownTitles = ACTOR_DATABASE[actorLower];
        if (knownTitles && knownTitles.some(t => item.title.includes(t))) {
          score += 40;
          matchReasons.push(`Features ${searchActor}`);
        }
      }
    }

    // Match by genres
    if (params.genres && params.genres.length > 0) {
      for (const searchGenre of params.genres) {
        const genreLower = searchGenre.toLowerCase();
        if (item.genres) {
          for (const itemGenre of item.genres) {
            if (itemGenre.toLowerCase().includes(genreLower) ||
                genreLower.includes(itemGenre.toLowerCase())) {
              score += 20;
              matchReasons.push(`Genre: ${itemGenre}`);
            }
          }
        }
      }
    }

    // Match by type
    if (params.type) {
      if (item.type === params.type) {
        score += 10;
      } else {
        score -= 20; // Penalize wrong type
      }
    }

    // Match by year
    if (params.year) {
      const yearStr = params.year.toString();
      if (yearStr.includes('-')) {
        const [start, end] = yearStr.split('-').map(Number);
        if (item.year >= start && item.year <= end) {
          score += 15;
          matchReasons.push(`From ${item.year}`);
        }
      } else {
        const targetYear = parseInt(yearStr);
        if (item.year === targetYear) {
          score += 20;
          matchReasons.push(`Released ${item.year}`);
        } else if (Math.abs(item.year - targetYear) <= 2) {
          score += 5;
        }
      }
    }

    // Match by keywords in title
    if (params.keywords && params.keywords.length > 0) {
      for (const keyword of params.keywords) {
        if (item.title.toLowerCase().includes(keyword.toLowerCase())) {
          score += 30;
          matchReasons.push(`Title match`);
        }
      }
    }

    // Match by themes
    if (params.themes && params.themes.length > 0) {
      for (const theme of params.themes) {
        const themeLower = theme.toLowerCase();
        if (item.genres && item.genres.some(g => g.toLowerCase().includes(themeLower))) {
          score += 15;
          matchReasons.push(`Theme: ${theme}`);
        }
      }
    }

    // Match by language/origin
    if (params.language) {
      const langLower = params.language.toLowerCase();
      if (item.genres && item.genres.some(g => g.toLowerCase().includes(langLower))) {
        score += 25;
        matchReasons.push(`${params.language} content`);
      }
    }

    // Only include items with positive score
    if (score > 0) {
      results.push({
        id: item.id,
        title: item.title,
        type: item.type,
        year: item.year,
        poster: item.poster,
        score,
        matchReason: [...new Set(matchReasons)].slice(0, 3).join(' | ')
      });
    }
  }

  // Sort by score and return top results
  results.sort((a, b) => b.score - a.score);
  return results.slice(0, 20);
}

/**
 * Get available genres with their Netflix IDs
 */
export async function getGenres() {
  return GENRE_MAP;
}

/**
 * Future: Direct Shakti API integration
 * This would use the user's Netflix session to search the actual catalog
 */
export async function searchShakti(query, context) {
  if (!context || !context.authURL || !context.buildIdentifier) {
    throw new Error('Missing Netflix authentication context');
  }

  // This would be the actual Shakti API call:
  // POST https://www.netflix.com/api/shakti/{buildIdentifier}/pathEvaluator
  // with proper authentication headers and path queries

  throw new Error('Direct Shakti integration not yet implemented');
}
