// Header scroll state
const header = document.getElementById('site-header');
window.addEventListener('scroll', () => {
  header.classList.toggle('scrolled', window.scrollY > 10);
});

// Mobile menu
const burger = document.getElementById('burger');
const panel = document.getElementById('mobilePanel');
burger.addEventListener('click', () => panel.classList.toggle('open'));
panel.querySelectorAll('a').forEach(a => a.addEventListener('click', () => panel.classList.remove('open')));

// Scroll reveal
const io = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
}, { threshold: 0.15 });
function observeReveal(root = document){
  root.querySelectorAll('.reveal').forEach(el => io.observe(el));
}

/* ---------- Furniture-themed placeholder photos ---------- */
/* LoremFlickr serves real photos filtered by keyword, with a stable "lock" per seed
   so the same item always shows the same picture instead of a random one. */
function hashSeed(text){
  let h = 0;
  for (let i = 0; i < text.length; i++){
    h = (h * 31 + text.charCodeAt(i)) | 0;
  }
  return Math.abs(h) % 1000;
}
function slugify(text){
  return text.toString().toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}
const ICON_KEYWORD = {
  sofa: 'sofa', cadeira: 'chair', cabeceira: 'headboard', banco: 'stool',
  puf: 'ottoman', placa: 'upholstery', almofada: 'cushion', tecido: 'fabric',
  espuma: 'foam', reparo: 'furniture', acabamento: 'furniture', generic: 'furniture',
};
function keywordFor(item){
  const cat = (item.categoria || '').toLowerCase();
  if (cat.includes('sofá') || cat.includes('sofa') || cat.includes('poltrona')) return 'sofa';
  if (cat.includes('cadeira')) return 'chair';
  if (cat.includes('cabeceira')) return 'headboard';
  if (cat.includes('puf') || cat.includes('banco')) return 'ottoman';
  if (cat.includes('almofada')) return 'cushion';
  return ICON_KEYWORD[item.icon] || 'sofa';
}
function furniturePhoto(item, seedSuffix, w, h){
  const keyword = keywordFor(item);
  const lock = hashSeed(slugify(item.titulo) + seedSuffix);
  return `https://loremflickr.com/${w}/${h}/${keyword}?lock=${lock}`;
}

/* ---------- Icon set for services ---------- */
const ICONS = {
  sofa: '<path d="M3 12v5a1 1 0 0 0 1 1h1v2M20 12v5a1 1 0 0 1-1 1h-1v2"/><path d="M3 12V9a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v3"/><path d="M3 12a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2"/>',
  cadeira: '<path d="M5 21V9a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v12"/><path d="M5 15h14"/><path d="M9 3v4M15 3v4"/>',
  cabeceira: '<path d="M6 21V11a6 6 0 0 1 12 0v10"/><path d="M6 21h12"/>',
  banco: '<rect x="4" y="8" width="16" height="9" rx="2"/><path d="M7 8V6a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v2"/>',
  puf: '<circle cx="12" cy="12" r="8"/><path d="M12 4v16"/>',
  placa: '<rect x="4" y="4" width="7" height="7" rx="1"/><rect x="13" y="4" width="7" height="7" rx="1"/><rect x="4" y="13" width="7" height="7" rx="1"/><rect x="13" y="13" width="7" height="7" rx="1"/>',
  almofada: '<path d="M12 4c4 0 7 3 7 7s-3 7-7 7-7-3-7-7 3-7 7-7Z"/><path d="M9 9c1-1 5-1 6 0"/>',
  tecido: '<path d="M3 6h13l5 5v7a2 2 0 0 1-2 2H3Z"/><path d="M3 6v13"/><path d="M8 21v-6h5v6"/>',
  espuma: '<rect x="4" y="7" width="16" height="4" rx="1"/><rect x="4" y="13" width="16" height="4" rx="1"/>',
  reparo: '<path d="M14.7 6.3a4 4 0 1 1-5.4 5.4L4 17v3h3l5.3-5.3"/><path d="M17 3l4 4-2 2-4-4 2-2Z"/>',
  acabamento: '<path d="M12 3l2.5 5.5L20 9l-4 4 1 6-5-3-5 3 1-6-4-4 5.5-.5Z"/>',
  generic: '<circle cx="12" cy="12" r="9"/><path d="M9 12l2 2 4-4"/>',
};
function iconSvg(key){
  return `<svg viewBox="0 0 24 24">${ICONS[key] || ICONS.generic}</svg>`;
}

