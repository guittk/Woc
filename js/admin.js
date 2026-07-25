const WHATSAPP_NUMBER = '5515996472451';

function formatDate(iso){
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR') + ' às ' + d.toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'});
}

function whatsappLink(telefone, nome){
  const digits = telefone.replace(/\D/g, '');
  const withCountry = digits.startsWith('55') ? digits : '55' + digits;
  const message = `Olá ${nome.split(' ')[0]}! Vimos seu pedido de orçamento na W.O.C. Estofados e vamos te passar os detalhes.`;
  return `https://wa.me/${withCountry}?text=${encodeURIComponent(message)}`;
}

const loginSection = document.getElementById('loginSection');
const adminSection = document.getElementById('adminSection');
const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');

const listEl = document.getElementById('adminList');
const emptyEl = document.getElementById('adminEmpty');
const countEl = document.getElementById('adminCount');
let currentStatusFilter = 'all';
let currentRequests = [];
let ordersRef = null;

function render(){
  const all = currentRequests;
  const items = currentStatusFilter === 'all' ? all : all.filter(r => r.status === currentStatusFilter);

  countEl.textContent = `${all.length} solicitação(ões) no total`;
  listEl.innerHTML = '';

  if (all.length === 0){
    emptyEl.classList.add('show');
    return;
  }
  emptyEl.classList.remove('show');

  items.forEach(req => {
    const card = document.createElement('div');
    card.className = 'admin-card';

    const photosHtml = (req.fotos && req.fotos.length)
      ? `<div class="admin-photos">${req.fotos.map((src, i) => `<img src="${src}" alt="Foto ${i+1} de ${req.nome}" data-src="${src}">`).join('')}</div>`
      : `<p class="admin-no-photos">Nenhuma foto enviada.</p>`;

    card.innerHTML = `
      <div class="admin-card-head">
        <div>
          <h3>${req.nome} — ${req.tipo}</h3>
          <span class="admin-meta">${formatDate(req.data)} · ${req.telefone}</span>
        </div>
        <span class="admin-badge ${req.status}">${req.status === 'novo' ? 'Novo' : 'Respondido'}</span>
      </div>
      <div class="admin-grid-info">
        <div><h5>Situação atual</h5><p>${req.situacao}</p></div>
        <div><h5>O que precisa ser feito</h5><p>${req.necessidade}</p></div>
      </div>
      ${photosHtml}
      <div class="admin-actions">
        <a class="btn btn-primary" target="_blank" rel="noopener" href="${whatsappLink(req.telefone, req.nome)}">Responder no WhatsApp</a>
        <button class="btn btn-outline" data-action="toggle-status" data-id="${req.id}">
          ${req.status === 'novo' ? 'Marcar como respondido' : 'Marcar como novo'}
        </button>
        <button class="btn admin-btn-danger" data-action="delete" data-id="${req.id}">Excluir</button>
      </div>
    `;

    card.querySelectorAll('.admin-photos img').forEach(img => {
      img.addEventListener('click', () => window.open(img.dataset.src, '_blank'));
    });

    listEl.appendChild(card);
  });
}

listEl.addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-action]');
  if (!btn) return;
  const id = btn.dataset.id;

  if (btn.dataset.action === 'delete'){
    openConfirmModal('Excluir esta solicitação de orçamento?', () => wocDb.ref(`orcamentos/${id}`).remove());
  } else if (btn.dataset.action === 'toggle-status'){
    const req = currentRequests.find(r => r.id === id);
    if (!req) return;
    wocDb.ref(`orcamentos/${id}/status`).set(req.status === 'novo' ? 'respondido' : 'novo');
  }
});

document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentStatusFilter = btn.dataset.status;
    render();
  });
});

function startListening(){
  ordersRef = wocDb.ref('orcamentos');
  ordersRef.on('value', (snapshot) => {
    const data = snapshot.val() || {};
    currentRequests = Object.entries(data)
      .map(([id, req]) => ({ id, ...req }))
      .sort((a, b) => new Date(b.data) - new Date(a.data));
    render();
  });
}

