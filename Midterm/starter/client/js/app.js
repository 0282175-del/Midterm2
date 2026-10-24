// Offline SVG Fallback for missing/broken sprites
const DEFAULT_IMAGE = "data:image/svg+xml;utf8," + encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
    <rect width="100%" height="100%" fill="#2b3035"/>
    <circle cx="100" cy="100" r="60" fill="none" stroke="#6c757d" stroke-width="8"/>
    <line x1="40" y1="100" x2="160" y2="100" stroke="#6c757d" stroke-width="8"/>
    <circle cx="100" cy="100" r="18" fill="#2b3035" stroke="#6c757d" stroke-width="8"/>
    <text x="50%" y="185" font-family="sans-serif" font-size="14" fill="#adb5bd" text-anchor="middle">No Image</text>
  </svg>
`);

// DOM Elements
const catalogGrid = document.getElementById('catalog-grid');
const catalogSection = document.getElementById('catalog-section');
const catalogCount = document.getElementById('catalog-count');
const catalogSubtitle = document.getElementById('catalog-subtitle');
const loadingSpinner = document.getElementById('loading-spinner');
const errorView = document.getElementById('error-view');
const errorMessage = document.getElementById('error-message');

const searchForm = document.getElementById('search-form');
const searchInput = document.getElementById('search-input');
const clearSearchBtn = document.getElementById('clear-search-btn');
const errorResetBtn = document.getElementById('error-reset-btn');
const brandReset = document.getElementById('brand-reset');

// Modal Elements
const modalElement = document.getElementById('characters-modal');
const characterModal = new bootstrap.Modal(modalElement);
const modalName = document.getElementById('modal-name');
const modalId = document.getElementById('modal-id');
const modalImg = document.getElementById('modal-img');
const modalFullName = document.getElementById('modal-fullname');
const modalPowerstats = document.getElementById('modal-powerstats');
const modalPlace = document.getElementById('modal-place');
const modalBiography = document.getElementById('modal-biography');
const modalAliases = document.getElementById('modal-aliases');
const modalGender = document.getElementById('modal-gender');
const modalRace = document.getElementById('modal-race');
const modalHeight = document.getElementById('modal-height');
const modalWeight = document.getElementById('modal-weight');
const modalEyeColor = document.getElementById('modal-eyecolor');
const modalHairColor = document.getElementById('modal-haircolor');
const modalGroups = document.getElementById('modal-groups');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');

// Navigation state
let currentPrevId = null;
let currentNextId = null;
let isModalOpen = false;

modalElement.addEventListener('shown.bs.modal', () => { isModalOpen = true; });
modalElement.addEventListener('hidden.bs.modal', () => { isModalOpen = false; });

/**
 * Fetch and render the catalog list from the student's Express API
 */
async function loadCatalog(searchQuery = '') {
  showLoading(true);
  hideError();

  try {
    let endpoint = '/api';
    if (searchQuery) {
      endpoint = '/api/search?q=' + encodeURIComponent(searchQuery);
    }

    const response = await fetch(endpoint);
    if (!response.ok) {
      let msg = `Server responded with status ${response.status}`;
      try {
        const errData = await response.json();
        if (errData.error) msg = errData.error;
      } catch (e) {}
      showError(msg);
      return;
    }

    const data = await response.json();
    const list = Array.isArray(data) ? data : (data.results || []);

    if (list.length === 0) {
      showError(searchQuery ? `No character found matching "${searchQuery}".` : 'The catalog is empty.');
      return;
    }

    renderCatalog(list, searchQuery);
  } catch (err) {
    showError(`Failed to communicate with backend API: ${err.message}`);
  } finally {
    showLoading(false);
  }
}

/**
 * Render catalog cards inside the scrollable container
 */
function renderCatalog(characterList, searchQuery) {
  catalogSection.classList.remove('d-none');
  catalogGrid.innerHTML = '';
  catalogCount.textContent = `${characterList.length} entries`;
  catalogSubtitle.textContent = searchQuery ? `Search Results for "${searchQuery}"` : 'All Characters';

  characterList.forEach((character) => {
    const col = document.createElement('div');
    col.className = 'col';

    const card = document.createElement('div');
    card.className = 'card h-100 char-card bg-body-tertiary border-secondary-subtle text-center p-2';
    card.addEventListener('click', () => openDetail(character.id || character.name));

    const img = document.createElement('img');
    img.className = 'card-img-top char-card-img mx-auto my-2';
    img.alt = character.name;
    img.src = character.image || DEFAULT_IMAGE;
    img.onerror = () => { img.onerror = null; img.src = DEFAULT_IMAGE; };

    const body = document.createElement('div');
    body.className = 'card-body p-1';

    const idBadge = document.createElement('span');
    idBadge.className = 'badge bg-secondary-subtle text-secondary-emphasis mb-1';
    idBadge.textContent = character.id ? `#${String(character.id).padStart(3, '0')}` : '';

    const title = document.createElement('h6');
    title.className = 'card-title text-capitalize mb-1 fw-bold text-truncate';
    title.textContent = character.name;

    body.append(idBadge, title);
    card.append(img, body);
    col.appendChild(card);
    catalogGrid.appendChild(col);
  });
}

/**
 * Fetch single Character detail and open/update modal
 */
async function openDetail(identifier) {
  if (identifier === null || identifier === undefined) return;

  try {
    const response = await fetch(`/api/characters/${encodeURIComponent(identifier)}`);

    if (response.status === 404) {
      if (isModalOpen) characterModal.hide();
      showError(`Character "${identifier}" was not found.`);
      return;
    }

    if (!response.ok) {
      let msg = `Server status ${response.status}`;
      try {
        const errData = await response.json();
        if (errData.error) msg = errData.error;
      } catch (e) {}
      throw new Error(msg);
    }

    const character = await response.json();
    populateModal(character);

    if (!isModalOpen) {
      characterModal.show();
    }
  } catch (err) {
    if (isModalOpen) characterModal.hide();
    showError(`Error loading character details: ${err.message}`);
  }
}