/* ---------- Default content (used until/unless Firebase config overrides it) ----------
   Each serviço can optionally carry photos (tipo: 'galeria' or 'antes_depois').
   Entries WITHOUT a tipo are shown as plain marketing cards ("O que fazemos").
   Entries WITH a tipo are shown as portfolio work in "Trabalhos realizados". */
const defaultServicos = [
  { icon: 'sofa', titulo: 'Reforma de Sofás', texto: 'Estrutura revisada, espuma renovada e tecido novo — o sofá volta a ficar como no primeiro dia.' },
  { icon: 'cadeira', titulo: 'Reforma de Assentos de Cadeiras', texto: 'Reforço da base, nova espuma e acabamento sob medida para o design de cada cadeira.' },
  { icon: 'cabeceira', titulo: 'Cabeceiras Estofadas', texto: 'Cabeceiras capitonê ou lisas, com o tecido e o volume que combinam com o quarto.' },
  { icon: 'banco', titulo: 'Bancos', texto: 'Bancos de cozinha, bar ou área externa, com estofamento firme e durável.' },
  { icon: 'puf', titulo: 'Pufes', texto: 'Renovação completa de pufes redondos, retangulares ou baú, com nova espuma interna.' },
  { icon: 'placa', titulo: 'Placas Estofadas', texto: 'Painéis capitonê para cabeceiras e paredes, produzidos sob medida.' },
  { icon: 'almofada', titulo: 'Almofadas', texto: 'Enchimento e capas novas, no tamanho e tecido que você escolher.' },
  { icon: 'tecido', titulo: 'Troca de Tecido', texto: 'Amplo catálogo de tecidos e couros para renovar a cor e o estilo do estofado.' },
  { icon: 'espuma', titulo: 'Troca de Espuma', texto: 'Espumas de densidade adequada para recuperar o conforto e a firmeza do assento.' },
  { icon: 'reparo', titulo: 'Reparos em Geral', texto: 'Costuras, ferragens, molas e pequenos consertos que devolvem a estrutura ao lugar.' },
  { icon: 'acabamento', titulo: 'Acabamento Premium', texto: 'Detalhes de costura, alinhamento e acabamento que fazem a diferença de perto.' },
  { icon: 'sofa', titulo: 'Sofá 3 lugares — linho cru', texto: 'Troca completa do tecido e revisão da espuma.', categoria: 'Sofás', tipo: 'antes_depois', nota: 'Linho cru' },
  { icon: 'sofa', titulo: 'Poltrona — veludo verde', texto: 'Reforma estrutural e novo tecido em veludo.', categoria: 'Sofás', tipo: 'antes_depois', nota: 'Veludo verde' },
  { icon: 'sofa', titulo: 'Sofá retrátil — couro sintético', texto: 'Troca de tecido e ajuste do mecanismo retrátil.', categoria: 'Sofás', tipo: 'galeria', fotosCount: 3 },
  { icon: 'cadeira', titulo: 'Jogo de 6 cadeiras — veludo', texto: 'Estofamento completo em veludo para sala de jantar.', categoria: 'Cadeiras', tipo: 'galeria', fotosCount: 5 },
  { icon: 'cadeira', titulo: 'Cadeira de jantar — couro sintético', texto: 'Troca de tecido e reforço da base.', categoria: 'Cadeiras', tipo: 'antes_depois', nota: 'Couro sintético' },
  { icon: 'cabeceira', titulo: 'Cabeceira capitonê — casal', texto: 'Capitonê em linho com nova espuma.', categoria: 'Cabeceiras', tipo: 'antes_depois', nota: 'Capitonê linho' },
  { icon: 'cabeceira', titulo: 'Cabeceira lisa — queen', texto: 'Acabamento liso em tecido premium.', categoria: 'Cabeceiras', tipo: 'galeria', fotosCount: 2 },
  { icon: 'puf', titulo: 'Puf redondo — suede', texto: 'Nova capa em suede e espuma renovada.', categoria: 'Pufes & Bancos', tipo: 'galeria', fotosCount: 3 },
  { icon: 'banco', titulo: 'Banco de cozinha — par', texto: 'Estofamento resistente para uso diário.', categoria: 'Pufes & Bancos', tipo: 'galeria', fotosCount: 2 },
];

