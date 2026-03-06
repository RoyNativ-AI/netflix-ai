// Netflix AI Search - Popup Script

const API_URL = 'http://localhost:3456';

document.addEventListener('DOMContentLoaded', async () => {
  const statusDot = document.getElementById('statusDot');
  const statusText = document.getElementById('statusText');
  const apiKeyInput = document.getElementById('apiKey');
  const saveKeyBtn = document.getElementById('saveKey');
  const keyMessage = document.getElementById('keyMessage');

  // Check server status
  async function checkServer() {
    try {
      const response = await fetch(`${API_URL}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(3000)
      });
      if (response.ok) {
        statusDot.className = 'status-dot';
        statusText.textContent = 'Server running';
      } else {
        throw new Error('Server error');
      }
    } catch (e) {
      statusDot.className = 'status-dot error';
      statusText.textContent = 'Server not running';
    }
  }

  // Load saved API key
  chrome.storage.local.get(['openaiApiKey'], (result) => {
    if (result.openaiApiKey) {
      apiKeyInput.value = result.openaiApiKey;
    }
  });

  // Save API key
  saveKeyBtn.addEventListener('click', async () => {
    const apiKey = apiKeyInput.value.trim();

    if (!apiKey) {
      showMessage('Please enter an API key', 'error');
      return;
    }

    if (!apiKey.startsWith('sk-')) {
      showMessage('Invalid API key format', 'error');
      return;
    }

    // Save locally
    chrome.storage.local.set({ openaiApiKey: apiKey });

    // Send to server
    try {
      const response = await fetch(`${API_URL}/api/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ openaiApiKey: apiKey })
      });

      if (response.ok) {
        showMessage('API key saved', 'success');
      } else {
        showMessage('Saved locally, server update failed', 'error');
      }
    } catch (e) {
      showMessage('Saved locally, server unreachable', 'error');
    }
  });

  function showMessage(text, type) {
    keyMessage.textContent = text;
    keyMessage.className = `message ${type}`;
    setTimeout(() => {
      keyMessage.textContent = '';
      keyMessage.className = '';
    }, 3000);
  }

  // Initial check
  checkServer();
});
