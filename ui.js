/* HEAP – reusable UI pieces: toast, modal, avatar, stars, ride card, ride detail modal */
window.HEAP = window.HEAP || {};

HEAP.ui = (function () {
  const U = HEAP.utils;
  const S = HEAP.store;
  const esc = U.esc;

  /* ---------- toast ---------- */
  function toast(msg, type) {
    const host = document.getElementById('toasts');
    const el = document.createElement('div');
    el.className = 'toast ' + (type || 'info');
    el.textContent = msg;
    host.appendChild(el);
    requestAnimationFrame(() => el.classList.add('show'));
    setTimeout(() => { el.classList.remove('show'); setTimeout(() => el.remove(), 300); }, 3200);
  }

  /* ---------- modal ---------- */
  function modal(html, opts) {
    const root = document.getElementById('modal-root');
    root.innerHTML = `<div class="overlay"><div class="modal ${(opts && opts.cls) || ''}" role="dialog" aria-modal="true">
      <button class="modal-x" aria-label="Close">&times;</button>${html}</div></div>`;
    const overlay = root.firstElementChild;
    const close = () => { root.innerHTML = ''; document.removeEventListener('keydown', onKey); };
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
    overlay.querySelector('.modal-x').addEventListener('click', close);
    document.addEventListener('keydown', onKey);
    return { close, el: overlay.querySelector('.modal') };
  }
  function confirmBox(title, text, okLabel) {
    return new Promise((resolve) => {
      const m = modal(`<h3>${esc(title)}</h3><p class="muted">${esc(text)}</p>
        <div class="row end gap"><button class="btn ghost" data-no>Keep it</button>
        <button class="btn danger" data-yes>${esc(okLabel || 'Confirm')}</button></div>`, { cls: 'small' });
      m.el.querySelector('[data-no]').onclick = () => { m.close(); resolve(false); };
      m.el.querySelector('[data-yes]').onclick = () => { m.close(); resolve(true); };
    });
  }

  /* ---------- small components ---------- */
  const avatar = (user, size) =>
    `<span class="avatar ${size || ''}" style="background:${U.colorFor(user.id)}">${esc(U.initials(user.name))}</span>`;

  const stars = (n) => {
    const full = Math.round(n);
    return `<span class="stars" aria-label="${n} out of 5">${'★'.repeat(full)}${'☆'.repeat(5 - full)}</span>`;
  };

  function prefChips(p) {
    const map = { ac: '❄️ AC', music: '🎵 Music', pets: '🐾 Pets OK', luggage: '🧳 Luggage', smoking: '🚬 Smoking' };
    return Object.keys(map).filter((k) => p[k]).map((k) => `<span class="chip">${map[k]}</span>`).join('');
  }

  function routeLine(ride) {
    const km = U.distanceKm(ride.from, ride.to);
    const dur = km ? U.fmtDuration(U.durationMin(km)) : '';
    return `<div class="route-line"><span class="dot"></span><span class="line"></span><span class="dot end"></span>
      ${dur ? `<span class="dur">${dur}${km ? ' · ' + km + ' km' : ''}</span>` : ''}</div>`;
  }

  function rideCard(ride) {
    const driver = S.getUser(ride.driverId);
    const left = S.seatsLeft(ride);
    return `<article class="ride-card" data-ride-id="${ride.id}" tabindex="0">
      <div class="rc-times">
        <div><strong>${U.fmtTime(ride.time)}</strong><small>${esc(ride.from)}</small></div>
        ${routeLine(ride)}
        <div><strong>${esc(ride.to)}</strong><small>${U.fmtDate(ride.date)}</small></div>
      </div>
      <div class="rc-driver">${avatar(driver)}<div><b>${esc(driver.name)}</b>
        <small>${stars(driver.rating)} ${driver.rating} (${driver.ratingCount})</small></div></div>
      <div class="rc-meta"><div class="chips">${prefChips(ride.prefs)}</div></div>
      <div class="rc-price"><strong>${U.money(ride.price)}</strong><small>per seat</small>
        <span class="seats ${left <= 1 ? 'low' : ''}">${left} seat${left === 1 ? '' : 's'} left</span></div>
    </article>`;
  }

  function bindRideCards(root) {
    root.querySelectorAll('[data-ride-id]').forEach((card) => {
      const open = () => rideDetail(card.dataset.rideId);
      card.addEventListener('click', open);
      card.addEventListener('keydown', (e) => { if (e.key === 'Enter') open(); });
    });
  }

  /* ---------- ride detail + booking ---------- */
  function rideDetail(rideId, afterChange) {
    const ride = S.getRide(rideId);
    if (!ride) return toast('Ride not found.', 'error');
    const me = S.currentUser();
    const driver = S.getUser(ride.driverId);
    const left = S.seatsLeft(ride);
    const isOwner = me && me.id === ride.driverId;
    const mine = me && S.passengers(ride).find((p) => p.userId === me.id);
    const maxSeats = Math.max(1, Math.min(left, 4));
    const km = U.distanceKm(ride.from, ride.to);

    let action;
    if (ride.status !== 'active') action = `<div class="notice">This ride was cancelled by the driver.</div>`;
    else if (S.isPast(ride)) action = `<div class="notice">This ride has already departed.</div>`;
    else if (isOwner) {
      const pax = S.passengers(ride);
      action = `<h4>Your passengers</h4>` + (pax.length
        ? pax.map((p) => `<div class="pax">${avatar(p.user, 'sm')}<span>${esc(p.user.name)}</span><small>${p.seats} seat${p.seats > 1 ? 's' : ''} · ${esc(p.user.phone || 'no phone')}</small></div>`).join('')
        : `<p class="muted">No bookings yet. Share your ride to fill those seats!</p>`);
    } else if (mine) action = `<div class="notice ok">✓ You booked ${mine.seats} seat(s) on this ride. Total ${U.money(mine.total)}.</div>`;
    else if (left < 1) action = `<div class="notice">This ride is full.</div>`;
    else action = `<div class="book-box">
        <label>Seats
          <select id="bk-seats">${Array.from({ length: maxSeats }, (_, i) => `<option>${i + 1}</option>`).join('')}</select>
        </label>
        <div class="total"><small>Total</small><strong id="bk-total">${U.money(ride.price)}</strong></div>
        <button class="btn primary" id="bk-go">${me ? 'Book now' : 'Log in to book'}</button>
      </div><small class="muted">Pay the driver directly at pickup (cash or UPI).</small>`;

    const m = modal(`
      <div class="detail-head"><span class="pill">${U.fmtDate(ride.date)}</span><h2>${esc(ride.from)} <span class="arrow">→</span> ${esc(ride.to)}</h2>
        <p class="muted">Departs ${U.fmtTime(ride.time)}${km ? ` · ~${km} km · ${U.fmtDuration(U.durationMin(km))}` : ''}</p></div>
      <div class="detail-grid">
        <div class="box"><h4>Driver</h4><div class="rc-driver">${avatar(driver, 'lg')}<div>
          <b>${esc(driver.name)}</b> ${driver.verified ? '<span class="verified" title="Verified">✔ Verified</span>' : ''}
          <small>${stars(driver.rating)} ${driver.rating} · ${driver.ratingCount} reviews</small></div></div>
          <p class="muted">${esc(driver.bio || 'No bio yet.')}</p></div>
        <div class="box"><h4>Car</h4><p><b>${esc(ride.car)}</b></p><div class="chips">${prefChips(ride.prefs) || '<span class="muted">No extras listed</span>'}</div>
          ${ride.notes ? `<h4>Driver's note</h4><p class="muted">${esc(ride.notes)}</p>` : ''}</div>
      </div>
      <div class="detail-price"><strong>${U.money(ride.price)}</strong> <small>per seat · ${left} of ${ride.seats} seats left</small></div>
      ${action}`, { cls: 'wide' });

    const seatSel = m.el.querySelector('#bk-seats');
    if (seatSel) seatSel.addEventListener('change', () => {
      m.el.querySelector('#bk-total').textContent = U.money(ride.price * Number(seatSel.value));
    });
    const go = m.el.querySelector('#bk-go');
    if (go) go.addEventListener('click', () => {
      if (!me) { m.close(); sessionStorage.setItem('heap_next', location.hash); location.hash = '#/login'; return; }
      try {
        S.book(ride.id, seatSel.value);
        m.close(); toast('Booked! Have a safe trip 🚗', 'success');
        if (afterChange) afterChange(); else HEAP.router.refresh();
      } catch (e) { toast(e.message, 'error'); }
    });
  }

  return { toast, modal, confirmBox, avatar, stars, prefChips, rideCard, bindRideCards, rideDetail };
})();
