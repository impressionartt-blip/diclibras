// Fallback dataset if dados.json is not present
const defaultData = [
  {
    "id": 1,
    "termo": "Compreender",
    "categoria": "Verbo",
    "descricao_busca": "Sinal do verbo compreender/entender em Libras.",
    "uso_e_significado": "Utilizado para expressar o entendimento de um conceito ou mensagem. Realizado próximo à testa movimentando a mão de forma sutil.",
    "video_url": "https://www.youtube.com/watch?v=WvfpW-mPNCo"
  }
];

let dictionaryData = [];
let selectedId = null;
let selectedCategory = '';
let appliedSearchQuery = '';

// DOM Elements
const categoriesListEl = document.getElementById('categoriesList');
const searchInput = document.getElementById('searchInput');
const searchForm = document.getElementById('searchForm');
const categoryPicker = document.getElementById('categoryPicker');
const categoryPickerBtn = document.getElementById('categoryPickerBtn');
const categoryPickerLabel = document.getElementById('categoryPickerLabel');
const categoryMenu = document.getElementById('categoryMenu');
const resetFiltersBtn = document.getElementById('btnResetFilter');
const displayTerm = document.getElementById('displayTerm');
const displayCategory = document.getElementById('displayCategory');
const displayDescription = document.getElementById('displayDescription');
const displayUsage = document.getElementById('displayUsage');
const videoContainer = document.getElementById('videoContainer');
const videoPlayer = document.getElementById('videoPlayer');
const videoSource = document.getElementById('videoSource');
const playBtn = document.getElementById('playBtn');

// Admin Modal Elements
const adminModal = document.getElementById('adminModal');
const closeModalBtn = document.getElementById('closeModalBtn');
const jsonFileInput = document.getElementById('jsonFileInput');
const exportJsonBtn = document.getElementById('exportJsonBtn');

// Initialize: Try fetching dados.json
async function loadData() {
  try {
    const response = await fetch('dados.json');
    if (!response.ok) throw new Error('Não foi possível carregar dados.json');
    dictionaryData = await response.json();
  } catch (err) {
    console.warn('Usando dados em memória (dados.json não encontrado ou sem servidor local):', err);
    dictionaryData = defaultData;
  }
  renderCategoryOptions();
  categoriesListEl.replaceChildren();
  clearSelection();
}

// Render list sidebar
function renderList(items) {
  categoriesListEl.innerHTML = '';
  if (items.length === 0) {
    categoriesListEl.innerHTML = '<p style="padding: 10px; color: #888; font-size: 13px;">Nenhum sinal encontrado.</p>';
    return;
  }

  items.forEach(item => {
    const div = document.createElement('div');
    div.className = `category-item ${item.id === selectedId ? 'active' : ''}`;
    div.dataset.itemId = String(item.id);
    div.onclick = () => selectItem(item.id);

    div.innerHTML = `
          <div class="radio-circle"></div>
          <div class="category-info">
            <span class="category-name">${item.termo}</span>
            <span class="category-type">${item.categoria}</span>
          </div>
        `;
    categoriesListEl.appendChild(div);
  });
}

function renderCategoryOptions() {
  categoryMenu.replaceChildren();
  const categories = [...new Set(
    dictionaryData
      .map(item => item.categoria?.trim())
      .filter(Boolean)
  )].sort((a, b) => a.localeCompare(b, 'pt-BR'));

  const options = [
    { label: 'Todas as categorias', value: '' },
    ...categories.map(category => ({ label: category, value: category }))
  ];

  options.forEach(({ label, value }) => {
    const option = document.createElement('button');
    option.type = 'button';
    option.className = 'category-option';
    option.textContent = label;
    option.setAttribute('aria-pressed', String(value === selectedCategory));
    option.addEventListener('click', () => {
      selectedCategory = value;
      categoryPickerLabel.textContent = value || 'Categoria Gramatical';
      renderCategoryOptions();
      applyFilters();
      closeCategoryMenu();
    });
    categoryMenu.appendChild(option);
  });
}

function applyFilters() {
  const filtered = dictionaryData.filter(item => {
    const matchesCategory = !selectedCategory || item.categoria === selectedCategory;
    const matchesQuery = !appliedSearchQuery ||
      item.termo.toLowerCase().includes(appliedSearchQuery) ||
      item.categoria.toLowerCase().includes(appliedSearchQuery) ||
      item.descricao_busca.toLowerCase().includes(appliedSearchQuery);
    return matchesCategory && matchesQuery;
  });
  renderList(filtered);
}

