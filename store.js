/* HEAP – data layer. Persists to localStorage; swap for a REST API later. */
window.HEAP = window.HEAP || {};

HEAP.store = (function () {
  const U = HEAP.utils;
  const DB_KEY = 'heap_db_v1';
  const SESSION_KEY = 'heap_session_v1';
  let db = load();

  function load() {
    try {
      const raw = localStorage.getItem(DB_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* fall through to seed */ }
    const seeded = HEAP.seed();
    try { localStorage.setItem(DB_KEY, JSON.stringify(seeded)); } catch (e) { /* ignore */ }
    return seeded;
  }
  function save() {
    try { localStorage.setItem(DB_KEY, JSON.stringify(db)); } catch (e) { /* ignore */ }
  }
  const fail = (msg) => { throw new Error(msg); };

  /* ---------- auth ---------- */
  const sessionId = () => { try { return localStorage.getItem(SESSION_KEY); } catch (e) { return null; } };
  const currentUser = () => db.users.find((u) => u.id === sessionId()) || null;
  const requireUser = () => currentUser() || fail('Please log in first.');

  function signup({ name, email, phone, password }) {
    name = (name || '').trim(); email = (email || '').trim().toLowerCase();
    if (name.length < 2) fail('Please enter your full name.');
    if (!/^\S+@\S+\.\S+$/.test(email)) fail('Please enter a valid email.');
    if ((password || '').length < 6) fail('Password must be at least 6 characters.');
    if (db.users.some((u) => u.email === email)) fail('An account with this email already exists.');
    const user = {
      id: U.uid('u'), name, email, phone: (phone || '').trim(), bio: '', car: '',
      passHash: U.hash(password), rating: 5, ratingCount: 0, verified: false,
      joined: U.todayStr(),
    };
    db.users.push(user); save();
    localStorage.setItem(SESSION_KEY, user.id);
    return user;
  }
  function login(email, password) {
    const user = db.users.find((u) => u.email === String(email || '').trim().toLowerCase());
    if (!user || user.passHash !== U.hash(password || '')) fail('Incorrect email or password.');
    localStorage.setItem(SESSION_KEY, user.id);
    return user;
  }
  const logout = () => localStorage.removeItem(SESSION_KEY);

  function updateUser(patch) {
    const u = requireUser();
    if (patch.name !== undefined && patch.name.trim().length < 2) fail('Please enter your full name.');
    ['name', 'phone', 'bio', 'car'].forEach((k) => { if (patch[k] !== undefined) u[k] = String(patch[k]).trim(); });
    save();
    return u;
  }

  /* ---------- lookups ---------- */
  const getUser = (id) => db.users.find((u) => u.id === id);
  const getRide = (id) => db.rides.find((r) => r.id === id);
  const activeBookings = (rideId) => db.bookings.filter((b) => b.rideId === rideId && b.status === 'confirmed');
  const seatsLeft = (ride) => ride.seats - activeBookings(ride.id).reduce((n, b) => n + b.seats, 0);
  const passengers = (ride) => activeBookings(ride.id).map((b) => Object.assign({}, b, { user: getUser(b.userId) }));
  const isPast = (ride) => U.rideDateTime(ride) < new Date();

  /* ---------- rides ---------- */
  function searchRides(f) {
    f = f || {};
    const from = (f.from || '').trim().toLowerCase();
    const to = (f.to || '').trim().toLowerCase();
    const seats = Number(f.seats) || 1;
    let list = db.rides.filter((r) =>
      r.status === 'active' && !isPast(r) &&
      (!from || r.from.toLowerCase().includes(from)) &&
      (!to || r.to.toLowerCase().includes(to)) &&
      (!f.date || r.date === f.date) &&
      seatsLeft(r) >= seats &&
      (!f.maxPrice || r.price <= Number(f.maxPrice)) &&
      (!f.prefs || f.prefs.every((p) => r.prefs[p]))
    );
    const sorters = {
      earliest: (a, b) => U.rideDateTime(a) - U.rideDateTime(b),
      cheapest: (a, b) => a.price - b.price,
      rating: (a, b) => getUser(b.driverId).rating - getUser(a.driverId).rating,
    };
    return list.sort(sorters[f.sort] || sorters.earliest);
  }
  const upcomingRides = (n) => searchRides({}).slice(0, n);

  function createRide(d) {
    const u = requireUser();
    if (!U.findCity(d.from) || !U.findCity(d.to)) fail('Please choose cities from the suggestions list.');
    if (d.from === d.to) fail('Origin and destination must be different.');
    if (!d.date || !d.time) fail('Please pick a date and time.');
    if (U.rideDateTime(d) < new Date()) fail('Departure time must be in the future.');
    const seats = Number(d.seats), price = Number(d.price);
    if (!(seats >= 1 && seats <= 7)) fail('Seats must be between 1 and 7.');
    if (!(price >= 0)) fail('Please enter a valid price.');
    if (!String(d.car || '').trim()) fail('Please tell riders which car you drive.');
    const ride = {
      id: U.uid('r'), driverId: u.id, from: d.from, to: d.to, date: d.date, time: d.time,
      seats, price, car: d.car.trim(), prefs: d.prefs || {}, notes: (d.notes || '').trim(),
      status: 'active', createdAt: Date.now(),
    };
    db.rides.push(ride);
    if (!u.car) u.car = ride.car;
    save();
    return ride;
  }
  function cancelRide(id) {
    const u = requireUser(), r = getRide(id);
    if (!r || r.driverId !== u.id) fail('You can only cancel your own rides.');
    r.status = 'cancelled';
    db.bookings.forEach((b) => { if (b.rideId === id && b.status === 'confirmed') b.status = 'cancelled'; });
    save();
  }

  /* ---------- bookings ---------- */
  function book(rideId, seats) {
    const u = requireUser(), r = getRide(rideId);
    seats = Number(seats) || 1;
    if (!r || r.status !== 'active') fail('This ride is no longer available.');
    if (r.driverId === u.id) fail("You can't book your own ride.");
    if (isPast(r)) fail('This ride has already departed.');
    if (activeBookings(rideId).some((b) => b.userId === u.id)) fail('You already booked this ride.');
    if (seats < 1 || seats > seatsLeft(r)) fail(`Only ${seatsLeft(r)} seat(s) left.`);
    const b = { id: U.uid('b'), rideId, userId: u.id, seats, total: seats * r.price, status: 'confirmed', rating: 0, createdAt: Date.now() };
    db.bookings.push(b); save();
    return b;
  }
  function cancelBooking(id) {
    const u = requireUser(), b = db.bookings.find((x) => x.id === id);
    if (!b || b.userId !== u.id) fail('Booking not found.');
    b.status = 'cancelled'; save();
  }
  function rateBooking(id, stars) {
    const u = requireUser(), b = db.bookings.find((x) => x.id === id);
    if (!b || b.userId !== u.id) fail('Booking not found.');
    if (b.rating) fail('You already rated this ride.');
    stars = Math.min(5, Math.max(1, Number(stars)));
    b.rating = stars;
    const driver = getUser(getRide(b.rideId).driverId);
    driver.rating = Math.round(((driver.rating * driver.ratingCount + stars) / (driver.ratingCount + 1)) * 10) / 10;
    driver.ratingCount += 1;
    save();
  }
  function myBookings() {
    const u = requireUser();
    return db.bookings.filter((b) => b.userId === u.id)
      .map((b) => Object.assign({}, b, { ride: getRide(b.rideId) }))
      .sort((a, b) => U.rideDateTime(b.ride) - U.rideDateTime(a.ride));
  }
  function myRides() {
    const u = requireUser();
    return db.rides.filter((r) => r.driverId === u.id).sort((a, b) => U.rideDateTime(b) - U.rideDateTime(a));
  }

  /* ---------- stats ---------- */
  function stats(userId) {
    const taken = db.bookings.filter((b) => b.userId === userId && b.status === 'confirmed');
    const offered = db.rides.filter((r) => r.driverId === userId && r.status !== 'cancelled');
    const saved = taken.reduce((n, b) => n + Math.round(b.total * 0.6), 0); // vs. solo cab/fuel
    const km = taken.reduce((n, b) => { const r = getRide(b.rideId); return n + (U.distanceKm(r.from, r.to) || 0); }, 0)
      + offered.reduce((n, r) => n + (U.distanceKm(r.from, r.to) || 0) * activeBookings(r.id).reduce((s, b) => s + b.seats, 0), 0);
    return { taken: taken.length, offered: offered.length, saved, co2: Math.round(km * 0.1) };
  }
  function globalStats() {
    const km = db.bookings.filter((b) => b.status === 'confirmed')
      .reduce((n, b) => { const r = getRide(b.rideId); return n + (U.distanceKm(r.from, r.to) || 0) * b.seats; }, 0);
    return { members: db.users.length, rides: db.rides.filter((r) => r.status === 'active').length, co2: Math.round(km * 0.1) };
  }
  const resetDemo = () => { localStorage.removeItem(DB_KEY); localStorage.removeItem(SESSION_KEY); db = load(); };

  return {
    currentUser, signup, login, logout, updateUser, getUser, getRide, seatsLeft, passengers, isPast,
    searchRides, upcomingRides, createRide, cancelRide, book, cancelBooking, rateBooking,
    myBookings, myRides, stats, globalStats, resetDemo,
  };
})();