function stopListening(){
  if (ordersRef) ordersRef.off();
  ordersRef = null;
  currentRequests = [];
}

/* ---------- Tabs ---------- */
document.querySelectorAll('.admin-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById('panelOrcamentos').style.display = tab.dataset.tab === 'orcamentos' ? '' : 'none';
    document.getElementById('panelConfig').style.display = tab.dataset.tab === 'config' ? '' : 'none';
  });
});

/* ---------- Image resize helper (reused for portfolio uploads) ---------- */
function resizeImage(file, maxSize){
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.78));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

/* ================= MODAIS (formulário + confirmação) ================= */
const confirmModalOverlay = document.getElementById('confirmModalOverlay');
const confirmModalMessage = document.getElementById('confirmModalMessage');
const confirmModalOk = document.getElementById('confirmModalOk');
const confirmModalCancel = document.getElementById('confirmModalCancel');
const confirmModalClose = document.getElementById('confirmModalClose');
let confirmCallback = null;

function openConfirmModal(message, onConfirm){
  confirmModalMessage.textContent = message;
  confirmCallback = onConfirm;
  confirmModalOverlay.classList.add('open');
}
function closeConfirmModal(){
  confirmModalOverlay.classList.remove('open');
  confirmCallback = null;
}
confirmModalOk.addEventListener('click', () => {
  const cb = confirmCallback;
  closeConfirmModal();
  if (cb) cb();
});
confirmModalCancel.addEventListener('click', closeConfirmModal);
confirmModalClose.addEventListener('click', closeConfirmModal);
confirmModalOverlay.addEventListener('click', (e) => { if (e.target === confirmModalOverlay) closeConfirmModal(); });

/* ================= CATEGORIAS ================= */
let categoriasCache = [];

const categoriasListEl = document.getElementById('categoriasList');
const categoriaForm = document.getElementById('categoriaForm');
const categoriaEditId = document.getElementById('categoriaEditId');
const categoriaLabelInput = document.getElementById('categoriaLabel');
const categoriaSubmitBtn = document.getElementById('categoriaSubmitBtn');
const categoriaCancelBtn = document.getElementById('categoriaCancelEdit');

function refreshCategoriaSelect(selectedLabel){
  // The <select> stores the categoria LABEL (not the Firebase push id) as its value —
  // that's exactly what gets saved on the serviço, matching the plain-text field this replaced.
  const select = document.getElementById('servicoCategoria');
  const current = selectedLabel !== undefined ? selectedLabel : select.value;
  select.innerHTML = categoriasCache.map(c => `<option value="${c.label}">${c.label}</option>`).join('');
  if (current && ![...select.options].some(o => o.value === current)){
    // Legacy/removed categoria still on this item — keep it selectable so editing doesn't silently change it.
    const opt = document.createElement('option');
    opt.value = current;
    opt.textContent = current + ' (categoria removida)';
    select.appendChild(opt);
  }
  if (current) select.value = current;
}

function renderCategorias(list){
  categoriasCache = list;
  categoriasListEl.innerHTML = list.map(c => `
    <div class="config-item">
      <div class="config-item-body"><strong>${c.label}</strong></div>
      <div class="config-item-actions">
        <button data-action="edit" data-id="${c.id}">Editar</button>
        <button data-action="delete" class="danger" data-id="${c.id}">Excluir</button>
      </div>
    </div>`).join('') || '<p class="admin-no-photos">Nenhuma categoria cadastrada.</p>';
  refreshCategoriaSelect();
}

