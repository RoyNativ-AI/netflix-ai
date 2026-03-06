// Netflix AI Search - Background Service Worker

chrome.runtime.onInstalled.addListener(() => {
  console.log('Netflix AI Search extension installed');
});

// Handle messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_API_KEY') {
    chrome.storage.local.get(['openaiApiKey'], (result) => {
      sendResponse({ apiKey: result.openaiApiKey });
    });
    return true; // Keep channel open for async response
  }

  if (message.type === 'SET_API_KEY') {
    chrome.storage.local.set({ openaiApiKey: message.apiKey }, () => {
      sendResponse({ success: true });
    });
    return true;
  }
});
