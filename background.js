const MEDIA_REGEX = /\.(m3u8|ts|mp4)(\?|$)/i;
const MAX_STORAGE = 1000;

// Inicializa o estado
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ captureEnabled: true, mediaList: [] });
});

// 1. Interceptação via webRequest
chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    if (details.method !== "GET" && details.method !== "POST") return;
    processUrl(details.url, details.tabId, "Network Request");
  },
  { urls: ["<all_urls>"], types: ["xmlhttprequest", "media", "other"] }
);

// Escuta mensagens do Content Script/Injected
chrome.runtime.onMessage.addListener((message, sender) => {
  if (message.type === 'MEDIA_DETECTED') {
    processUrl(message.url, sender.tab?.id, message.method);
  }
});

async function processUrl(url, tabId, method) {
  const settings = await chrome.storage.local.get(['captureEnabled', 'mediaList']);
  if (!settings.captureEnabled) return;

  if (MEDIA_REGEX.test(url)) {
    let list = settings.mediaList || [];
    
    // Evitar duplicatas
    if (list.some(item => item.url === url)) return;

    const newEntry = {
      url: url,
      type: url.split(/[#?]/)[0].split('.').pop().toLowerCase(),
      timestamp: Date.now(),
      tabId: tabId,
      method: method
    };

    list.unshift(newEntry);
    if (list.length > MAX_STORAGE) list.pop();

    await chrome.storage.local.set({ mediaList: list });
    
    // Notifica popup se estiver aberto
    chrome.runtime.sendMessage({ type: 'UI_UPDATE' }).catch(() => {});
  }
}