categoriasListEl.addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-action]');
  if (!btn) return;
  const cat = categoriasCache.find(c => c.id === btn.dataset.id);
  if (!cat) return;
  if (btn.dataset.action === 'delete'){
    openConfirmModal(`Excluir a categoria "${cat.label}"? Trabalhos já cadastrados nela continuam salvos, mas ela some dos filtros e da lista de opções.`, () => {
      wocDb.ref(`siteConfig/categorias/${cat.id}`).remove();
    });
  } else if (btn.dataset.action === 'edit'){
    categoriaEditId.value = cat.id;
    categoriaLabelInput.value = cat.label;
    categoriaSubmitBtn.textContent = 'Salvar';
    categoriaCancelBtn.style.display = '';
  }
});

categoriaCancelBtn.addEventListener('click', () => {
  categoriaEditId.value = '';
  categoriaForm.reset();
  categoriaSubmitBtn.textContent = 'Adicionar';
  categoriaCancelBtn.style.display = 'none';
});

categoriaForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const label = categoriaLabelInput.value.trim();
  if (!label) return;
  const id = categoriaEditId.value;
  const ref = id ? wocDb.ref(`siteConfig/categorias/${id}`) : wocDb.ref('siteConfig/categorias').push();
  ref.set({ label }).then(() => {
    categoriaEditId.value = '';
    categoriaForm.reset();
    categoriaSubmitBtn.textContent = 'Adicionar';
    categoriaCancelBtn.style.display = 'none';
  });
});

/* ================= CONFIGURAÇÕES DO SITE — SERVIÇOS ================= */
/* Um serviço sem "tipo" é só um card em "O que fazemos". Um serviço com
   tipo (galeria/antes_depois) também aparece em "Trabalhos realizados". */
let configRefs = [];
let servicosCache = [];
let pendingFotos = [];
let pendingAntes = null;
let pendingDepois = null;

const marketingListEl = document.getElementById('marketingList');
const antesDepoisListEl = document.getElementById('antesDepoisList');
const galeriaListEl = document.getElementById('galeriaList');
const marketingCountEl = document.getElementById('marketingCount');
const antesDepoisCountEl = document.getElementById('antesDepoisCount');
const galeriaCountEl = document.getElementById('galeriaCount');

const formModalOverlay = document.getElementById('formModalOverlay');
const formModalTitle = document.getElementById('formModalTitle');
const formModalClose = document.getElementById('formModalClose');
const formModalCancel = document.getElementById('formModalCancel');
const servicoForm = document.getElementById('servicoForm');
const servicoEditId = document.getElementById('servicoEditId');
const servicoContextInput = document.getElementById('servicoContext');
const servicoCategoriaInput = document.getElementById('servicoCategoria');
const campoCategoria = document.getElementById('campoCategoria');
const campoGaleria = document.getElementById('campoGaleria');
const campoAntesDepois = document.getElementById('campoAntesDepois');
const servicoStatus = document.getElementById('servicoStatus');

function renderThumbPreview(container, urls){
  container.innerHTML = urls.map(u => `<div class="orc-thumb"><img src="${u}"></div>`).join('');
}

document.getElementById('servicoFotos').addEventListener('change', async (e) => {
  const files = Array.from(e.target.files);
  for (const file of files) pendingFotos.push(await resizeImage(file, 900));
  renderThumbPreview(document.getElementById('servicoFotosPreview'), pendingFotos);
  e.target.value = '';
});
document.getElementById('servicoAntes').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  pendingAntes = await resizeImage(file, 900);
  renderThumbPreview(document.getElementById('servicoAntesPreview'), [pendingAntes]);
});
document.getElementById('servicoDepois').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  pendingDepois = await resizeImage(file, 900);
  renderThumbPreview(document.getElementById('servicoDepoisPreview'), [pendingDepois]);
});

const CONTEXT_TITLES = {
  servico: 'serviço',
  antes_depois: 'antes/depois',
  galeria: 'trabalho (galeria)',
};

