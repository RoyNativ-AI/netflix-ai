// Netflix AI Search - Content Script
// Smart search with AI-powered suggestions

(function() {
  'use strict';

  const API_URL = 'http://localhost:3456';

  let isInitialized = false;
  let isExpanded = false;

  // Scan visible titles from current page
  function scanPageTitles() {
    const titles = [];
    const seen = new Set();

    document.querySelectorAll('a[href*="/title/"], a[href*="/watch/"]').forEach(linkEl => {
      const href = linkEl.getAttribute('href');
      const match = href?.match(/\/(title|watch)\/(\d+)/);
      if (match) {
        const id = match[2];
        if (!seen.has(id)) {
          seen.add(id);
          const img = linkEl.querySelector('img');
          const titleText = img?.alt || linkEl.getAttribute('aria-label') ||
                           linkEl.querySelector('.fallback-text')?.textContent || '';
          if (titleText && titleText !== 'Unknown') {
            titles.push({
              id,
              title: titleText.trim(),
              poster: img?.src || null
            });
          }
        }
      }
    });

    return titles;
  }

  function createUI() {
    if (document.querySelector('.nf-ai-container')) return;

    const secondaryNav = document.querySelector('.secondary-navigation') ||
                         document.querySelector('[data-uia="secondary-navigation"]');

    if (!secondaryNav) return;

    const container = document.createElement('div');
    container.className = 'nf-ai-container';
    container.innerHTML = `
      <button class="nf-ai-btn">AI</button>
      <div class="nf-ai-search-box">
        <input type="text" class="nf-ai-input" placeholder="series like Silicon Valley..." />
        <button class="nf-ai-close-btn">X</button>
      </div>
      <div class="nf-ai-results-dropdown"></div>
    `;

    secondaryNav.insertBefore(container, secondaryNav.firstChild);

    const btn = container.querySelector('.nf-ai-btn');
    const input = container.querySelector('.nf-ai-input');
    const closeBtn = container.querySelector('.nf-ai-close-btn');
    const resultsDropdown = container.querySelector('.nf-ai-results-dropdown');

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      expandSearch(container, input, resultsDropdown);
    });

    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      collapseSearch(container, resultsDropdown);
    });

    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        performSmartSearch(input.value, resultsDropdown);
      }
    });

    document.addEventListener('click', (e) => {
      if (isExpanded && !container.contains(e.target)) {
        collapseSearch(container, resultsDropdown);
      }
    });

    console.log('[Netflix AI] UI created');
  }

  function expandSearch(container, input, resultsDropdown) {
    isExpanded = true;
    container.classList.add('expanded');
    input.focus();

    resultsDropdown.classList.add('visible');
    resultsDropdown.innerHTML = `
      <div class="nf-ai-hints">
        <div class="nf-ai-hint-title">Try:</div>
        <div class="nf-ai-hint-item" data-query="series like Silicon Valley">series like Silicon Valley</div>
        <div class="nf-ai-hint-item" data-query="surfing movies">surfing movies</div>
        <div class="nf-ai-hint-item" data-query="Korean thriller with plot twist">Korean thriller with plot twist</div>
        <div class="nf-ai-hint-item" data-query="funny movies with Adam Sandler">funny Adam Sandler movies</div>
      </div>
    `;

    resultsDropdown.querySelectorAll('.nf-ai-hint-item').forEach(hint => {
      hint.addEventListener('click', () => {
        input.value = hint.dataset.query;
        performSmartSearch(hint.dataset.query, resultsDropdown);
      });
    });
  }

  function collapseSearch(container, resultsDropdown) {
    isExpanded = false;
    container.classList.remove('expanded');
    resultsDropdown.innerHTML = '';
    resultsDropdown.classList.remove('visible');
  }

  async function performSmartSearch(query, resultsDropdown) {
    if (!query.trim()) return;

    resultsDropdown.classList.add('visible');
    resultsDropdown.innerHTML = `
      <div class="nf-ai-loading">
        <div class="nf-ai-spinner"></div>
        AI is thinking...
      </div>
    `;

    try {
      const pageTitles = scanPageTitles();

      const response = await fetch(`${API_URL}/api/smart-search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          availableTitles: pageTitles
        })
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Search failed');
      }

      const data = await response.json();
      displaySmartResults(data, query, resultsDropdown);

    } catch (error) {
      console.error('[Netflix AI] Search error:', error);
      resultsDropdown.innerHTML = `
        <div class="nf-ai-error">${error.message || 'Connection failed'}</div>
      `;
    }
  }

  function displaySmartResults(data, query, container) {
    let html = '';

    // AI explanation
    if (data.explanation) {
      html += `<div class="nf-ai-explanation">${data.explanation}</div>`;
    }

    // Search suggestions (clickable links to Netflix search)
    if (data.searchTerms && data.searchTerms.length > 0) {
      html += `<div class="nf-ai-search-section">`;
      html += `<div class="nf-ai-section-title">Search Netflix for:</div>`;
      html += `<div class="nf-ai-search-chips">`;
      data.searchTerms.forEach(term => {
        html += `<a class="nf-ai-chip" href="https://www.netflix.com/search?q=${encodeURIComponent(term)}">${term}</a>`;
      });
      html += `</div></div>`;
    }

    // Suggested titles
    if (data.suggestedTitles && data.suggestedTitles.length > 0) {
      html += `<div class="nf-ai-search-section">`;
      html += `<div class="nf-ai-section-title">Recommended titles:</div>`;
      html += `<div class="nf-ai-search-chips">`;
      data.suggestedTitles.forEach(title => {
        html += `<a class="nf-ai-chip suggested" href="https://www.netflix.com/search?q=${encodeURIComponent(title)}">${title}</a>`;
      });
      html += `</div></div>`;
    }

    // Found on page
    if (data.results && data.results.length > 0) {
      html += `<div class="nf-ai-section-title">Found on this page:</div>`;
      data.results.forEach(item => {
        html += `
          <div class="nf-ai-item" data-id="${item.id}">
            ${item.poster
              ? `<img class="nf-ai-item-poster" src="${item.poster}" alt="${item.title}" onerror="this.style.display='none'" />`
              : `<div class="nf-ai-item-letter">${(item.title || '?').charAt(0)}</div>`
            }
            <div class="nf-ai-item-info">
              <div class="nf-ai-item-title">${item.title}</div>
            </div>
          </div>
        `;
      });
    }

    if (!html) {
      html = `<div class="nf-ai-empty">No results for "${query}"</div>`;
    }

    container.innerHTML = html;

    // Click handlers
    container.querySelectorAll('.nf-ai-item').forEach(el => {
      el.addEventListener('click', () => {
        const id = el.dataset.id;
        if (id) window.location.href = `https://www.netflix.com/title/${id}`;
      });
    });
  }

  function init() {
    if (isInitialized) return;

    const check = setInterval(() => {
      const nav = document.querySelector('.secondary-navigation, [data-uia="secondary-navigation"]');
      if (nav) {
        clearInterval(check);
        isInitialized = true;
        createUI();
      }
    }, 500);

    setTimeout(() => clearInterval(check), 15000);
  }

  let lastUrl = location.href;
  new MutationObserver(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      isInitialized = false;
      setTimeout(init, 1000);
    }
  }).observe(document, { subtree: true, childList: true });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
