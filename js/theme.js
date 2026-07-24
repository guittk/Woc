(function(){
  const root = document.documentElement;
  const toggle = document.getElementById('themeToggle');
  if (!toggle) return;

  function current(){
    return root.getAttribute('data-theme')
      || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  }

  function apply(theme){
    root.setAttribute('data-theme', theme);
    toggle.setAttribute('aria-label', theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro');
    toggle.classList.toggle('is-dark', theme === 'dark');
  }

  apply(current());

  toggle.addEventListener('click', () => {
    const next = current() === 'dark' ? 'light' : 'dark';
    localStorage.setItem('wocTheme', next);
    apply(next);
  });
})();