function openFormModal(context, existing){
  servicoForm.reset();
  servicoEditId.value = existing ? existing.id : '';
  servicoContextInput.value = context;
  pendingFotos = [];
  pendingAntes = null;
  pendingDepois = null;
  document.getElementById('servicoFotosPreview').innerHTML = '';
  document.getElementById('servicoAntesPreview').innerHTML = '';
  document.getElementById('servicoDepoisPreview').innerHTML = '';
  servicoStatus.textContent = '';

  campoCategoria.style.display = context === 'servico' ? 'none' : '';
  campoGaleria.style.display = context === 'galeria' ? '' : 'none';
  campoAntesDepois.style.display = context === 'antes_depois' ? 'flex' : 'none';

  formModalTitle.textContent = (existing ? 'Editar ' : 'Novo ') + CONTEXT_TITLES[context];
  refreshCategoriaSelect(existing ? (existing.categoria || '') : '');

  if (existing){
    document.getElementById('servicoIcon').value = existing.icon || 'generic';
    document.getElementById('servicoTitulo').value = existing.titulo;
    document.getElementById('servicoTexto').value = existing.texto;
    if (context === 'antes_depois'){
      pendingAntes = existing.antes || null;
      pendingDepois = existing.depois || null;
      document.getElementById('servicoNota').value = existing.nota || '';
      if (pendingAntes) renderThumbPreview(document.getElementById('servicoAntesPreview'), [pendingAntes]);
      if (pendingDepois) renderThumbPreview(document.getElementById('servicoDepoisPreview'), [pendingDepois]);
    } else if (context === 'galeria'){
      pendingFotos = (existing.fotos || []).slice();
      renderThumbPreview(document.getElementById('servicoFotosPreview'), pendingFotos);
    }
  }

  formModalOverlay.classList.add('open');
}
function closeFormModal(){
  formModalOverlay.classList.remove('open');
}
formModalClose.addEventListener('click', closeFormModal);
formModalCancel.addEventListener('click', closeFormModal);
formModalOverlay.addEventListener('click', (e) => { if (e.target === formModalOverlay) closeFormModal(); });

document.getElementById('addMarketingBtn').addEventListener('click', () => openFormModal('servico'));
document.getElementById('addAntesDepoisBtn').addEventListener('click', () => openFormModal('antes_depois'));
document.getElementById('addGaleriaBtn').addEventListener('click', () => openFormModal('galeria'));

function servicoListItemHtml(s){
  const thumb = s.tipo === 'antes_depois' ? s.depois : (s.fotos && s.fotos[0]);
  const catPart = s.categoria ? ` · ${s.categoria}` : '';
  return `
    <div class="config-item">
      ${thumb ? `<img class="config-item-thumb" src="${thumb}">` : ''}
      <div class="config-item-body"><strong>${s.titulo}</strong><span>${s.texto}</span>${catPart ? `<span>${s.categoria}</span>` : ''}</div>
      <div class="config-item-actions">
        <button data-action="edit" data-id="${s.id}">Editar</button>
        <button data-action="delete" class="danger" data-id="${s.id}">Excluir</button>
      </div>
    </div>`;
}

function renderServicosLists(list){
  servicosCache = list;
  const marketing = list.filter(s => !s.tipo);
  const antesDepois = list.filter(s => s.tipo === 'antes_depois');
  const galeria = list.filter(s => s.tipo === 'galeria');

  marketingCountEl.textContent = `(${marketing.length})`;
  antesDepoisCountEl.textContent = `(${antesDepois.length})`;
  galeriaCountEl.textContent = `(${galeria.length})`;

  marketingListEl.innerHTML = marketing.map(servicoListItemHtml).join('') || '<p class="admin-no-photos">Nenhum serviço cadastrado.</p>';
  antesDepoisListEl.innerHTML = antesDepois.map(servicoListItemHtml).join('') || '<p class="admin-no-photos">Nenhum antes/depois cadastrado — o site mostra exemplos ilustrativos até o mínimo configurado.</p>';
  galeriaListEl.innerHTML = galeria.map(servicoListItemHtml).join('') || '<p class="admin-no-photos">Nenhum trabalho cadastrado — o site mostra exemplos ilustrativos até o mínimo configurado.</p>';
}

