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
const revealEls = document.querySelectorAll('.reveal');
const io = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
}, { threshold: 0.15 });
revealEls.forEach(el => io.observe(el));

/* ---------- Placeholder photos (picsum.photos, fixed seeds so images stay stable) ---------- */
function slugify(text){
  return text.toString().toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}
function picsumUrl(seed, w, h, extra){
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/${w}/${h}${extra ? '?' + extra : ''}`;
}

/* ---------- Before / After (multiple sliders) ---------- */
const beforeAfterData = [
  { label: 'Sofá 3 lugares', note: 'Linho cru' },
  { label: 'Poltrona', note: 'Veludo verde' },
  { label: 'Cadeira de jantar', note: 'Couro sintético' },
  { label: 'Cabeceira casal', note: 'Capitonê linho' },
];

function setComparePos(compare, afterLayer, handle, clientX){
  const rect = compare.getBoundingClientRect();
  let pct = ((clientX - rect.left) / rect.width) * 100;
  pct = Math.max(0, Math.min(100, pct));
  afterLayer.style.clipPath = `inset(0 0 0 ${pct}%)`;
  handle.style.left = pct + '%';
}

function buildCompareSlider(item){
  const seed = slugify(item.label);
  const beforeSrc = picsumUrl(seed + '-antes', 500, 375, 'grayscale&blur=1');
  const afterSrc = picsumUrl(seed + '-depois', 500, 375);

  const wrap = document.createElement('div');
  wrap.className = 'ba-item reveal';
  wrap.innerHTML = `
    <div class="compare">
      <div class="layer before">
        <img src="${beforeSrc}" alt="Antes — ${item.label}" loading="lazy">
        <span class="layer-tag">Antes</span>
      </div>
      <div class="layer after">
        <img src="${afterSrc}" alt="Depois — ${item.label}" loading="lazy">
        <span class="layer-tag">Depois</span>
      </div>
      <div class="handle"></div>
    </div>
    <div class="ba-caption">
      <strong>${item.label}</strong>
      <span>${item.note}</span>
    </div>`;

  const compare = wrap.querySelector('.compare');
  const afterLayer = wrap.querySelector('.after');
  const handle = wrap.querySelector('.handle');
  handle.style.left = '50%';

  let dragging = false;
  compare.addEventListener('mousedown', e => { dragging = true; setComparePos(compare, afterLayer, handle, e.clientX); });
  window.addEventListener('mousemove', e => { if (dragging) setComparePos(compare, afterLayer, handle, e.clientX); });
  window.addEventListener('mouseup', () => dragging = false);
  compare.addEventListener('touchstart', e => { dragging = true; setComparePos(compare, afterLayer, handle, e.touches[0].clientX); }, {passive:true});
  compare.addEventListener('touchmove', e => { if (dragging) setComparePos(compare, afterLayer, handle, e.touches[0].clientX); }, {passive:true});
  window.addEventListener('touchend', () => dragging = false);

  return wrap;
}

const baGrid = document.getElementById('baGrid');
beforeAfterData.forEach(item => {
  const el = buildCompareSlider(item);
  baGrid.appendChild(el);
  io.observe(el);
});

/* ---------- Portfolio data + filter + lightbox ---------- */
const portfolioData = [
  {cat:'sofas', label:'Sofás', title:'Sofá 3 lugares — linho cru', photos:4},
  {cat:'sofas', label:'Sofás', title:'Sofá retrátil — couro sintético', photos:3},
  {cat:'cadeiras', label:'Cadeiras', title:'Jogo de 6 cadeiras — veludo', photos:5},
  {cat:'cadeiras', label:'Cadeiras', title:'Cadeira de escritório — courino', photos:2},
  {cat:'cabeceiras', label:'Cabeceiras', title:'Cabeceira capitonê — casal', photos:3},
  {cat:'cabeceiras', label:'Cabeceiras', title:'Cabeceira lisa — queen', photos:2},
  {cat:'pufes', label:'Pufes & Bancos', title:'Puf redondo — suede', photos:3},
  {cat:'pufes', label:'Pufes & Bancos', title:'Banco de cozinha — par', photos:2},
  {cat:'sofas', label:'Sofás', title:'Poltrona — linho bege', photos:4},
];

const grid = document.getElementById('portfolioGrid');

function renderPortfolio(filter){
  grid.innerHTML = '';
  const items = portfolioData.filter(p => filter === 'all' || p.cat === filter);

  if (filter === 'proprios' || items.length === 0){
    const empty = document.createElement('p');
    empty.className = 'section-sub reveal';
    empty.style.gridColumn = '1 / -1';
    empty.textContent = filter === 'proprios'
      ? 'Em breve: sofás e estofados de produção própria da WOC aparecerão aqui.'
      : 'Nenhum trabalho nessa categoria ainda.';
    grid.appendChild(empty);
    io.observe(empty);
    requestAnimationFrame(() => empty.classList.add('in'));
    return;
  }

  items.forEach((p) => {
      const seed = slugify(p.title);
      const thumbSrc = picsumUrl(seed, 500, 375);
      const card = document.createElement('div');
      card.className = 'p-card reveal';
      card.innerHTML = `
        <div class="p-thumb"><img src="${thumbSrc}" alt="${p.title}" loading="lazy"></div>
        <div class="p-info">
          <span class="cat">${p.label}</span>
          <h4>${p.title}</h4>
          <span class="p-more">${p.photos} fotos — clique para ver</span>
        </div>`;
      card.addEventListener('click', () => openLightbox(p));
      grid.appendChild(card);
      io.observe(card);
      requestAnimationFrame(() => card.classList.add('in'));
  });
}
renderPortfolio('all');

document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderPortfolio(btn.dataset.filter);
  });
});

/* ---------- Lightbox ---------- */
const lightbox = document.getElementById('lightbox');
const lightboxImage = document.getElementById('lightboxImage');
const lightboxCat = document.getElementById('lightboxCat');
const lightboxTitle = document.getElementById('lightboxTitle');
const lightboxCount = document.getElementById('lightboxCount');
let currentProject = null;
let currentPhoto = 0;

function renderLightboxPhoto(){
  const seed = slugify(currentProject.title) + '-' + currentPhoto;
  const src = picsumUrl(seed, 900, 675);
  lightboxImage.innerHTML = `<img src="${src}" alt="${currentProject.title} — foto ${currentPhoto + 1}" loading="lazy">`;
  lightboxCat.textContent = currentProject.label;
  lightboxTitle.textContent = currentProject.title;
  lightboxCount.textContent = `${currentPhoto + 1} / ${currentProject.photos}`;
}

function openLightbox(project){
  currentProject = project;
  currentPhoto = 0;
  renderLightboxPhoto();
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
document.getElementById('lightboxPrev').addEventListener('click', () => {
  currentPhoto = (currentPhoto - 1 + currentProject.photos) % currentProject.photos;
  renderLightboxPhoto();
});
document.getElementById('lightboxNext').addEventListener('click', () => {
  currentPhoto = (currentPhoto + 1) % currentProject.photos;
  renderLightboxPhoto();
});
window.addEventListener('keydown', e => {
  if (!lightbox.classList.contains('open')) return;
  if (e.key === 'Escape') closeLightbox();
  if (e.key === 'ArrowLeft') document.getElementById('lightboxPrev').click();
  if (e.key === 'ArrowRight') document.getElementById('lightboxNext').click();
});

// Footer year
document.getElementById('year-copy').textContent =
  `© ${new Date().getFullYear()} WOC Estofados. Todos os direitos reservados.`;
