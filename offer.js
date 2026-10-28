/* HEAP – Offer a ride view */
window.HEAP = window.HEAP || {};
HEAP.views = HEAP.views || {};

HEAP.views.offer = (function () {
  const U = HEAP.utils, S = HEAP.store, UI = HEAP.ui, esc = U.esc;

  function render() {
    const me = S.currentUser();
    return `
    <section class="page-head"><div class="container"><h1>Offer a ride</h1>
      <p class="muted">Heading somewhere? Share your empty seats and split the costs.</p></div></section>
    <div class="container offer-layout">
      <form class="card form" id="offer-form" autocomplete="off" novalidate>
        <h3>Route</h3>
        <div class="grid2">
          <label>From<input name="from" list="cities" placeholder="Starting city" required></label>
          <label>To<input name="to" list="cities" placeholder="Destination city" required></label>
        </div>
        <div class="grid2">
          <label>Date<input type="date" name="date" min="${U.todayStr()}" value="${U.addDays(1)}" required></label>
          <label>Departure time<input type="time" name="time" value="08:00" required></label>
        </div>
        <h3>Seats &amp; price</h3>
        <div class="grid3">
          <label>Seats available<input type="number" name="seats" min="1" max="7" value="3" required></label>
          <label>Price per seat (₹)<input type="number" name="price" min="0" step="10" value="300" required></label>
          <label>Car<input name="car" placeholder="e.g. Honda City · Grey" value="${esc((me && me.car) || '')}" required></label>
        </div>
        <h3>Ride preferences</h3>
        <div class="pref-grid">
          ${[['ac', '❄️ Air conditioning', 1], ['music', '🎵 Music', 1], ['luggage', '🧳 Luggage space', 1], ['pets', '🐾 Pets allowed', 0], ['smoking', '🚬 Smoking allowed', 0]]
            .map(([k, l, on]) => `<label class="check pill-check"><input type="checkbox" name="pref_${k}" ${on ? 'checked' : ''}> ${l}</label>`).join('')}
        </div>
        <label>Note for riders <small class="muted">(pickup point, stops, etc.)</small>
          <textarea name="notes" rows="3" maxlength="240" placeholder="e.g. Pickup near Dadar station, one chai stop on the way."></textarea></label>
        <button class="btn primary lg" type="submit">Publish ride</button>
      </form>

      <aside class="card tips" id="fare-box">
        <h3>💡 Fare helper</h3>
        <p class="muted" id="fare-text">Pick your cities and we'll suggest a fair price per seat based on distance.</p>
        <div id="fare-vals"></div>
        <hr>
        <h4>Tips for great rides</h4>
        <ul><li>Be punctual and share exact pickup spots.</li><li>Fair prices fill seats faster.</li><li>Keep your car clean &amp; your phone reachable.</li></ul>
      </aside>
    </div>`;
  }

  function mount(root) {
    const form = root.querySelector('#offer-form');
    const fare = root.querySelector('#fare-vals');
    const text = root.querySelector('#fare-text');

    function updateFare() {
      const km = U.distanceKm(form.elements.from.value, form.elements.to.value);
      if (!km || form.elements.from.value === form.elements.to.value) { fare.innerHTML = ''; return; }
      const suggested = U.suggestFare(km);
      text.textContent = 'Based on distance, fuel and tolls:';
      fare.innerHTML = `<div class="fare-row"><span>Distance</span><b>~${km} km</b></div>
        <div class="fare-row"><span>Drive time</span><b>${U.fmtDuration(U.durationMin(km))}</b></div>
        <div class="fare-row"><span>Suggested price</span><b>${U.money(suggested)} / seat</b></div>
        <button type="button" class="btn ghost sm" id="use-fare">Use suggested price</button>`;
      fare.querySelector('#use-fare').onclick = () => { form.elements.price.value = suggested; };
    }
    form.elements.from.addEventListener('change', updateFare);
    form.elements.to.addEventListener('change', updateFare);

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const d = new FormData(form);
      const prefs = {};
      ['ac', 'music', 'luggage', 'pets', 'smoking'].forEach((k) => (prefs[k] = d.get('pref_' + k) === 'on'));
      try {
        S.createRide({
          from: d.get('from'), to: d.get('to'), date: d.get('date'), time: d.get('time'),
          seats: d.get('seats'), price: d.get('price'), car: d.get('car'), notes: d.get('notes'), prefs,
        });
        UI.toast('Your ride is live! 🎉', 'success');
        HEAP.router.go('/trips', { tab: 'offered' });
      } catch (err) { UI.toast(err.message, 'error'); }
    });
  }
  return { render, mount };
})();