function clearSelection() {
  selectedId = null;
  displayTerm.textContent = 'Aguardando busca';
  displayCategory.textContent = 'Categoria';
  displayCategory.hidden = true;
  displayDescription.textContent = 'Use o campo de busca para encontrar um sinal. Os resultados aparecerão aqui.';
  displayUsage.textContent = 'As informações de uso e significado serão exibidas após selecionar um sinal.';
  youtubePlayer.removeAttribute('src');
  videoContainer.hidden = true;
}

function closeCategoryMenu() {
  categoryMenu.hidden = true;
  categoryPickerBtn.setAttribute('aria-expanded', 'false');
}

categoryPickerBtn.addEventListener('click', () => {
  const isExpanded = categoryPickerBtn.getAttribute('aria-expanded') === 'true';
  categoryMenu.hidden = isExpanded;
  categoryPickerBtn.setAttribute('aria-expanded', String(!isExpanded));
});

document.addEventListener('click', (event) => {
  if (!categoryPicker.contains(event.target)) closeCategoryMenu();
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeCategoryMenu();
});

// Search and Filter
searchForm.addEventListener('submit', (event) => {
  event.preventDefault();
  appliedSearchQuery = searchInput.value.toLowerCase().trim();
  applyFilters();
});

resetFiltersBtn.addEventListener('click', () => {
  searchInput.value = '';
  appliedSearchQuery = '';
  selectedCategory = '';
  categoryPickerLabel.textContent = 'Categoria Gramatical';
  renderCategoryOptions();
  applyFilters();
  searchInput.focus();
});

// Play/Pause Video
playBtn.addEventListener('click', () => {
  if (videoPlayer.paused) {
    videoPlayer.play();
    playBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
  } else {
    videoPlayer.pause();
    playBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
  }
});

// Hidden Admin Shortcut: Ctrl + Shift + A
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'a') {
    e.preventDefault();
    adminModal.style.display = 'flex';
  }
});

closeModalBtn.addEventListener('click', () => {
  adminModal.style.display = 'none';
});

// Import JSON File
jsonFileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (evt) => {
    try {
      const parsed = JSON.parse(evt.target.result);
      if (Array.isArray(parsed)) {
        dictionaryData = parsed;
        selectedCategory = '';
        appliedSearchQuery = '';
        searchInput.value = '';
        categoryPickerLabel.textContent = 'Categoria Gramatical';
        renderCategoryOptions();
        renderList(dictionaryData);
        if (dictionaryData.length > 0) selectItem(dictionaryData[0].id);
        alert('JSON importado com sucesso!');
        adminModal.style.display = 'none';
      } else {
        alert('Formato JSON inválido: esperava-se um array.');
      }
    } catch (err) {
      alert('Erro ao processar arquivo JSON.');
    }
  };
  reader.readAsText(file);
});

// Export current data as JSON
exportJsonBtn.addEventListener('click', () => {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dictionaryData, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", "dados.json");
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
});

// Função auxiliar para converter URLs do YouTube para o formato de embed
function getYouTubeEmbedUrl(url) {
  if (!url) return '';

  let videoId = '';

  // Trata formato: https://www.youtube.com/watch?v=VIDEO_ID
  if (url.includes('watch?v=')) {
    videoId = url.split('watch?v=')[1].split('&')[0];
  }
  // Trata formato curto: https://youtu.be/VIDEO_ID
  else if (url.includes('youtu.be/')) {
    videoId = url.split('youtu.be/')[1].split('?')[0];
  }
  // Trata formato já em embed: https://www.youtube.com/embed/VIDEO_ID
  else if (url.includes('/embed/')) {
    return url;
  }

  return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
}

// Elemento do Iframe
const youtubePlayer = document.getElementById('youtubePlayer');

function selectItem(id) {
  selectedId = id;
  const item = dictionaryData.find(d => d.id === id);
  if (!item) return;

  displayTerm.textContent = item.termo;
  displayCategory.textContent = item.categoria;
  displayCategory.hidden = false;
  displayDescription.textContent = item.descricao_busca;
  displayUsage.textContent = item.uso_e_significado;

  // Converte a URL do YouTube para Embed e aplica no iframe
  const embedUrl = getYouTubeEmbedUrl(item.video_url);
  youtubePlayer.src = embedUrl;
  videoContainer.hidden = false;

  // Atualiza destaque na lista lateral
  const elements = categoriesListEl.querySelectorAll('.category-item');
  elements.forEach((el) => {
    el.classList.toggle('active', el.dataset.itemId === String(id));
  });
}

// Start App
loadData();
