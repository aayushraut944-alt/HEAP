/* HEAP – app bootstrap: brand mark, navbar, hash router */
window.HEAP = window.HEAP || {};

HEAP.brandMark = function () {
  return `<svg class="brand-mark" viewBox="0 0 40 40" width="34" height="34" aria-hidden="true">
    <defs><linearGradient id="hg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#34d399"/><stop offset="1" stop-color="#0ea5e9"/></linearGradient></defs>
    <rect width="40" height="40" rx="11" fill="url(#hg)"/>
    <circle cx="20" cy="12.5" r="4.2" fill="#fff"/><circle cx="12.5" cy="25" r="4.2" fill="#fff" opacity=".9"/>
    <circle cx="27.5" cy="25" r="4.2" fill="#fff" opacity=".9"/><circle cx="20" cy="31.5" r="3" fill="#fff" opacity=".7"/></svg>`;
};

HEAP.router = (function () {
  const S = HEAP.store, V = HEAP.views;
  const routes = {
    '/': { view: V.home },
    '/search': { view: V.search },
    '/offer': { view: V.offer, auth: true },
    '/trips': { view: V.trips, auth: true },
    '/profile': { view: V.profile, auth: true },
    '/login': { view: V.auth.login, guest: true },
    '/signup': { view: V.auth.signup, guest: true },
  };

  function parse() {
    const raw = location.hash.replace(/^#/, '') || '/';
    const [path, qs] = raw.split('?');
    const q = {};
    new URLSearchParams(qs || '').forEach((v, k) => (q[k] = v));
    return { path, q };
  }

  function go(path, query) {
    const qs = new URLSearchParams();
    Object.keys(query || {}).forEach((k) => { if (query[k]) qs.set(k, query[k]); });
    const target = '#' + path + (qs.toString() ? '?' + qs : '');
    if (location.hash === target) refresh(); else location.hash = target;
  }

  function renderNav() {
    const me = S.currentUser();
    const { path } = parse();
    const link = (href, label) => `<a href="#${href}" class="${path === href ? 'active' : ''}">${label}</a>`;
    document.getElementById('nav').innerHTML = `
      <div class="container nav-inner">
        <a class="brand" href="#/">${HEAP.brandMark()}<span>HEAP</span></a>
        <button class="burger" id="burger" aria-label="Menu">☰</button>
        <nav class="nav-links" id="nav-links">
          ${link('/search', 'Find a ride')}${link('/offer', 'Offer a ride')}${me ? link('/trips', 'My trips') : ''}
          ${me
            ? `<a href="#/profile" class="nav-user ${path === '/profile' ? 'active' : ''}">${HEAP.ui.avatar(me, 'sm')}<span>${HEAP.utils.esc(me.name.split(' ')[0])}</span></a>`
            : `<a href="#/login">Log in</a><a href="#/signup" class="btn primary sm">Sign up</a>`}
        </nav>
      </div>`;
    document.getElementById('burger').onclick = () => document.getElementById('nav-links').classList.toggle('open');
  }

  function refresh() {
    let { path, q } = parse();
    const route = routes[path] || routes['/'];
    const me = S.currentUser();
    if (route.auth && !me) {
      sessionStorage.setItem('heap_next', location.hash);
      HEAP.ui.toast('Please log in to continue.');
      location.hash = '#/login'; return;
    }
    if (route.guest && me) { location.hash = '#/'; return; }
    renderNav();
    const app = document.getElementById('app');
    app.innerHTML = route.view.render(q);
    route.view.mount(app, q);
    document.title = 'HEAP · Share the ride';
    window.scrollTo(0, 0);
  }

  function start() {
    window.addEventListener('hashchange', refresh);
    refresh();
  }
  return { go, refresh, start };
})();

document.addEventListener('DOMContentLoaded', () => {
  // City suggestions shared by every input with list="cities"
  document.getElementById('cities').innerHTML =
    HEAP.utils.CITIES.map((c) => `<option value="${c.name}"></option>`).join('');
  document.getElementById('footer-year').textContent = new Date().getFullYear();
  HEAP.router.start();
});
