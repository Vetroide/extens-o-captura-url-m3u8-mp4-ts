(function() {
  const notify = (url, method) => {
    window.postMessage({ type: 'FROM_PAGE_DETECTOR', url, method }, '*');
  };

  // 1. Interceptar Fetch
  const originalFetch = window.fetch;
  window.fetch = function(...args) {
    if (args[0]) notify(args[0].toString(), 'Fetch API');
    return originalFetch.apply(this, args);
  };

  // 2. Interceptar XHR
  const originalOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(method, url) {
    notify(url, 'XHR');
    return originalOpen.apply(this, arguments);
  };

  // 3. Performance API Monitor (Polling de baixo impacto)
  setInterval(() => {
    const resources = performance.getEntriesByType("resource");
    resources.forEach(res => {
      if (res.name.match(/\.(m3u8|ts|mp4)(\?|$)/i)) {
        notify(res.name, 'Performance API');
      }
    });
    performance.clearResourceTimings();
  }, 5000);
})();