const DEFAULT_MIN_ANTES_DEPOIS = 3;
const DEFAULT_MIN_GALERIA = 6;

/* Furniture-themed filler used to pad "Trabalhos realizados" up to the configured minimum
   when there aren't enough real entries yet — always clearly tagged "Exemplo". */
const PLACEHOLDER_POOL = [
  { titulo: 'Sofá 3 lugares', categoria: 'Sofás', icon: 'sofa' },
  { titulo: 'Poltrona reclinável', categoria: 'Sofás', icon: 'sofa' },
  { titulo: 'Sofá de canto', categoria: 'Sofás', icon: 'sofa' },
  { titulo: 'Cadeira de jantar', categoria: 'Cadeiras', icon: 'cadeira' },
  { titulo: 'Jogo de cadeiras', categoria: 'Cadeiras', icon: 'cadeira' },
  { titulo: 'Cadeira estofada', categoria: 'Cadeiras', icon: 'cadeira' },
  { titulo: 'Cabeceira estofada', categoria: 'Cabeceiras', icon: 'cabeceira' },
  { titulo: 'Cabeceira capitonê', categoria: 'Cabeceiras', icon: 'cabeceira' },
  { titulo: 'Cabeceira queen', categoria: 'Cabeceiras', icon: 'cabeceira' },
  { titulo: 'Puf redondo', categoria: 'Pufes & Bancos', icon: 'puf' },
  { titulo: 'Banco estofado', categoria: 'Pufes & Bancos', icon: 'banco' },
  { titulo: 'Puf baú', categoria: 'Pufes & Bancos', icon: 'puf' },
];
function makePlaceholderItem(tipo, index){
  const base = PLACEHOLDER_POOL[index % PLACEHOLDER_POOL.length];
  return {
    id: `placeholder-${tipo}-${index}`,
    icon: base.icon,
    titulo: base.titulo,
    texto: 'Exemplo ilustrativo — substitua pelas fotos reais deste trabalho no painel administrativo.',
    categoria: base.categoria,
    tipo,
    nota: tipo === 'antes_depois' ? 'Exemplo' : undefined,
    fotosCount: tipo === 'galeria' ? 3 : undefined,
    placeholder: true,
  };
}
function buildPortfolioList(servicos, settings){
  const real = servicos.filter(s => s.tipo);
  const realAD = real.filter(s => s.tipo === 'antes_depois');
  const realGal = real.filter(s => s.tipo === 'galeria');
  const minAD = (settings && settings.minAntesDepois) || DEFAULT_MIN_ANTES_DEPOIS;
  const minGal = (settings && settings.minGaleria) || DEFAULT_MIN_GALERIA;

  let counter = 0;
  const paddedAD = realAD.slice();
  while (paddedAD.length < minAD) paddedAD.push(makePlaceholderItem('antes_depois', counter++));
  const paddedGal = realGal.slice();
  while (paddedGal.length < minGal) paddedGal.push(makePlaceholderItem('galeria', counter++));

  return [...paddedAD, ...paddedGal];
}

let siteConfig = { servicos: defaultServicos };
let currentPortfolioList = [];

/* ---------- Serviços (marketing cards — entries without tipo) ---------- */
function renderServicos(cfg){
  const grid = document.getElementById('servicesGrid');
  const marketing = cfg.servicos.filter(s => !s.tipo);
  grid.innerHTML = marketing.map(s => `
    <div class="service-card reveal">
      <div class="service-icon">${iconSvg(s.icon)}</div>
      <h3>${s.titulo}</h3>
      <p>${s.texto}</p>
    </div>`).join('');
  observeReveal(grid);
}

/* ---------- Portfólio + Antes/Depois (entries with tipo) ---------- */
let currentFilter = 'all';

function renderFilters(portfolioList){
  const row = document.getElementById('filterRow');
  const categorias = [...new Set(portfolioList.filter(s => s.categoria).map(s => s.categoria))];
  const buttons = [{ id: 'all', label: 'Todos' }, ...categorias.map(c => ({ id: c, label: c }))];
  row.innerHTML = buttons.map((c, i) =>
    `<button class="filter-btn${i === 0 ? ' active' : ''}" data-filter="${c.id}">${c.label}</button>`
  ).join('');
  row.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      row.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      renderPortfolio();
    });
  });
}

