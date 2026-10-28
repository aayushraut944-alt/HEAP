/* HEAP – Login / Sign up views */
window.HEAP = window.HEAP || {};
HEAP.views = HEAP.views || {};

HEAP.views.auth = (function () {
  const S = HEAP.store, UI = HEAP.ui;

  const shell = (title, sub, body, foot) => `
    <div class="auth-wrap"><div class="auth-card">
      <a class="brand center" href="#/">${HEAP.brandMark()}<span>HEAP</span></a>
      <h2>${title}</h2><p class="muted">${sub}</p>${body}<p class="auth-foot">${foot}</p>
    </div></div>`;

  function renderLogin() {
    return shell('Welcome back', 'Log in to book and manage your rides.', `
      <form id="auth-form" class="form" novalidate>
        <label>Email<input type="email" name="email" placeholder="you@example.com" required></label>
        <label>Password<input type="password" name="password" placeholder="••••••" required></label>
        <button class="btn primary block lg" type="submit">Log in</button>
        <button class="btn ghost block" type="button" id="demo">Use demo account</button>
      </form>`, `New to HEAP? <a href="#/signup">Create an account</a>`);
  }
  function renderSignup() {
    return shell('Join HEAP', 'Create your free account in seconds.', `
      <form id="auth-form" class="form" novalidate>
        <label>Full name<input name="name" placeholder="Your name" required></label>
        <label>Email<input type="email" name="email" placeholder="you@example.com" required></label>
        <label>Phone <small class="muted">(optional)</small><input name="phone" placeholder="+91 …"></label>
        <label>Password<input type="password" name="password" placeholder="At least 6 characters" required></label>
        <button class="btn primary block lg" type="submit">Create account</button>
      </form>`, `Already a member? <a href="#/login">Log in</a>`);
  }

  function afterAuth() {
    const next = sessionStorage.getItem('heap_next');
    sessionStorage.removeItem('heap_next');
    location.hash = next && !next.includes('login') && !next.includes('signup') ? next : '#/';
  }

  function mount(root, q, mode) {
    const form = root.querySelector('#auth-form');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const d = Object.fromEntries(new FormData(form));
      try {
        if (mode === 'signup') { S.signup(d); UI.toast('Welcome to HEAP! 🎉', 'success'); }
        else { S.login(d.email, d.password); UI.toast('Logged in. Welcome back!', 'success'); }
        afterAuth();
      } catch (err) { UI.toast(err.message, 'error'); }
    });
    const demo = root.querySelector('#demo');
    if (demo) demo.addEventListener('click', () => {
      S.login('demo@heap.app', 'heap123'); UI.toast('Logged in as Demo Rider.', 'success'); afterAuth();
    });
  }

  return {
    login: { render: renderLogin, mount: (r, q) => mount(r, q, 'login') },
    signup: { render: renderSignup, mount: (r, q) => mount(r, q, 'signup') },
  };
})();