function handleListClick(e){
  const btn = e.target.closest('button[data-action]');
  if (!btn) return;
  const s = servicosCache.find(s => s.id === btn.dataset.id);
  if (!s) return;
  const context = s.tipo === 'antes_depois' ? 'antes_depois' : (s.tipo === 'galeria' ? 'galeria' : 'servico');
  if (btn.dataset.action === 'delete'){
    openConfirmModal(`Excluir "${s.titulo}"? Essa ação não pode ser desfeita.`, () => wocDb.ref(`siteConfig/servicos/${s.id}`).remove());
  } else if (btn.dataset.action === 'edit'){
    openFormModal(context, s);
  }
}
marketingListEl.addEventListener('click', handleListClick);
antesDepoisListEl.addEventListener('click', handleListClick);
galeriaListEl.addEventListener('click', handleListClick);

servicoForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const context = servicoContextInput.value;
  const tipo = context === 'servico' ? '' : context;
  const servico = {
    icon: document.getElementById('servicoIcon').value,
    titulo: document.getElementById('servicoTitulo').value.trim(),
    texto: document.getElementById('servicoTexto').value.trim(),
    categoria: context === 'servico' ? '' : servicoCategoriaInput.value.trim(),
    tipo,
  };
  if (!servico.titulo || !servico.texto) return;

  if (tipo === 'antes_depois'){
    if (!pendingAntes || !pendingDepois){
      servicoStatus.textContent = 'Envie as duas fotos (antes e depois).';
      return;
    }
    servico.antes = pendingAntes;
    servico.depois = pendingDepois;
    servico.nota = document.getElementById('servicoNota').value.trim();
  } else if (tipo === 'galeria'){
    if (!pendingFotos.length){
      servicoStatus.textContent = 'Envie pelo menos uma foto.';
      return;
    }
    servico.fotos = pendingFotos;
  }

  const id = servicoEditId.value;
  const ref = id ? wocDb.ref(`siteConfig/servicos/${id}`) : wocDb.ref('siteConfig/servicos').push();
  ref.set(servico).then(() => {
    closeFormModal();
  }).catch((err) => {
    servicoStatus.textContent = 'Erro ao salvar. Tente com fotos menores.';
    console.error(err);
  });
});

/* ---- Configurações gerais (mínimos de trabalhos exibidos + contato) ---- */
/* Ambos os formulários gravam no mesmo nó siteConfig/settings, então cada um
   parte do último valor conhecido (settingsCache) para não apagar os campos do outro. */
const settingsForm = document.getElementById('settingsForm');
const settingsStatus = document.getElementById('settingsStatus');
const minAntesDepoisInput = document.getElementById('minAntesDepois');
const minGaleriaInput = document.getElementById('minGaleria');

const contatoForm = document.getElementById('contatoForm');
const contatoStatus = document.getElementById('contatoStatus');
const cfgWhatsappInput = document.getElementById('cfgWhatsapp');
const cfgEnderecoInput = document.getElementById('cfgEndereco');
const cfgHorarioInput = document.getElementById('cfgHorario');

const sectionsForm = document.getElementById('sectionsForm');
const sectionsStatus = document.getElementById('sectionsStatus');
const SECTION_CHECKBOXES = {
  portfolio: document.getElementById('secPortfolio'),
  servicos: document.getElementById('secServicos'),
  comoFunciona: document.getElementById('secComoFunciona'),
  sobre: document.getElementById('secSobre'),
  depoimentos: document.getElementById('secDepoimentos'),
};
const DEFAULT_SECTIONS = { portfolio: true, servicos: true, comoFunciona: true, sobre: true, depoimentos: true };

let settingsCache = {};

