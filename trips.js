/* HEAP – My trips (booked + offered) */
window.HEAP = window.HEAP || {};
HEAP.views = HEAP.views || {};

HEAP.views.trips = (function () {
  const U = HEAP.utils, S = HEAP.store, UI = HEAP.ui, esc = U.esc;

  function statusBadge(ride, status) {
    if (status === 'cancelled' || ride.status === 'cancelled') return '<span class="badge bad">Cancelled</span>';
    if (S.isPast(ride)) return '<span class="badge">Completed</span>';
    return '<span class="badge good">Upcoming</span>';
  }

  function bookedItem(b) {
    const r = b.ride, d = S.getUser(r.driverId);
    const past = S.isPast(r), cancelled = b.status === 'cancelled' || r.status === 'cancelled';
    let actions = `<button class="btn ghost sm" data-view="${r.id}">Details</button>`;
    if (!past && !cancelled) actions += ` <button class="btn danger sm" data-cancel-booking="${b.id}">Cancel</button>`;
    if (past && !cancelled) actions += b.rating
      ? ` <span class="muted">You rated ${UI.stars(b.rating)}</span>`
      : ` <button class="btn primary sm" data-rate="${b.id}">Rate driver</button>`;
    return `<div class="trip">
      <div class="trip-main"><div class="trip-route"><b>${esc(r.from)}</b> <span class="arrow">→</span> <b>${esc(r.to)}</b> ${statusBadge(r, b.status)}</div>
        <small class="muted">${U.fmtDate(r.date)} · ${U.fmtTime(r.time)} · ${b.seats} seat(s) · ${U.money(b.total)}</small>
        <div class="trip-driver">${UI.avatar(d, 'sm')}<span>${esc(d.name)}</span><small class="muted">${esc(r.car)}</small></div></div>
      <div class="trip-actions">${actions}</div></div>`;
  }

  function offeredItem(r) {
    const pax = S.passengers(r), booked = pax.reduce((n, p) => n + p.seats, 0);
    const past = S.isPast(r), cancelled = r.status === 'cancelled';
    return `<div class="trip">
      <div class="trip-main"><div class="trip-route"><b>${esc(r.from)}</b> <span class="arrow">→</span> <b>${esc(r.to)}</b> ${statusBadge(r, r.status)}</div>
        <small class="muted">${U.fmtDate(r.date)} · ${U.fmtTime(r.time)} · ${U.money(r.price)}/seat</small>
        <div class="progress"><span style="width:${Math.round((booked / r.seats) * 100)}%"></span></div>
        <small class="muted">${booked} of ${r.seats} seats booked${pax.length ? ' · ' + pax.map((p) => esc(p.user.name.split(' ')[0])).join(', ') : ''}</small></div>
      <div class="trip-actions"><button class="btn ghost sm" data-view="${r.id}">Details</button>
        ${!past && !cancelled ? `<button class="btn danger sm" data-cancel-ride="${r.id}">Cancel ride</button>` : ''}</div></div>`;
  }

  function render(q) {
    const me = S.currentUser();
    const tab = q.tab === 'offered' ? 'offered' : 'booked';
    const st = S.stats(me.id);
    const bookings = S.myBookings(), rides = S.myRides();
    const items = tab === 'booked' ? bookings.map(bookedItem) : rides.map(offeredItem);
    return `
    <section class="page-head"><div class="container"><h1>My trips</h1>
      <div class="stat-row">
        <div class="stat"><strong>${st.taken}</strong><small>Rides taken</small></div>
        <div class="stat"><strong>${st.offered}</strong><small>Rides offered</small></div>
        <div class="stat"><strong>${U.money(st.saved)}</strong><small>Money saved</small></div>
        <div class="stat"><strong>${st.co2} kg</strong><small>CO₂ saved</small></div>
      </div></div></section>
    <div class="container narrow">
      <div class="tabs"><a class="tab ${tab === 'booked' ? 'on' : ''}" href="#/trips?tab=booked">Booked (${bookings.length})</a>
        <a class="tab ${tab === 'offered' ? 'on' : ''}" href="#/trips?tab=offered">Offered (${rides.length})</a></div>
      ${items.length ? items.join('') : `<div class="empty"><div class="empty-ico">${tab === 'booked' ? '🎫' : '🚗'}</div>
        <h3>${tab === 'booked' ? 'No bookings yet' : "You haven't offered a ride yet"}</h3>
        <a class="btn primary" href="#/${tab === 'booked' ? 'search' : 'offer'}">${tab === 'booked' ? 'Find a ride' : 'Offer a ride'}</a></div>`}
    </div>`;
  }

  function rateModal(bookingId) {
    const m = UI.modal(`<h3>Rate your driver</h3><p class="muted">How was your ride?</p>
      <div class="star-pick">${[1, 2, 3, 4, 5].map((n) => `<button data-star="${n}" aria-label="${n} stars">★</button>`).join('')}</div>
      <div class="row end gap"><button class="btn ghost" data-x>Not now</button><button class="btn primary" data-ok disabled>Submit</button></div>`, { cls: 'small' });
    let val = 0;
    const btns = [...m.el.querySelectorAll('[data-star]')];
    btns.forEach((b) => b.addEventListener('click', () => {
      val = Number(b.dataset.star);
      btns.forEach((x) => x.classList.toggle('on', Number(x.dataset.star) <= val));
      m.el.querySelector('[data-ok]').disabled = false;
    }));
    m.el.querySelector('[data-x]').onclick = m.close;
    m.el.querySelector('[data-ok]').onclick = () => {
      try { S.rateBooking(bookingId, val); m.close(); UI.toast('Thanks for your feedback!', 'success'); HEAP.router.refresh(); }
      catch (e) { UI.toast(e.message, 'error'); }
    };
  }

  function mount(root) {
    root.querySelectorAll('[data-view]').forEach((b) => b.addEventListener('click', () => UI.rideDetail(b.dataset.view)));
    root.querySelectorAll('[data-rate]').forEach((b) => b.addEventListener('click', () => rateModal(b.dataset.rate)));
    root.querySelectorAll('[data-cancel-booking]').forEach((b) => b.addEventListener('click', async () => {
      if (await UI.confirmBox('Cancel booking?', 'Your seat will be released for other riders.', 'Cancel booking')) {
        try { S.cancelBooking(b.dataset.cancelBooking); UI.toast('Booking cancelled.'); HEAP.router.refresh(); } catch (e) { UI.toast(e.message, 'error'); }
      }
    }));
    root.querySelectorAll('[data-cancel-ride]').forEach((b) => b.addEventListener('click', async () => {
      if (await UI.confirmBox('Cancel this ride?', 'All passengers will lose their booking.', 'Cancel ride')) {
        try { S.cancelRide(b.dataset.cancelRide); UI.toast('Ride cancelled.'); HEAP.router.refresh(); } catch (e) { UI.toast(e.message, 'error'); }
      }
    }));
  }
  return { render, mount };
})();
