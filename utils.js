/* HEAP – shared helpers: cities, distance/fare maths, formatting */
window.HEAP = window.HEAP || {};

HEAP.utils = (function () {
  const CITIES = [
    { name: 'Mumbai', lat: 19.076, lng: 72.8777 },
    { name: 'Thane', lat: 19.2183, lng: 72.9781 },
    { name: 'Navi Mumbai', lat: 19.033, lng: 73.0297 },
    { name: 'Pune', lat: 18.5204, lng: 73.8567 },
    { name: 'Lonavala', lat: 18.7546, lng: 73.4062 },
    { name: 'Nashik', lat: 19.9975, lng: 73.7898 },
    { name: 'Alibaug', lat: 18.6414, lng: 72.8722 },
    { name: 'Kolhapur', lat: 16.705, lng: 74.2433 },
    { name: 'Aurangabad', lat: 19.8762, lng: 75.3433 },
    { name: 'Nagpur', lat: 21.1458, lng: 79.0882 },
    { name: 'Surat', lat: 21.1702, lng: 72.8311 },
    { name: 'Vadodara', lat: 22.3072, lng: 73.1812 },
    { name: 'Ahmedabad', lat: 23.0225, lng: 72.5714 },
    { name: 'Indore', lat: 22.7196, lng: 75.8577 },
    { name: 'Goa', lat: 15.4909, lng: 73.8278 },
    { name: 'Bengaluru', lat: 12.9716, lng: 77.5946 },
    { name: 'Hyderabad', lat: 17.385, lng: 78.4867 },
    { name: 'Chennai', lat: 13.0827, lng: 80.2707 },
    { name: 'Jaipur', lat: 26.9124, lng: 75.7873 },
    { name: 'Delhi', lat: 28.6139, lng: 77.209 },
  ];

  const POPULAR_ROUTES = [
    ['Mumbai', 'Pune'],
    ['Pune', 'Mumbai'],
    ['Mumbai', 'Nashik'],
    ['Mumbai', 'Goa'],
    ['Bengaluru', 'Chennai'],
    ['Delhi', 'Jaipur'],
  ];

  const findCity = (n) =>
    CITIES.find((c) => c.name.toLowerCase() === String(n || '').trim().toLowerCase());
  const rad = (d) => (d * Math.PI) / 180;

  /** Approx road distance in km (great-circle × 1.3). */
  function distanceKm(a, b) {
    const A = findCity(a), B = findCity(b);
    if (!A || !B) return null;
    const dLat = rad(B.lat - A.lat), dLng = rad(B.lng - A.lng);
    const h = Math.sin(dLat / 2) ** 2 +
      Math.cos(rad(A.lat)) * Math.cos(rad(B.lat)) * Math.sin(dLng / 2) ** 2;
    return Math.max(5, Math.round(2 * 6371 * Math.asin(Math.sqrt(h)) * 1.3));
  }
  const durationMin = (km) => Math.round((km / 55) * 60);
  /** Suggested fare per seat in INR (fuel + tolls share, ~₹2.2/km). */
  const suggestFare = (km) => Math.max(30, Math.round((km * 2.2) / 10) * 10);

  const esc = (s) =>
    String(s == null ? '' : s).replace(/[&<>"']/g, (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const uid = (p) => p + '_' + Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-3);

  /** Tiny non-cryptographic hash. Demo only – use a real backend + bcrypt in production. */
  function hash(str) {
    let h = 5381;
    for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) >>> 0;
    return h.toString(36);
  }

  const pad = (n) => String(n).padStart(2, '0');
  const dateStr = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const todayStr = () => dateStr(new Date());
  const addDays = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return dateStr(d); };
  const rideDateTime = (r) => new Date(`${r.date}T${r.time}:00`);

  function fmtDate(str) {
    const d = new Date(str + 'T00:00:00');
    const t = todayStr();
    if (str === t) return 'Today';
    if (str === addDays(1)) return 'Tomorrow';
    return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
  }
  function fmtTime(t) {
    const [h, m] = t.split(':').map(Number);
    return `${pad(h % 12 || 12)}:${pad(m)} ${h >= 12 ? 'PM' : 'AM'}`;
  }
  function fmtDuration(min) {
    const h = Math.floor(min / 60), m = min % 60;
    return h ? `${h}h${m ? ' ' + m + 'm' : ''}` : `${m}m`;
  }
  const money = (n) => '₹' + Number(n).toLocaleString('en-IN');
  const initials = (name) =>
    String(name || '?').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('');
  const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#14b8a6', '#ec4899', '#6366f1'];
  function colorFor(str) {
    let h = 0;
    for (const c of String(str)) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    return COLORS[h % COLORS.length];
  }

  return {
    CITIES, POPULAR_ROUTES, findCity, distanceKm, durationMin, suggestFare,
    esc, uid, hash, todayStr, addDays, dateStr, rideDateTime,
    fmtDate, fmtTime, fmtDuration, money, initials, colorFor,
  };
})();