settingsForm.addEventListener('submit', (e) => {
  e.preventDefault();
  settingsCache.minAntesDepois = Number(minAntesDepoisInput.value) || 0;
  settingsCache.minGaleria = Number(minGaleriaInput.value) || 0;
  wocDb.ref('siteConfig/settings').set(settingsCache).then(() => {
    settingsStatus.textContent = 'Salvo!';
    setTimeout(() => settingsStatus.textContent = '', 2000);
  });
});

sectionsForm.addEventListener('submit', (e) => {
  e.preventDefault();
  settingsCache.sections = {};
  Object.entries(SECTION_CHECKBOXES).forEach(([key, checkbox]) => {
    settingsCache.sections[key] = checkbox.checked;
  });
  wocDb.ref('siteConfig/settings').set(settingsCache).then(() => {
    sectionsStatus.textContent = 'Salvo!';
    setTimeout(() => sectionsStatus.textContent = '', 2000);
  });
});

contatoForm.addEventListener('submit', (e) => {
  e.preventDefault();
  settingsCache.whatsapp = cfgWhatsappInput.value.trim().replace(/\D/g, '');
  settingsCache.endereco = cfgEnderecoInput.value.trim();
  settingsCache.horario = cfgHorarioInput.value.trim();
  wocDb.ref('siteConfig/settings').set(settingsCache).then(() => {
    contatoStatus.textContent = 'Salvo!';
    setTimeout(() => contatoStatus.textContent = '', 2000);
  });
});

/* ================= DEPOIMENTOS ================= */
let depoimentosCache = [];
const depoimentosListEl = document.getElementById('depoimentosList');
const depoimentosCountEl = document.getElementById('depoimentosCount');
const depoimentoModalOverlay = document.getElementById('depoimentoModalOverlay');
const depoimentoModalClose = document.getElementById('depoimentoModalClose');
const depoimentoModalCancel = document.getElementById('depoimentoModalCancel');
const depoimentoModalTitle = document.getElementById('depoimentoModalTitle');
const depoimentoForm = document.getElementById('depoimentoForm');
const depoimentoEditId = document.getElementById('depoimentoEditId');

function openDepoimentoModal(existing){
  depoimentoForm.reset();
  depoimentoEditId.value = existing ? existing.id : '';
  depoimentoModalTitle.textContent = existing ? 'Editar depoimento' : 'Novo depoimento';
  if (existing){
    document.getElementById('depoimentoNome').value = existing.nome;
    document.getElementById('depoimentoServico').value = existing.servico;
    document.getElementById('depoimentoTexto').value = existing.texto;
  }
  depoimentoModalOverlay.classList.add('open');
}
function closeDepoimentoModal(){ depoimentoModalOverlay.classList.remove('open'); }
depoimentoModalClose.addEventListener('click', closeDepoimentoModal);
depoimentoModalCancel.addEventListener('click', closeDepoimentoModal);
depoimentoModalOverlay.addEventListener('click', (e) => { if (e.target === depoimentoModalOverlay) closeDepoimentoModal(); });
document.getElementById('addDepoimentoBtn').addEventListener('click', () => openDepoimentoModal(null));

function renderDepoimentos(list){
  depoimentosCache = list;
  depoimentosCountEl.textContent = `(${list.length})`;
  depoimentosListEl.innerHTML = list.map(t => `
    <div class="config-item">
      <div class="config-item-body"><strong>${t.nome}</strong><span>${t.servico}</span><span>${t.texto}</span></div>
      <div class="config-item-actions">
        <button data-action="edit" data-id="${t.id}">Editar</button>
        <button data-action="delete" class="danger" data-id="${t.id}">Excluir</button>
      </div>
    </div>`).join('') || '<p class="admin-no-photos">Nenhum depoimento cadastrado.</p>';
}