function portfolioThumb(item){
  if (item.tipo === 'antes_depois') return item.depois || furniturePhoto(item, '-depois', 500, 375);
  if (Array.isArray(item.fotos)) return item.fotos[0];
  return furniturePhoto(item, '', 500, 375);
}

function photoCount(item){
  if (item.tipo === 'antes_depois') return 2;
  if (Array.isArray(item.fotos)) return item.fotos.length;
  return item.fotosCount || 1;
}

function renderPortfolio(){
  const grid = document.getElementById('portfolioGrid');
  const items = currentFilter === 'all' ? currentPortfolioList : currentPortfolioList.filter(p => p.categoria === currentFilter);
  grid.innerHTML = '';

  if (items.length === 0){
    const empty = document.createElement('p');
    empty.className = 'section-sub reveal';
    empty.style.gridColumn = '1 / -1';
    empty.textContent = 'Nenhum trabalho nessa categoria ainda.';
    grid.appendChild(empty);
    observeReveal(grid);
    requestAnimationFrame(() => empty.classList.add('in'));
    return;
  }

  items.forEach(item => {
    const card = document.createElement('div');
    const isCompare = item.tipo === 'antes_depois';
    card.className = 'p-card reveal' + (isCompare ? ' p-card-compare' : '');
    const tags = [];
    if (isCompare) tags.push('<span class="p-tag">Antes/Depois</span>');
    if (item.placeholder) tags.push('<span class="p-tag example">Exemplo</span>');
    const badge = tags.length ? `<div class="p-tags">${tags.join('')}</div>` : '';

    const thumbInner = isCompare
      ? compareMarkup(
          item,
          item.antes || furniturePhoto(item, '-antes', 500, 375),
          item.depois || furniturePhoto(item, '-depois', 500, 375),
          50
        ) + '<button type="button" class="p-maximize" aria-label="Ampliar comparação">⤢</button>'
      : `<img src="${portfolioThumb(item)}" alt="${item.titulo}" loading="lazy">`;

    card.innerHTML = `
      <div class="p-thumb">${badge}${thumbInner}</div>
      <div class="p-info">
        <span class="cat">${item.categoria || ''}</span>
        <h4>${item.titulo}</h4>
        <span class="p-more">${isCompare ? 'Arraste para comparar' : `${photoCount(item)} fotos — clique para ver`}</span>
      </div>`;

    if (isCompare){
      wireCompareDrag(card.querySelector('.compare'));
      card.querySelector('.p-maximize').addEventListener('click', (e) => {
        e.stopPropagation();
        openLightbox(item);
      });
      card.querySelector('.p-info').addEventListener('click', () => openLightbox(item));
    } else {
      card.addEventListener('click', () => openLightbox(item));
    }

    grid.appendChild(card);
    io.observe(card);
    requestAnimationFrame(() => card.classList.add('in'));
  });
}

/* ---------- Lightbox ---------- */
const lightbox = document.getElementById('lightbox');
const lightboxImage = document.getElementById('lightboxImage');
const lightboxCat = document.getElementById('lightboxCat');
const lightboxTitle = document.getElementById('lightboxTitle');
const lightboxCount = document.getElementById('lightboxCount');
const lightboxPrev = document.getElementById('lightboxPrev');
const lightboxNext = document.getElementById('lightboxNext');
let currentProject = null;
let currentPhoto = 0;

function setComparePos(compare, afterLayer, handle, clientX){
  const rect = compare.getBoundingClientRect();
  let pct = ((clientX - rect.left) / rect.width) * 100;
  pct = Math.max(0, Math.min(100, pct));
  afterLayer.style.clipPath = `inset(0 0 0 ${pct}%)`;
  handle.style.left = pct + '%';
}

/* Pointer Events unify mouse/touch/pen in one listener set, scoped to the element itself
   (setPointerCapture) — no window-level listeners to leak across repeated re-renders. */
function wireCompareDrag(compare){
  const afterLayer = compare.querySelector('.after');
  const handle = compare.querySelector('.handle');
  const onMove = (e) => setComparePos(compare, afterLayer, handle, e.clientX);

  compare.addEventListener('dragstart', e => e.preventDefault());
  compare.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    compare.setPointerCapture(e.pointerId);
    onMove(e);
    compare.addEventListener('pointermove', onMove);
  });
  const stop = () => compare.removeEventListener('pointermove', onMove);
  compare.addEventListener('pointerup', stop);
  compare.addEventListener('pointercancel', stop);
}

