/* HEAP – Home view */
window.HEAP = window.HEAP || {};
HEAP.views = HEAP.views || {};

HEAP.views.home = (function () {
  const U = HEAP.utils, S = HEAP.store, UI = HEAP.ui, esc = U.esc;

  function render() {
    const g = S.globalStats();
    const upcoming = S.upcomingRides(3);
    return `
    <section class="hero">
      <div class="container hero-inner">
        <div class="hero-copy">
          <span class="eyebrow">Carpooling, simplified</span>
          <h1>Share the ride.<br><span class="grad">Split the cost.</span></h1>
          <p>HEAP connects people travelling the same way. Fill empty seats, cut your fuel bill, and make every journey a little greener.</p>
          <div class="hero-stats">
            <div><strong>${g.members}+</strong><small>members</small></div>
            <div><strong>${g.rides}</strong><small>open rides</small></div>
            <div><strong>${g.co2} kg</strong><small>CO₂ saved</small></div>
          </div>
        </div>
        <form class="search-card" id="home-search" autocomplete="off">
          <h3>Find a ride</h3>
          <label>Leaving from<input name="from" list="cities" placeholder="e.g. Mumbai" required></label>
          <button type="button" class="swap" id="swap" title="Swap" aria-label="Swap origin and destination">⇅</button>
          <label>Going to<input name="to" list="cities" placeholder="e.g. Pune" required></label>
          <div class="grid2">
            <label>Date<input type="date" name="date" min="${U.todayStr()}"></label>
            <label>Seats<select name="seats">${[1, 2, 3, 4].map((n) => `<option>${n}</option>`).join('')}</select></label>
          </div>
          <button class="btn primary block" type="submit">Search rides</button>
          <div class="popular"><small>Popular:</small>${U.POPULAR_ROUTES.slice(0, 4).map((r) =>
            `<button type="button" class="chip btn-chip" data-from="${r[0]}" data-to="${r[1]}">${r[0]} → ${r[1]}</button>`).join('')}</div>
        </form>
      </div>
    </section>

    <section class="container section">
      <h2 class="section-title">How HEAP works</h2>
      <div class="steps">
        <div class="step"><span class="step-n">1</span><h3>Search or offer</h3><p>Looking for a seat? Search by route and date. Driving? Post your trip in under a minute.</p></div>
        <div class="step"><span class="step-n">2</span><h3>Book instantly</h3><p>Pick your seats, see the driver, car and preferences, and confirm with one tap.</p></div>
        <div class="step"><span class="step-n">3</span><h3>Ride &amp; rate</h3><p>Meet at the pickup point, share the cost, and rate each other to keep HEAP trusted.</p></div>
      </div>
    </section>

    <section class="container section">
      <div class="row between"><h2 class="section-title">Rides leaving soon</h2><a class="link" href="#/search">View all →</a></div>
      <div class="ride-list">${upcoming.map(UI.rideCard).join('') || '<p class="muted">No rides yet – be the first to offer one!</p>'}</div>
    </section>

    <section class="container section features">
      <div class="feature"><span>💸</span><h3>Save up to 60%</h3><p>Share fuel and toll costs with fellow travellers.</p></div>
      <div class="feature"><span>🛡️</span><h3>Verified drivers</h3><p>Profiles, ratings and reviews you can trust.</p></div>
      <div class="feature"><span>🌱</span><h3>Greener travel</h3><p>Fewer cars on the road means lower emissions.</p></div>
      <div class="feature"><span>🤝</span><h3>Real community</h3><p>Meet people heading your way and make the trip fun.</p></div>
    </section>

    <section class="container section">
      <div class="cta">
        <div><h2>Driving somewhere soon?</h2><p>Turn empty seats into savings. Offer a ride in less than a minute.</p></div>
        <a class="btn light" href="#/offer">Offer a ride</a>
      </div>
    </section>`;
  }

  function mount(root) {
    const form = root.querySelector('#home-search');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const d = new FormData(form);
      HEAP.router.go('/search', { from: d.get('from'), to: d.get('to'), date: d.get('date'), seats: d.get('seats') });
    });
    root.querySelector('#swap').addEventListener('click', () => {
      const a = form.elements.from.value; form.elements.from.value = form.elements.to.value; form.elements.to.value = a;
    });
    root.querySelectorAll('.btn-chip').forEach((b) => b.addEventListener('click', () => {
      HEAP.router.go('/search', { from: b.dataset.from, to: b.dataset.to });
    }));
    UI.bindRideCards(root);
  }
  return { render, mount };
})();