depoimentosListEl.addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-action]');
  if (!btn) return;
  const t = depoimentosCache.find(t => t.id === btn.dataset.id);
  if (!t) return;
  if (btn.dataset.action === 'delete'){
    openConfirmModal(`Excluir o depoimento de "${t.nome}"?`, () => wocDb.ref(`siteConfig/depoimentos/${t.id}`).remove());
  } else if (btn.dataset.action === 'edit'){
    openDepoimentoModal(t);
  }
});

depoimentoForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const nome = document.getElementById('depoimentoNome').value.trim();
  const depoimento = {
    nome,
    servico: document.getElementById('depoimentoServico').value.trim(),
    texto: document.getElementById('depoimentoTexto').value.trim(),
    iniciais: nome.split(' ').filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join(''),
  };
  const id = depoimentoEditId.value;
  const ref = id ? wocDb.ref(`siteConfig/depoimentos/${id}`) : wocDb.ref('siteConfig/depoimentos').push();
  ref.set(depoimento).then(closeDepoimentoModal);
});

const SEED_SERVICOS = {
  s1: { icon: 'sofa', titulo: 'Reforma de Sofás', texto: 'Estrutura revisada, espuma renovada e tecido novo — o sofá volta a ficar como no primeiro dia.' },
  s2: { icon: 'cadeira', titulo: 'Reforma de Assentos de Cadeiras', texto: 'Reforço da base, nova espuma e acabamento sob medida para o design de cada cadeira.' },
  s3: { icon: 'cabeceira', titulo: 'Cabeceiras Estofadas', texto: 'Cabeceiras capitonê ou lisas, com o tecido e o volume que combinam com o quarto.' },
  s4: { icon: 'banco', titulo: 'Bancos', texto: 'Bancos de cozinha, bar ou área externa, com estofamento firme e durável.' },
  s5: { icon: 'puf', titulo: 'Pufes', texto: 'Renovação completa de pufes redondos, retangulares ou baú, com nova espuma interna.' },
  s6: { icon: 'placa', titulo: 'Placas Estofadas', texto: 'Painéis capitonê para cabeceiras e paredes, produzidos sob medida.' },
  s7: { icon: 'almofada', titulo: 'Almofadas', texto: 'Enchimento e capas novas, no tamanho e tecido que você escolher.' },
  s8: { icon: 'tecido', titulo: 'Troca de Tecido', texto: 'Amplo catálogo de tecidos e couros para renovar a cor e o estilo do estofado.' },
  s9: { icon: 'espuma', titulo: 'Troca de Espuma', texto: 'Espumas de densidade adequada para recuperar o conforto e a firmeza do assento.' },
  s10: { icon: 'reparo', titulo: 'Reparos em Geral', texto: 'Costuras, ferragens, molas e pequenos consertos que devolvem a estrutura ao lugar.' },
  s11: { icon: 'acabamento', titulo: 'Acabamento Premium', texto: 'Detalhes de costura, alinhamento e acabamento que fazem a diferença de perto.' },
};

const SEED_SETTINGS = {
  minAntesDepois: 3,
  minGaleria: 6,
  whatsapp: '5515996472451',
  endereco: 'Endereço a confirmar',
  horario: 'Seg. a Sáb. — 8h às 18h',
  sections: { ...DEFAULT_SECTIONS },
};
const SEED_CATEGORIAS = {
  sofas: { label: 'Sofás' },
  cadeiras: { label: 'Cadeiras' },
  cabeceiras: { label: 'Cabeceiras' },
  pufes: { label: 'Pufes & Bancos' },
};
const SEED_DEPOIMENTOS = {
  d1: { iniciais: 'MF', nome: 'Marina F.', servico: 'Reforma de sofá', texto: 'O sofá voltou parecendo novo. O acabamento ficou melhor do que eu esperava e o prazo foi respeitado.' },
  d2: { iniciais: 'RC', nome: 'Rodrigo C.', servico: 'Cadeiras de jantar', texto: 'Troquei o tecido de quatro cadeiras e o resultado foi impecável. Atendimento atencioso do início ao fim.' },
  d3: { iniciais: 'AL', nome: 'Ana L.', servico: 'Cabeceira estofada', texto: 'Pedi orçamento pelo WhatsApp e todo o processo foi simples. A cabeceira ficou linda.' },
};