function formatValue(val) {
  if (val === null || val === undefined) return 'Unknown';
  if (Array.isArray(val)) {
    const items = val.filter((item) => item && item !== '-');
    if (items.length === 0) return 'Unknown';
    return items.join(' / ');
  }
  const text = String(val).trim();
  if (!text || text === '-') return 'Unknown';
  return text;
}

function renderPowerstats(stats) {
  modalPowerstats.innerHTML = '';
  const keys = ['intelligence', 'strength', 'speed', 'durability', 'power', 'combat'];
  keys.forEach((key) => {
    let value = '-';
    if (stats && stats[key] !== null && stats[key] !== undefined && stats[key] !== 'null') {
      value = stats[key];
    }

    const num = Number(value);
    const hasNum = value !== '-' && !Number.isNaN(num);
    const percent = hasNum ? Math.min(100, Math.max(0, num)) : 0;

    let color = 'bg-danger';
    if (percent >= 70) color = 'bg-success';
    else if (percent >= 40) color = 'bg-warning';

    const col = document.createElement('div');
    col.className = 'col-6';

    const label = document.createElement('div');
    label.className = 'd-flex justify-content-between small text-secondary';
    label.innerHTML = `<span class="text-capitalize">${key}</span><span class="fw-bold">${hasNum ? num : '-'}</span>`;

    const barWrap = document.createElement('div');
    barWrap.className = 'progress powerstat-bar';
    const bar = document.createElement('div');
    bar.className = `progress-bar ${color}`;
    bar.style.width = `${hasNum ? percent : 0}%`;
    barWrap.appendChild(bar);

    col.append(label, barWrap);
    modalPowerstats.appendChild(col);
  });
}

/**
 * Populate modal DOM elements with backend payload
 */
function populateModal(character) {
  modalName.textContent = character.name || 'Unknown';
  modalId.textContent = character.id ? `#${String(character.id).padStart(3, '0')}` : '#???';

  modalImg.src = character.image || DEFAULT_IMAGE;
  modalImg.onerror = () => { modalImg.onerror = null; modalImg.src = DEFAULT_IMAGE; };

  modalFullName.textContent = formatValue(character.fullName);
  modalPlace.textContent = formatValue(character.placeOfBirth);
  modalBiography.textContent = formatValue(character.biography);

  renderPowerstats(character.powerstats);

  modalGender.textContent = formatValue(character.gender);
  modalRace.textContent = formatValue(character.race);
  modalHeight.textContent = formatValue(character.height);
  modalWeight.textContent = formatValue(character.weight);
  modalEyeColor.textContent = formatValue(character.eyeColor);
  modalHairColor.textContent = formatValue(character.hairColor);
  modalGroups.textContent = formatValue(character.groupAffiliation);

  modalAliases.innerHTML = '';
  const aliases = Array.isArray(character.aliases) ? character.aliases : [];
  if (aliases.length === 0) {
    const span = document.createElement('span');
    span.className = 'text-secondary small';
    span.textContent = 'No aliases listed';
    modalAliases.appendChild(span);
  } else {
    aliases.forEach((alias) => {
      const badge = document.createElement('span');
      badge.className = 'badge bg-secondary-subtle text-secondary-emphasis text-capitalize';
      badge.textContent = alias;
      modalAliases.appendChild(badge);
    });
  }

  // Bind circular navigation
  currentPrevId = character.prevId ?? null;
  currentNextId = character.nextId ?? null;

  prevBtn.disabled = currentPrevId === null;
  nextBtn.disabled = currentNextId === null;
}

// Event Listeners: Modal Left/Right Navigation
prevBtn.addEventListener('click', () => {
  if (currentPrevId !== null) openDetail(currentPrevId);
});

nextBtn.addEventListener('click', () => {
  if (currentNextId !== null) openDetail(currentNextId);
});

// Keyboard Arrow Navigation inside Modal
document.addEventListener('keydown', (e) => {
  if (!isModalOpen) return;
  if (e.key === 'ArrowLeft' && currentPrevId !== null) {
    openDetail(currentPrevId);
  } else if (e.key === 'ArrowRight' && currentNextId !== null) {
    openDetail(currentNextId);
  }
});

// Event Listeners: Search & Reset
searchForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const query = searchInput.value.trim();
  if (query) {
    clearSearchBtn.classList.remove('d-none');
    loadCatalog(query);
  } else {
    resetToFullCatalog();
  }
});

function resetToFullCatalog() {
  searchInput.value = '';
  clearSearchBtn.classList.add('d-none');
  loadCatalog();
}

clearSearchBtn.addEventListener('click', resetToFullCatalog);
errorResetBtn.addEventListener('click', resetToFullCatalog);
brandReset.addEventListener('click', (e) => {
  e.preventDefault();
  resetToFullCatalog();
});

// UI Helper Functions
function showLoading(isLoading) {
  loadingSpinner.classList.toggle('d-none', !isLoading);
  if (isLoading) catalogSection.classList.add('d-none');
}

function showError(msg) {
  catalogSection.classList.add('d-none');
  errorMessage.textContent = msg;
  errorView.classList.remove('d-none');
}

function hideError() {
  errorView.classList.add('d-none');
}

// Initial Boot
document.addEventListener('DOMContentLoaded', () => loadCatalog());