function compareMarkup(item, beforeSrc, afterSrc, initialPct){
  return `
    <div class="compare">
      <div class="layer before">
        <img src="${beforeSrc}" alt="Antes — ${item.titulo}" draggable="false">
        <span class="layer-tag">Antes</span>
      </div>
      <div class="layer after" style="clip-path:inset(0 0 0 ${initialPct}%);">
        <img src="${afterSrc}" alt="Depois — ${item.titulo}" draggable="false">
        <span class="layer-tag">Depois</span>
      </div>
      <div class="handle" style="left:${initialPct}%;"></div>
    </div>`;
}

function renderCompareLightbox(item){
  const beforeSrc = item.antes || furniturePhoto(item, '-antes', 700, 525);
  const afterSrc = item.depois || furniturePhoto(item, '-depois', 700, 525);

  lightboxImage.innerHTML = compareMarkup(item, beforeSrc, afterSrc, 50);
  wireCompareDrag(lightboxImage.querySelector('.compare'));

  lightboxCat.textContent = item.categoria || '';
  lightboxTitle.textContent = item.titulo;
  lightboxCount.textContent = item.nota || 'Antes e depois';
}

function renderGalleryLightbox(item){
  let src;
  if (Array.isArray(item.fotos)) src = item.fotos[currentPhoto];
  else src = furniturePhoto(item, '-' + currentPhoto, 900, 675);
  lightboxImage.innerHTML = `<img src="${src}" alt="${item.titulo} — foto ${currentPhoto + 1}" loading="lazy">`;
  lightboxCat.textContent = item.categoria || '';
  lightboxTitle.textContent = item.titulo;
  lightboxCount.textContent = `${currentPhoto + 1} / ${photoCount(item)}`;
}

function openLightbox(item){
  currentProject = item;
  currentPhoto = 0;
  const isCompare = item.tipo === 'antes_depois';
  lightbox.classList.toggle('compare-mode', isCompare);
  if (isCompare) renderCompareLightbox(item);
  else renderGalleryLightbox(item);
  lightbox.classList.add('open');
  lightbox.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeLightbox(){
  lightbox.classList.remove('open');
  lightbox.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

document.getElementById('lightboxClose').addEventListener('click', closeLightbox);
lightbox.addEventListener('click', e => { if (e.target === lightbox) closeLightbox(); });
lightboxPrev.addEventListener('click', () => {
  if (!currentProject || currentProject.tipo === 'antes_depois') return;
  currentPhoto = (currentPhoto - 1 + photoCount(currentProject)) % photoCount(currentProject);
  renderGalleryLightbox(currentProject);
});
lightboxNext.addEventListener('click', () => {
  if (!currentProject || currentProject.tipo === 'antes_depois') return;
  currentPhoto = (currentPhoto + 1) % photoCount(currentProject);
  renderGalleryLightbox(currentProject);
});
window.addEventListener('keydown', e => {
  if (!lightbox.classList.contains('open')) return;
  if (e.key === 'Escape') closeLightbox();
  if (e.key === 'ArrowLeft') lightboxPrev.click();
  if (e.key === 'ArrowRight') lightboxNext.click();
});

/* ---------- Render everything, then try to overlay live config from Firebase ---------- */
function renderAll(cfg){
  siteConfig = cfg;
  renderServicos(cfg);
  currentPortfolioList = buildPortfolioList(cfg.servicos, cfg.settings);
  renderFilters(currentPortfolioList);
  currentFilter = 'all';
  renderPortfolio();
  observeReveal(document);
}

renderAll({ servicos: defaultServicos });

if (typeof wocDb !== 'undefined' && wocDb){
  wocDb.ref('siteConfig').once('value')
    .then(snapshot => {
      const remote = snapshot.val();
      if (!remote || !remote.servicos) return;
      const servicos = Object.entries(remote.servicos).map(([id, s]) => ({ id, ...s }));
      if (servicos.length) renderAll({ servicos, settings: remote.settings });
    })
    .catch(err => console.warn('Não foi possível carregar configurações do site:', err));
}

// Footer year
document.getElementById('year-copy').textContent =
  `© ${new Date().getFullYear()} WOC Estofados. Todos os direitos reservados.`;
