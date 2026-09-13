# Markitt PH
### Local Small Business Digital Showcase Platform
**University of Port Harcourt — BSc Computer Science Final Year Project**

---

## Project Overview

Markitt PH is a zero-cost, browser-based digital showcase platform for small and medium businesses in Port Harcourt, Rivers State. It is built entirely with HTML5, CSS3, and JavaScript (ES6+), with all data stored in the browser's `localStorage` API. No server, backend, or internet connection is required to run the platform.

---

## Folder Structure

```
markitt-ph/
│
├── index.html          ← Homepage: browse and search all businesses
├── register.html       ← 4-step business registration form
├── profile.html        ← Public business profile page
├── dashboard.html      ← Owner management dashboard (login required)
├── admin.html          ← Admin moderation panel (password protected)
│
├── css/
│   ├── styles.css      ← Main design system (colours, components, layout)
│   ├── template-a.css  ← Template A: Clean Minimal profile style
│   └── template-b.css  ← Template B: Bold Vibrant profile style
│
└── js/
    ├── utils.js        ← Shared helpers: localStorage, toast, star rendering
    ├── auth.js         ← Owner session login/logout
    ├── profile.js      ← Business + product CRUD operations
    ├── register.js     ← Multi-step registration form logic
    ├── search.js       ← Homepage search and category filter
    ├── reviews.js      ← Review submission and rendering
    ├── share.js        ← Profile link sharing (Web Share API + clipboard)
    ├── profile-view.js ← Public profile page renderer + Leaflet map
    ├── dashboard.js    ← Owner dashboard: analytics, products, editor
    └── admin.js        ← Admin panel: moderation, delete businesses/reviews
```

---

## How to Run

### Option 1 — Open directly in browser (quickest)
1. Download and unzip the project folder.
2. Open `index.html` in **Google Chrome**, **Firefox**, or **Microsoft Edge**.
3. That's it — no installation needed.

> ⚠️ **Note:** Some browsers block `localStorage` for files opened directly from disk (`file://` protocol) in private/incognito mode. Use a normal browser window, not incognito.

### Option 2 — Use VS Code Live Server (recommended for development)
1. Open the `markitt-ph/` folder in **Visual Studio Code**.
2. Install the **Live Server** extension (by Ritwick Dey) from the Extensions panel.
3. Right-click `index.html` → **Open with Live Server**.
4. The site opens at `http://127.0.0.1:5500/`.

### Option 3 — Python local server
```bash
cd markitt-ph/
python -m http.server 5500
# Open http://localhost:5500 in your browser
```

---

## How to Use

### As a Business Owner
1. Go to `index.html` → click **"Put Your Biz on the Map!"**
2. Fill in your business details (name, category, description, phone).
3. Create an owner account (name + password — min. 6 characters).
4. Choose Template A (Clean Minimal) or Template B (Bold Vibrant).
5. Add at least one product or service.
6. (Optional) Enter your latitude/longitude from Google Maps for the map pin.
7. Click **"Put Your Biz on the Map!"** — your profile is live.
8. Copy the shareable link from the success screen and send to your customers.

### To Return to Your Dashboard
- Go to `dashboard.html`
- Enter your business name and the password you created
- View analytics, edit products, update your profile, or remove reviews

### As a Customer
- Browse `index.html` to see all businesses
- Filter by category or search by name
- Click **"See Profile"** on any card to view the full profile
- Click **"Drop a Review"** on the profile page to leave a star rating and review

### Admin Panel
- Go to `admin.html`
- Default password: **`markittadmin2025`**
- View all registered businesses and reviews
- Delete any business or remove any inappropriate review
- To change the admin password: open `js/admin.js` and change the `ADMIN_PLAIN` value at the top

---

## localStorage Data Structure

All data is stored under these browser localStorage keys:

| Key | Contents |
|---|---|
| `markittph_businesses` | Array of all business profile objects |
| `markittph_products` | Object — `{ bizId: [product, ...] }` |
| `markittph_reviews` | Object — `{ bizId: [review, ...] }` |
| `markittph_analytics` | Object — `{ bizId: { views, shares } }` |

Session data (login state) is stored in `sessionStorage` and is cleared when the browser tab is closed.

---

## External Libraries Used (loaded via CDN — internet required on first load)

| Library | Version | Purpose |
|---|---|---|
| Font Awesome | 6.5.0 | Icons throughout the UI |
| Google Fonts (Poppins + Inter) | — | Typography |
| Leaflet.js | 1.9.4 | Map rendering on profile location tab |
| OpenStreetMap | — | Map tile provider for Leaflet |

> All CDN resources are loaded from trusted public CDNs. If running fully offline, download these libraries locally and update the `<link>` and `<script>` tags in each HTML file accordingly.

---

## Colour Palette

| Colour | Hex | Usage |
|---|---|---|
| Primary Blue | `#1A3C6E` | Navbar, headings, section borders |
| Secondary Orange | `#E87722` | CTA buttons, star ratings, highlights |
| Accent Green | `#2D6A4F` | Category badges, open status, success messages |
| Light Grey | `#F4F6F9` | Page background, card surfaces |
| Dark Text | `#111111` | All body content |

---

## Pidgin Labels Reference

| Label in UI | Meaning |
|---|---|
| "Put Your Biz on the Map!" | Register / Submit |
| "Share Your Biz" | Share profile link |
| "Drop a Review" | Submit a review |
| "See Profile" | View business profile |
| "Make Your Business Shine for PH" | Homepage hero tagline |
| "No review yet — be the first!" | Empty reviews state |

---

## Known Limitations (Scope of Prototype)

- **Single-device only** — localStorage does not sync across devices or browsers.
- **No real authentication** — passwords are hashed with SHA-256 but stored client-side. Suitable for a prototype; a production version would require a backend.
- **Image size** — large images are automatically resized to max 600×600px before storing, but very many product images may approach localStorage limits (~5MB per origin).
- **Admin password** — stored as a hashed constant in JavaScript source. Change before deployment.

---

*Markitt PH · Built for Port Harcourt Small Businesses · BSc CS Final Year Project · University of Port Harcourt · 2025*
