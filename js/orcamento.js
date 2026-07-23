// Mobile menu
const burger = document.getElementById('burger');
const panel = document.getElementById('mobilePanel');
burger.addEventListener('click', () => panel.classList.toggle('open'));
panel.querySelectorAll('a').forEach(a => a.addEventListener('click', () => panel.classList.remove('open')));

// Footer year
const yearEl = document.getElementById('year-copy');
if (yearEl) yearEl.textContent = `© ${new Date().getFullYear()} WOC Estofados. Todos os direitos reservados.`;

/* ---------- Photo previews (resized to keep localStorage small) ---------- */
const fotosInput = document.getElementById('fotos');
const orcPreview = document.getElementById('orcPreview');
let selectedPhotos = []; // array of dataURLs

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
        resolve(canvas.toDataURL('image/jpeg', 0.72));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

function renderPreviews(){
  orcPreview.innerHTML = '';
  selectedPhotos.forEach((dataUrl, idx) => {
    const thumb = document.createElement('div');
    thumb.className = 'orc-thumb';
    thumb.innerHTML = `<img src="${dataUrl}" alt="Foto ${idx + 1}"><button type="button" aria-label="Remover foto">✕</button>`;
    thumb.querySelector('button').addEventListener('click', () => {
      selectedPhotos.splice(idx, 1);
      renderPreviews();
    });
    orcPreview.appendChild(thumb);
  });
}

fotosInput.addEventListener('change', async () => {
  const files = Array.from(fotosInput.files);
  for (const file of files){
    const dataUrl = await resizeImage(file, 900);
    selectedPhotos.push(dataUrl);
  }
  renderPreviews();
  fotosInput.value = '';
});

/* ---------- Form submit ---------- */
const form = document.getElementById('orcamentoForm');
const successBox = document.getElementById('orcSuccess');

form.addEventListener('submit', (e) => {
  e.preventDefault();

  const request = {
    id: Date.now(),
    data: new Date().toISOString(),
    status: 'novo',
    nome: form.nome.value.trim(),
    telefone: form.telefone.value.trim(),
    tipo: form.tipo.value,
    situacao: form.situacao.value.trim(),
    necessidade: form.necessidade.value.trim(),
    fotos: selectedPhotos,
  };

  const stored = JSON.parse(localStorage.getItem('wocOrcamentos') || '[]');
  stored.unshift(request);
  try {
    localStorage.setItem('wocOrcamentos', JSON.stringify(stored));
  } catch (err) {
    alert('Não foi possível salvar todas as fotos (limite de armazenamento do navegador). Tente enviar menos fotos ou fotos menores.');
    return;
  }

  form.style.display = 'none';
  successBox.classList.add('show');
});
