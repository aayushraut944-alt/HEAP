/* HEAP – Search results view with filters */
window.HEAP = window.HEAP || {};
HEAP.views = HEAP.views || {};

HEAP.views.search = (function () {
  const U = HEAP.utils, S = HEAP.store, UI = HEAP.ui, esc = U.esc;

  function render(q) {
    return `
    <section class="page-head"><div class="container">
      <form class="search-bar" id="s-form" autocomplete="off">
        <input name="from" list="cities" placeholder="From" value="${esc(q.from || '')}">
        <span class="arrow">→</span>
        <input name="to" list="cities" placeholder="To" value="${esc(q.to || '')}">
        <input type="date" name="date" min="${U.todayStr()}" value="${esc(q.date || '')}">
        <select name="seats">${[1, 2, 3, 4].map((n) => `<option ${Number(q.seats) === n ? 'selected' : ''}>${n}</option>`).join('')}</select>
        <button class="btn primary" type="submit">Search</button>
      </form>
    </div></section>
    <div class="container search-layout">
      <aside class="filters" id="filters">
        <h3>Filters</h3>
        <label>Sort by
          <select id="f-sort"><option value="earliest">Earliest departure</option><option value="cheapest">Lowest price</option><option value="rating">Top rated driver</option></select>
        </label>
        <label>Max price per seat <output id="f-price-out">Any</output>
          <input type="range" id="f-price" min="0" max="3000" step="50" value="3000">
        </label>
        <fieldset><legend>Preferences</legend>
          ${[['ac', '❄️ Air conditioning'], ['music', '🎵 Music'], ['pets', '🐾 Pets allowed'], ['luggage', '🧳 Luggage space']].map(([k, l]) =>
            `<label class="check"><input type="checkbox" value="${k}" class="f-pref"> ${l}</label>`).join('')}
        </fieldset>
        <button class="btn ghost block" id="f-reset" type="button">Reset filters</button>
      </aside>
      <section class="results">
        <div class="row between"><h2 id="r-title"></h2><button class="btn ghost sm filters-toggle" id="f-toggle" type="button">Filters</button></div>
        <div class="ride-list" id="r-list"></div>
      </section>
    </div>`;
  }

  function mount(root, q) {
    const list = root.querySelector('#r-list');
    const title = root.querySelector('#r-title');
    const sort = root.querySelector('#f-sort');
    const price = root.querySelector('#f-price');
    const priceOut = root.querySelector('#f-price-out');

    function update() {
      const maxPrice = Number(price.value) >= 3000 ? 0 : Number(price.value);
      priceOut.textContent = maxPrice ? 'up to ' + U.money(maxPrice) : 'Any';
      const prefs = [...root.querySelectorAll('.f-pref:checked')].map((c) => c.value);
      const rides = S.searchRides({ from: q.from, to: q.to, date: q.date, seats: q.seats, sort: sort.value, maxPrice, prefs });
      title.textContent = rides.length ? `${rides.length} ride${rides.length > 1 ? 's' : ''} found` : 'No rides found';
      list.innerHTML = rides.length ? rides.map(UI.rideCard).join('') : `
        <div class="empty"><div class="empty-ico">🚗</div><h3>No matching rides yet</h3>
        <p>Try different dates or relax your filters — or offer this route yourself and let riders find you.</p>
        <a class="btn primary" href="#/offer">Offer a ride</a></div>`;
      UI.bindRideCards(list);
    }

    [sort, price].forEach((el) => el.addEventListener('input', update));
    root.querySelectorAll('.f-pref').forEach((c) => c.addEventListener('change', update));
    root.querySelector('#f-reset').addEventListener('click', () => {
      sort.value = 'earliest'; price.value = 3000;
      root.querySelectorAll('.f-pref').forEach((c) => (c.checked = false)); update();
    });
    root.querySelector('#f-toggle').addEventListener('click', () => root.querySelector('#filters').classList.toggle('open'));
    root.querySelector('#s-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const d = new FormData(e.target);
      HEAP.router.go('/search', { from: d.get('from'), to: d.get('to'), date: d.get('date'), seats: d.get('seats') });
    });
    update();
  }
  return { render, mount };
})();
