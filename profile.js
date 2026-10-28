/* HEAP – Profile view */
window.HEAP = window.HEAP || {};
HEAP.views = HEAP.views || {};

HEAP.views.profile = (function () {
  const U = HEAP.utils, S = HEAP.store, UI = HEAP.ui, esc = U.esc;

  function render() {
    const me = S.currentUser(), st = S.stats(me.id);
    return `
    <section class="page-head"><div class="container profile-head">
      ${UI.avatar(me, 'xl')}
      <div><h1>${esc(me.name)}</h1>
        <p class="muted">${esc(me.email)} · Member since ${new Date(me.joined).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</p>
        <p>${UI.stars(me.rating)} <b>${me.rating}</b> <span class="muted">(${me.ratingCount} reviews)</span></p></div>
    </div></section>
    <div class="container narrow">
      <div class="stat-row light">
        <div class="stat"><strong>${st.taken}</strong><small>Rides taken</small></div>
        <div class="stat"><strong>${st.offered}</strong><small>Rides offered</small></div>
        <div class="stat"><strong>${U.money(st.saved)}</strong><small>Saved</small></div>
        <div class="stat"><strong>${st.co2} kg</strong><small>CO₂ saved</small></div>
      </div>
      <form class="card form" id="profile-form">
        <h3>Edit profile</h3>
        <div class="grid2">
          <label>Full name<input name="name" value="${esc(me.name)}" required></label>
          <label>Phone<input name="phone" value="${esc(me.phone)}" placeholder="+91 …"></label>
        </div>
        <label>Your car <small class="muted">(for drivers)</small><input name="car" value="${esc(me.car)}" placeholder="e.g. Hyundai Creta · White"></label>
        <label>About you<textarea name="bio" rows="3" maxlength="200" placeholder="Tell riders a little about yourself…">${esc(me.bio)}</textarea></label>
        <div class="row gap"><button class="btn primary" type="submit">Save changes</button>
          <button class="btn ghost" type="button" id="logout">Log out</button></div>
      </form>
    </div>`;
  }

  function mount(root) {
    root.querySelector('#profile-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const d = new FormData(e.target);
      try {
        S.updateUser({ name: d.get('name'), phone: d.get('phone'), car: d.get('car'), bio: d.get('bio') });
        UI.toast('Profile updated.', 'success'); HEAP.router.refresh();
      } catch (err) { UI.toast(err.message, 'error'); }
    });
    root.querySelector('#logout').addEventListener('click', () => {
      S.logout(); UI.toast('Logged out. See you soon!'); HEAP.router.go('/');
    });
  }
  return { render, mount };
})();
