document.addEventListener('DOMContentLoaded', async () => {
  const listEl = document.getElementById('mediaList');
  const searchInput = document.getElementById('searchInput');
  const typeFilter = document.getElementById('typeFilter');
  const statusToggle = document.getElementById('statusToggle');
  const totalCount = document.getElementById('totalCount');

  // Carregar estado inicial
  const data = await chrome.storage.local.get(['mediaList', 'captureEnabled']);
  statusToggle.checked = data.captureEnabled;
  renderList(data.mediaList || []);

  // Eventos
  statusToggle.addEventListener('change', (e) => {
    chrome.storage.local.set({ captureEnabled: e.target.checked });
  });

  searchInput.addEventListener('input', () => updateUI());
  typeFilter.addEventListener('change', () => updateUI());

  document.getElementById('clearAll').addEventListener('click', async () => {
    await chrome.storage.local.set({ mediaList: [] });
    renderList([]);
  });

  document.getElementById('exportTxt').addEventListener('click', () => exportData('txt'));
  document.getElementById('exportJson').addEventListener('click', () => exportData('json'));

  // Escutar atualizações em tempo real
  chrome.runtime.onMessage.addListener((m) => {
    if (m.type === 'UI_UPDATE') updateUI();
  });

  async function updateUI() {
    const data = await chrome.storage.local.get('mediaList');
    renderList(data.mediaList || []);
  }

  function renderList(list) {
    const searchTerm = searchInput.value.toLowerCase();
    const filter = typeFilter.value;

    const filtered = list.filter(item => {
      const matchesSearch = item.url.toLowerCase().includes(searchTerm);
      const matchesType = filter === 'all' || item.type === filter;
      return matchesSearch && matchesType;
    });

    totalCount.textContent = filtered.length;
    listEl.innerHTML = '';

    filtered.forEach((item, index) => {
      const div = document.createElement('div');
      div.className = 'media-item';
      div.innerHTML = `
        <div class="media-info">${item.url}</div>
        <div class="media-meta">
          <span class="type-badge type-${item.type}">${item.type}</span>
          <span style="font-size: 9px; color: #999;">${item.method}</span>
          <div class="item-actions">
            <button onclick="copyToClipboard('${item.url}')">Copiar</button>
            <button class="btn-del" data-index="${index}">✖</button>
          </div>
        </div>
      `;
      listEl.appendChild(div);
    });

    // Delegar evento de deletar
    listEl.querySelectorAll('.btn-del').forEach(btn => {
      btn.onclick = async () => {
        const current = await chrome.storage.local.get('mediaList');
        current.mediaList.splice(btn.dataset.index, 1);
        await chrome.storage.local.set({ mediaList: current.mediaList });
        updateUI();
      };
    });
  }
});

// Helper functions expostas para o escopo global do popup
window.copyToClipboard = (text) => {
  navigator.clipboard.writeText(text);
  alert('Copiado para o clipboard!');
};

async function exportData(format) {
  const { mediaList } = await chrome.storage.local.get('mediaList');
  let content, type, filename;

  if (format === 'json') {
    content = JSON.stringify(mediaList, null, 2);
    type = 'application/json';
    filename = 'media_capture.json';
  } else {
    content = mediaList.map(i => i.url).join('\n');
    type = 'text/plain';
    filename = 'media_urls.txt';
  }

  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  chrome.downloads.download({ url, filename });
}