function startConfigListening(){
  const servicosRef = wocDb.ref('siteConfig/servicos');
  const settingsRef = wocDb.ref('siteConfig/settings');
  const categoriasRef = wocDb.ref('siteConfig/categorias');
  const depoimentosRef = wocDb.ref('siteConfig/depoimentos');

  servicosRef.once('value').then((snap) => {
    if (snap.val() === null) wocDb.ref('siteConfig/servicos').set(SEED_SERVICOS);
  });
  settingsRef.once('value').then((snap) => {
    if (snap.val() === null) wocDb.ref('siteConfig/settings').set(SEED_SETTINGS);
  });
  categoriasRef.once('value').then((snap) => {
    if (snap.val() === null) wocDb.ref('siteConfig/categorias').set(SEED_CATEGORIAS);
  });
  depoimentosRef.once('value').then((snap) => {
    if (snap.val() === null) wocDb.ref('siteConfig/depoimentos').set(SEED_DEPOIMENTOS);
  });

  servicosRef.on('value', (snap) => {
    const data = snap.val() || {};
    renderServicosLists(Object.entries(data).map(([id, s]) => ({ id, ...s })));
  });
  settingsRef.on('value', (snap) => {
    settingsCache = snap.val() || SEED_SETTINGS;
    minAntesDepoisInput.value = settingsCache.minAntesDepois;
    minGaleriaInput.value = settingsCache.minGaleria;
    cfgWhatsappInput.value = settingsCache.whatsapp || SEED_SETTINGS.whatsapp;
    cfgEnderecoInput.value = settingsCache.endereco || SEED_SETTINGS.endereco;
    cfgHorarioInput.value = settingsCache.horario || SEED_SETTINGS.horario;
    const sections = { ...DEFAULT_SECTIONS, ...(settingsCache.sections || {}) };
    Object.entries(SECTION_CHECKBOXES).forEach(([key, checkbox]) => {
      checkbox.checked = sections[key] !== false;
    });
  });
  categoriasRef.on('value', (snap) => {
    const data = snap.val() || {};
    renderCategorias(Object.entries(data).map(([id, c]) => ({ id, ...c })));
  });
  depoimentosRef.on('value', (snap) => {
    const data = snap.val() || {};
    renderDepoimentos(Object.entries(data).map(([id, d]) => ({ id, ...d })));
  });

  configRefs = [servicosRef, settingsRef, categoriasRef, depoimentosRef];
}

function stopConfigListening(){
  configRefs.forEach(ref => ref.off());
  configRefs = [];
}

/* ---------- Auth ---------- */
loginForm.addEventListener('submit', (e) => {
  e.preventDefault();
  loginError.style.display = 'none';
  loginBtn.disabled = true;
  loginBtn.textContent = 'Entrando...';

  wocAuth.signInWithEmailAndPassword(loginForm.email.value.trim(), loginForm.password.value)
    .catch((err) => {
      loginError.textContent = 'E-mail ou senha inválidos.';
      loginError.style.display = 'block';
    })
    .finally(() => {
      loginBtn.disabled = false;
      loginBtn.textContent = 'Entrar';
    });
});

logoutBtn.addEventListener('click', () => {
  wocAuth.signOut();
});

wocAuth.onAuthStateChanged((user) => {
  if (user){
    loginSection.style.display = 'none';
    adminSection.style.display = '';
    logoutBtn.style.display = '';
    loginForm.reset();
    startListening();
    startConfigListening();
  } else {
    loginSection.style.display = '';
    adminSection.style.display = 'none';
    logoutBtn.style.display = 'none';
    stopListening();
    stopConfigListening();
  }
});
