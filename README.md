<p align="center">
  <h1 align="center">Netflix AI Search</h1>
</p>

<p align="center">
  <strong>AI-powered natural language search for Netflix. Chrome extension + backend.</strong>
</p>

<p align="center">
  <a href="#quick-start">Quick Start</a> •
  <a href="#features">Features</a> •
  <a href="#search-examples">Examples</a> •
  <a href="#architecture">Architecture</a>
</p>

<p align="center">
  <a href="https://github.com/RoyNativ-AI/netflix-ai/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue?style=flat-square" alt="License"></a>
</p>

---

## The Problem

Netflix's built-in search is limited:
- **Can't search by scene descriptions** - "movies with car chase scenes"
- **Can't combine criteria easily** - "Korean thriller from 2020"
- **No natural language** - have to know exact titles or actors

## The Solution

AI-powered search that understands what you're looking for:

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   "Dark psychological thriller    ──────►   Results:           │
│    with a twist ending"                     - Gone Girl        │
│                                             - Shutter Island   │
│                                             - The Prestige     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Quick Start

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
# Add your OpenAI API key to .env
npm start
```

Server runs on `http://localhost:3456`

### 2. Chrome Extension

1. Go to `chrome://extensions/`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select the `extension` folder

### 3. Use It

1. Open [netflix.com/browse](https://www.netflix.com/browse)
2. Click the **AI Search** button in the header
3. Type your query in natural language
4. Click results to navigate

---

## Features

| Feature | Example |
|---------|---------|
| **Actor search** | "Movies with Leonardo DiCaprio" |
| **Genre + origin** | "Korean horror series" |
| **Year filter** | "Action comedy from 2022" |
| **Theme-based** | "Heist movies like Money Heist" |
| **Mood + genre** | "Dark psychological thrillers" |
| **Scene description** | "Action movies with car chase scenes" |

---

## Search Examples

```
"Movies with Tom Hanks"
→ Searches by actor

"Korean horror series"
→ Genre + country of origin

"Romantic comedy 2020"
→ Genre + release year

"Heist movies like Money Heist"
→ Finds similar themes

"Dark psychological thrillers with twist endings"
→ Mood + genre + plot elements
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  Chrome Extension                                               │
│  ├── content.js     Injects AI search into Netflix UI          │
│  ├── popup.html     Extension settings (API key config)        │
│  └── background.js  Service worker                              │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTP
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  Backend (Node.js + Express)                                    │
│  ├── OpenAI         Query parsing & understanding               │
│  └── Netflix API    Catalog search                              │
└─────────────────────────────────────────────────────────────────┘
```

---

## Project Structure

```
netflix-ai/
├── extension/              # Chrome extension
│   ├── manifest.json
│   ├── content.js          # Netflix page injection
│   ├── popup.html          # Settings popup
│   ├── popup.js
│   ├── background.js
│   ├── styles.css
│   └── icons/
│
└── backend/                # API server
    ├── package.json
    ├── .env.example
    └── src/
        ├── index.js        # Express server
        └── netflix.js      # Netflix catalog logic
```

---

## Configuration

### API Key

Set in one of two ways:

1. **Environment variable**:
   ```bash
   OPENAI_API_KEY=sk-... npm start
   ```

2. **Extension popup**: Click the extension icon and enter your key

---

## Roadmap

- [x] Natural language search
- [x] Chrome extension integration
- [ ] Direct Netflix Shakti API for real-time catalog
- [ ] Semantic search with embeddings
- [ ] Scene description matching
- [ ] Watch history integration
- [ ] Multi-language support

---

## License

MIT - See [LICENSE](LICENSE)

---

<p align="center">
  <strong>Search Netflix the way you think.</strong>
</p>
