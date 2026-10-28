/* HEAP – seed data so the app feels alive on first launch */
window.HEAP = window.HEAP || {};

HEAP.seed = function () {
  const U = HEAP.utils;
  const demoPass = U.hash('heap123');

  const users = [
    { id: 'u_demo', name: 'Demo Rider', email: 'demo@heap.app', phone: '+91 98765 00000', bio: 'Trying out HEAP!', car: '', rating: 5, ratingCount: 0, verified: true, joined: '2026-01-10' },
    { id: 'u_aarav', name: 'Aarav Mehta', email: 'aarav@heap.app', phone: '+91 98200 11111', bio: 'Weekly Mumbai–Pune commuter. Quiet rides, good playlists.', car: 'Hyundai Creta · White', rating: 4.8, ratingCount: 64, verified: true, joined: '2025-03-02' },
    { id: 'u_isha', name: 'Isha Kulkarni', email: 'isha@heap.app', phone: '+91 98200 22222', bio: 'Product designer. Love long drives and chai stops.', car: 'Maruti Swift · Red', rating: 4.9, ratingCount: 112, verified: true, joined: '2024-11-18' },
    { id: 'u_rohan', name: 'Rohan Desai', email: 'rohan@heap.app', phone: '+91 98200 33333', bio: 'Photographer heading to Goa often. Space for cameras!', car: 'Toyota Innova · Silver', rating: 4.6, ratingCount: 37, verified: true, joined: '2025-06-21' },
    { id: 'u_sneha', name: 'Sneha Iyer', email: 'sneha@heap.app', phone: '+91 98200 44444', bio: 'Bengaluru–Chennai regular. Early starts only.', car: 'Honda City · Grey', rating: 4.7, ratingCount: 51, verified: true, joined: '2025-01-09' },
    { id: 'u_vikram', name: 'Vikram Singh', email: 'vikram@heap.app', phone: '+91 98200 55555', bio: 'Delhi–Jaipur weekends. Pet friendly!', car: 'Mahindra XUV700 · Black', rating: 4.5, ratingCount: 29, verified: false, joined: '2025-09-30' },
    { id: 'u_meera', name: 'Meera Nair', email: 'meera@heap.app', phone: '+91 98200 66666', bio: 'Software engineer, Nashik weekend trips.', car: 'Tata Nexon · Blue', rating: 4.9, ratingCount: 80, verified: true, joined: '2024-08-14' },
  ].map((u) => Object.assign({ passHash: demoPass }, u));

  const P = (o) => Object.assign({ ac: true, music: true, pets: false, smoking: false, luggage: true }, o);
  // [driver, from, to, dayOffset, time, seats, car, prefs, notes]
  const defs = [
    ['u_aarav', 'Mumbai', 'Pune', 0, '17:30', 3, 'Hyundai Creta', P({}), 'Leaving from Andheri. One short chai stop at Khopoli.'],
    ['u_isha', 'Mumbai', 'Pune', 1, '07:15', 2, 'Maruti Swift', P({ music: true }), 'Pickup near Dadar station.'],
    ['u_meera', 'Pune', 'Mumbai', 1, '18:00', 3, 'Tata Nexon', P({ pets: true }), 'Friendly small pets welcome.'],
    ['u_aarav', 'Pune', 'Mumbai', 2, '06:45', 2, 'Hyundai Creta', P({}), ''],
    ['u_meera', 'Mumbai', 'Nashik', 2, '08:00', 3, 'Tata Nexon', P({}), 'Direct via Kasara ghat.'],
    ['u_rohan', 'Mumbai', 'Goa', 3, '20:00', 4, 'Toyota Innova', P({ luggage: true }), 'Overnight drive, 2 drivers. Big boot space.'],
    ['u_sneha', 'Bengaluru', 'Chennai', 2, '05:30', 3, 'Honda City', P({ music: false }), 'Early start, quiet ride.'],
    ['u_sneha', 'Chennai', 'Bengaluru', 4, '16:00', 2, 'Honda City', P({}), ''],
    ['u_vikram', 'Delhi', 'Jaipur', 1, '09:00', 4, 'Mahindra XUV700', P({ pets: true }), 'Pet friendly. Breakfast stop at Manesar.'],
    ['u_vikram', 'Jaipur', 'Delhi', 3, '15:00', 3, 'Mahindra XUV700', P({ pets: true }), ''],
    ['u_isha', 'Pune', 'Lonavala', 0, '19:30', 3, 'Maruti Swift', P({}), 'Weekend getaway run!'],
    ['u_rohan', 'Thane', 'Pune', 5, '06:00', 3, 'Toyota Innova', P({}), ''],
    ['u_aarav', 'Navi Mumbai', 'Surat', 4, '07:00', 2, 'Hyundai Creta', P({}), ''],
    ['u_meera', 'Nashik', 'Pune', 6, '10:00', 3, 'Tata Nexon', P({}), ''],
  ];

  const rides = defs.map((d, i) => {
    const km = U.distanceKm(d[1], d[2]) || 100;
    return {
      id: 'r_seed' + (i + 1), driverId: d[0], from: d[1], to: d[2],
      date: U.addDays(d[3]), time: d[4], seats: d[5], price: U.suggestFare(km),
      car: d[6], prefs: d[7], notes: d[8], status: 'active', createdAt: Date.now() - i * 3600000,
    };
  });

  return { users, rides, bookings: [] };
};
