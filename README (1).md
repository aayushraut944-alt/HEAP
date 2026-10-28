# HEAP – Carpooling web app

**Share the ride. Split the cost.** HEAP connects drivers with empty seats to riders going the same way.
Zero build step, zero dependencies – open `index.html` and it runs.

## Features
- **Find a ride** – search by origin, destination, date and seats; sort by time / price / driver rating; filter by price and preferences (AC, music, pets, luggage)
- **Offer a ride** – publish a trip with seats, price, car, preferences and notes; built-in **fare helper** suggests a fair price from distance
- **Ride details & booking** – driver profile, rating, car, seat picker with live total, duplicate / own-ride / overbooking protection
- **My trips** – booked and offered tabs, cancel booking/ride, passenger list, seat-fill progress, rate drivers after a trip
- **Profile** – edit details, see rides taken/offered, money saved and CO₂ saved
- **Auth** – sign up, log in, protected pages, "Use demo account" button
- Responsive (mobile → desktop), keyboard accessible, toasts and modals

## Run it
Just double-click `index.html`, or serve the folder:

```bash
npx serve .          # or: python3 -m http.server 8000
```

**Demo login:** `demo@heap.app` / `heap123` (every seeded user shares this password).
Use the browser's storage reset (or call `HEAP.store.resetDemo()` in the console) to restore the sample data.

## Project structure
All files live in one flat folder:
```
HEAP/
├── index.html   # page shell, script load order
├── styles.css   # design tokens, components, views, responsive rules
├── utils.js     # cities, distance/fare maths, formatting helpers
├── seed.js      # sample users and rides
├── store.js     # data layer (localStorage): auth, rides, bookings, ratings
├── ui.js        # toast, modal, avatar, ride card, booking modal
├── home.js      # landing page view
├── search.js    # results + filters view
├── offer.js     # offer-a-ride view + fare helper
├── trips.js     # my trips view, rating
├── profile.js   # profile view
├── auth.js      # login / signup views
└── app.js       # navbar + hash router + bootstrap
```
Each view exports `{ render(query) → HTML, mount(root, query) }`; the router calls both.

## Architecture notes
- **Layers:** `utils` → `seed` → `store` (all data rules live here) → `ui` components → `views` → `router`. Views never touch `localStorage` directly.
- **Going to production:** `store.js` is the only file to replace. Implement the same methods against a REST/GraphQL API (Node/Express + PostgreSQL, Firebase, Supabase…) and the UI keeps working. Replace the demo hash with real server-side auth (bcrypt + JWT/sessions).
- **Ideas to extend:** live map (Leaflet/Google Maps), in-app chat, payments (Razorpay/UPI), ID verification, email/SMS notifications, recurring commutes.

> Demo notice: all data (accounts, rides, bookings) is stored only in your browser. Passwords use a lightweight hash for demo purposes and are not secure.
