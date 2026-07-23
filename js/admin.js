const STORAGE_KEY = 'wocOrcamentos';
const WHATSAPP_NUMBER = '5515996472451';

function loadRequests(){
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
}
function saveRequests(list){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function formatDate(iso){
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR') + ' às ' + d.toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'});
}

function whatsappLink(telefone, nome){
  const digits = telefone.replace(/\D/g, '');
  const withCountry = digits.startsWith('55') ? digits : '55' + digits;
  const message = `Olá ${nome.split(' ')[0]}! Vimos seu pedido de orçamento na WOC Estofados e vamos te passar os detalhes.`;
  return `https://wa.me/${withCountry}?text=${encodeURIComponent(message)}`;
}

const listEl = document.getElementById('adminList');
const emptyEl = document.getElementById('adminEmpty');
const countEl = document.getElementById('adminCount');
let currentStatusFilter = 'all';

function render(){
  const all = loadRequests();
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
  const id = Number(btn.dataset.id);
  let all = loadRequests();

  if (btn.dataset.action === 'delete'){
    if (!confirm('Excluir esta solicitação de orçamento?')) return;
    all = all.filter(r => r.id !== id);
  } else if (btn.dataset.action === 'toggle-status'){
    all = all.map(r => r.id === id ? {...r, status: r.status === 'novo' ? 'respondido' : 'novo'} : r);
  }

  saveRequests(all);
  render();
});

document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentStatusFilter = btn.dataset.status;
    render();
  });
});

render();
