// ============================================
// J-Rod & Birbs gallery logic
// ============================================

const state = {
  archetype: 'all',
  category: 'all',
  query: '',
  filtered: [...CARDS],
  currentIndex: 0,
};

const grid = document.getElementById('cardGrid');
const emptyState = document.getElementById('emptyState');
const statStrip = document.getElementById('statStrip');

function fmtNum(n) {
  return n === null || n === undefined ? '' : Number(n).toLocaleString();
}

// ---------- Stat strip ----------
function renderStats() {
  const counts = { Monster: 0, Spell: 0, Trap: 0 };
  CARDS.forEach(c => counts[c.category] = (counts[c.category] || 0) + 1);
  statStrip.innerHTML = `
    <div class="stat-item monster"><span class="stat-num">${counts.Monster}</span><span class="stat-label">Monster</span></div>
    <div class="stat-item spell"><span class="stat-num">${counts.Spell}</span><span class="stat-label">Spell</span></div>
    <div class="stat-item trap"><span class="stat-num">${counts.Trap}</span><span class="stat-label">Trap</span></div>
    <div class="stat-item"><span class="stat-num">${CARDS.length}</span><span class="stat-label">Total</span></div>
  `;
}

// ---------- Filtering ----------
function applyFilters() {
  const q = state.query.trim().toLowerCase();
  state.filtered = CARDS.filter(c => {
    if (state.archetype !== 'all' && c.archetype !== state.archetype) return false;
    if (state.category !== 'all' && c.category !== state.category) return false;
    if (q && !(c.name.toLowerCase().includes(q) || (c.effect || '').toLowerCase().includes(q))) return false;
    return true;
  });
  renderGrid();
}

// ---------- Grid render ----------
function renderGrid() {
  grid.innerHTML = '';
  emptyState.hidden = state.filtered.length !== 0;

  state.filtered.forEach((card, i) => {
    const tile = document.createElement('div');
    tile.className = 'card-tile';
    tile.style.animationDelay = `${Math.min(i, 24) * 0.02}s`;
    tile.dataset.num = card.num;

    tile.innerHTML = `
      <div class="rarity-flag">${escapeHtml(card.rarity)}</div>
      <div class="tile-img-wrap">
        <img src="images/${card.image}" alt="${escapeHtml(card.name)}" loading="lazy">
        <div class="tile-shine"></div>
      </div>
      <div class="tile-meta">
        <p class="tile-name">${escapeHtml(card.name)}</p>
        <div class="tile-tags">
          <span class="cat-dot ${card.category}"></span>
          <span class="tile-sub">${escapeHtml(card.setId)}</span>
        </div>
      </div>
    `;

    tile.addEventListener('mousemove', (e) => handleTileShine(e, tile));
    tile.addEventListener('mouseleave', () => {
      tile.style.removeProperty('--shine-x');
      tile.style.removeProperty('--shine-y');
    });
    tile.addEventListener('click', () => openViewer(card));

    grid.appendChild(tile);
  });
}

function handleTileShine(e, tile) {
  const rect = tile.getBoundingClientRect();
  const x = ((e.clientX - rect.left) / rect.width) * 100;
  const y = ((e.clientY - rect.top) / rect.height) * 100;
  tile.style.setProperty('--shine-x', `${x}%`);
  tile.style.setProperty('--shine-y', `${y}%`);
}

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}

// ---------- Chip handling ----------
function setupChips(containerId) {
  const container = document.getElementById(containerId);
  const group = container.dataset.group;
  container.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      container.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      state[group] = chip.dataset.value;
      applyFilters();
    });
  });
}

setupChips('archChips');
setupChips('catChips');

document.getElementById('searchInput').addEventListener('input', (e) => {
  state.query = e.target.value;
  applyFilters();
});

// ---------- Viewer ----------
const overlay = document.getElementById('overlay');
const viewerImg = document.getElementById('viewerImg');
const foilCard = document.getElementById('foilCard');

function openViewer(card) {
  state.currentIndex = state.filtered.findIndex(c => c.num === card.num);
  renderViewer(card);
  overlay.hidden = false;
  document.body.style.overflow = 'hidden';
}

function closeViewer() {
  overlay.hidden = true;
  document.body.style.overflow = '';
}

function renderViewer(card) {
  viewerImg.src = `images/${card.image}`;
  viewerImg.alt = card.name;

  document.getElementById('viewerSetId').textContent = card.setId;
  document.getElementById('viewerRarity').textContent = card.rarity;
  document.getElementById('viewerName').textContent = card.name;
  document.getElementById('viewerArchetype').textContent =
    card.archetype + ' archetype · ' + card.category + (card.race ? ' · ' + card.race : '');

  const statLine = document.getElementById('viewerStatLine');
  let stats = '';
  if (card.category === 'Monster') {
    stats += `<span class="sl-item">Level <b>${fmtNum(card.level)}</b></span>`;
    stats += `<span class="sl-item">ATK <b>${fmtNum(card.atk)}</b></span>`;
    stats += `<span class="sl-item">DEF <b>${fmtNum(card.def)}</b></span>`;
    stats += `<span class="sl-item">Attribute <b>${escapeHtml(card.symbol)}</b></span>`;
  } else {
    stats += `<span class="sl-item">Card type <b>${escapeHtml(card.category)}</b></span>`;
    stats += `<span class="sl-item">Sub-type <b>${escapeHtml(card.subtype)}</b></span>`;
  }
  statLine.innerHTML = stats;

  document.getElementById('viewerEffect').textContent = card.effect;
  document.getElementById('viewerRole').textContent = card.role;
  document.getElementById('viewerSerial').textContent = `Serial No. ${card.serial}`;

  document.getElementById('effectLabel').textContent =
    card.category === 'Monster' ? 'Monster Effect' : card.category === 'Spell' ? 'Spell Effect' : 'Trap Effect';
}

function navigate(delta) {
  const list = state.filtered;
  if (!list.length) return;
  state.currentIndex = (state.currentIndex + delta + list.length) % list.length;
  renderViewer(list[state.currentIndex]);
}

document.getElementById('closeViewer').addEventListener('click', closeViewer);
document.getElementById('prevCard').addEventListener('click', () => navigate(-1));
document.getElementById('nextCard').addEventListener('click', () => navigate(1));

overlay.addEventListener('click', (e) => {
  if (e.target === overlay) closeViewer();
});

document.addEventListener('keydown', (e) => {
  if (overlay.hidden) return;
  if (e.key === 'Escape') closeViewer();
  if (e.key === 'ArrowLeft') navigate(-1);
  if (e.key === 'ArrowRight') navigate(1);
});

foilCard.addEventListener('mousemove', (e) => {
  const rect = foilCard.getBoundingClientRect();
  const x = ((e.clientX - rect.left) / rect.width) * 100;
  const y = ((e.clientY - rect.top) / rect.height) * 100;
  foilCard.style.setProperty('--shine-x', `${x}%`);
  foilCard.style.setProperty('--shine-y', `${y}%`);
  const rotX = ((y - 50) / 50) * -6;
  const rotY = ((x - 50) / 50) * 6;
  foilCard.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg)`;
});

foilCard.addEventListener('mouseleave', () => {
  foilCard.style.transform = 'rotateX(0deg) rotateY(0deg)';
});

// ---------- Init ----------
renderStats();
renderGrid();
