// Ponte para mensagens do Injected.js
window.addEventListener('message', (event) => {
  if (event.data.type === 'FROM_PAGE_DETECTOR') {
    chrome.runtime.sendMessage({
      type: 'MEDIA_DETECTED',
      url: event.data.url,
      method: event.data.method
    });
  }
});

// 4. Monitoramento de Elementos de Vídeo (MutationObserver)
const observer = new MutationObserver((mutations) => {
  mutations.forEach(mutation => {
    mutation.addedNodes.forEach(node => {
      if (node.tagName === 'VIDEO' || node.tagName === 'SOURCE') {
        checkVideoSrc(node);
      }
    });
    if (mutation.type === 'attributes' && (mutation.attributeName === 'src')) {
      checkVideoSrc(mutation.target);
    }
  });
});

function checkVideoSrc(element) {
  const src = element.src || element.currentSrc;
  if (src && !src.startsWith('blob:')) {
    chrome.runtime.sendMessage({ type: 'MEDIA_DETECTED', url: src, method: 'DOM Observer' });
  } else if (src && src.startsWith('blob:')) {
    // Para blobs, registramos a ocorrência, o background/network pegará a fonte real
    chrome.runtime.sendMessage({ type: 'MEDIA_DETECTED', url: src, method: 'Blob Detector' });
  }
}

observer.observe(document.documentElement, {
  childList: true,
  subtree: true,
  attributes: true,
  attributeFilter: ['src']
});
