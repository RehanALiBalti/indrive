# Chauffeur & Private Transfer Website — Phase 1

Production-ready public website, CMS and REST API for a premium chauffeur / private
transfer business.

- **Frontend** — React 18 + Vite, React Router, plain-CSS design system
- **Backend** — Node.js + Express REST API (the only place Firebase Admin credentials live)
- **Database** — Firebase Firestore
- **Auth** — Firebase Authentication (ID tokens verified server-side, roles as custom claims)
- **Storage** — Firebase Storage for all CMS media

Everything a marketing or SEO user needs to change — page content, services, fleet,
FAQs, testimonials, blog, navigation, company details, tracking IDs, landing pages and
redirects — is editable in the admin area without a developer or a deployment.

---

## 1. Repository layout

```
.
├── client/                 React application (Vite)
│   ├── public/             Static assets copied verbatim to the build
│   └── src/
│       ├── admin/          Admin CMS (lazy-loaded, separate bundle)
│       ├── components/     Design system, layout, sections, forms, cards
│       ├── context/        Auth, Site settings, Toast providers
│       ├── hooks/          useApi, useForm
│       ├── lib/            API client, formatting, breadcrumbs, Firebase (auth only)
│       ├── pages/          Public pages and auth pages
│       └── styles/         Tokens + CSS layers
├── server/                 Express API
│   └── src/
│       ├── config/         Environment + Firebase Admin bootstrap
│       ├── constants/      Collection names, roles, defaults
│       ├── controllers/    Content router factory (shared CRUD behaviour)
│       ├── middleware/      Auth, validation, rate limiting, uploads, errors, SEO
│       ├── routes/         REST endpoints
│       ├── schemas/        Zod request/content schemas
│       ├── scripts/        seed.js, setAdmin.js
│       ├── seed/           Seed content used to bootstrap a new project
│       ├── services/       Repository, storage, email, sitemap, redirects, SEO meta
│       └── utils/          Cache, logger, helpers, API errors
├── firebase.json           Hosting/rules configuration
├── firestore.rules         Firestore security rules
├── firestore.indexes.json  Composite indexes
└── storage.rules           Storage security rules
```

---

## 2. Local setup

### Prerequisites

- Node.js 20 or newer
- A Firebase project with Firestore, Authentication (Email/Password) and Storage enabled

### Install

```bash
npm install
```

### Configure the API

```bash
cp server/.env.example server/.env
```

Fill in at minimum:

| Variable | Purpose |
| --- | --- |
| `FIREBASE_PROJECT_ID` | Firebase project ID |
| `FIREBASE_CLIENT_EMAIL` | Service account email |
| `FIREBASE_PRIVATE_KEY` | Service account private key (quoted, `\n` escapes intact) |
| `FIREBASE_STORAGE_BUCKET` | e.g. `your-project.appspot.com` |
| `SITE_URL` | Canonical public URL, no trailing slash |
| `CORS_ORIGINS` | Comma-separated list of allowed browser origins |
| `BOOTSTRAP_ADMIN_EMAIL` | First account registering with this email becomes an admin |

Create the service account in Firebase Console → Project settings → Service accounts →
Generate new private key. **Never commit the JSON file**; either paste the three values
into `.env` or point `GOOGLE_APPLICATION_CREDENTIALS` at a path outside the repository.

Email is optional. Without SMTP settings the forms still validate and save to Firestore;
they simply skip the notification email and log a warning.

### Configure the client

```bash
cp client/.env.example client/.env
```

The client only ever receives the public Firebase web config (safe to expose) plus the
API base URL. Firebase Admin credentials must never appear here.

### Seed the database

```bash
npm run seed
```

The seed is idempotent: it creates site settings, navigation menus, the three services,
a starter fleet, FAQs, testimonials, all static pages, SEO templates and example airport,
city and route landing pages. Re-running it will not duplicate content.

### Run it

```bash
npm run dev
```

- Web: http://localhost:5173
- API: http://localhost:5010/api/health

### Create your first admin

Register through `/sign-up` using the address in `BOOTSTRAP_ADMIN_EMAIL`, or promote an
existing account:

```bash
npm run set-admin -- someone@example.com
```

Roles are stored as Firebase custom claims and verified on every request. A role sent
from the browser is always ignored.

---

## 3. Architecture

```
React (browser)
   │  fetch + Firebase ID token
   ▼
Express REST API  ──  Firebase Admin SDK  ──  Firestore / Storage / Auth
```

- The browser holds the Firebase **web** SDK for authentication only. It never talks to
  Firestore or Storage directly.
- Every privileged read and write goes through the API, which verifies the ID token,
  checks the caller's role and validates the payload with Zod.
- Public content endpoints are cached in memory (`PUBLIC_CACHE_TTL`) and invalidated
  automatically whenever the CMS writes.

### Roles

| Role | Can do |
| --- | --- |
| `user` | Manage their own account |
| `editor` | All content, media and enquiries |
| `admin` | Everything, plus users, redirects, site settings and deletions |

The hierarchy lives in `server/src/constants/collections.js`; adding `driver`,
`dispatcher` or `corporate-manager` in Phase 2 is a one-line change.

### Firestore collections

`users`, `pages`, `services`, `vehicles`, `faqs`, `testimonials`, `blogPosts`,
`seoPages`, `seoTemplates`, `navigation`, `siteSettings`, `contactSubmissions`,
`bookingEnquiries`, `corporateEnquiries`, `supportRequests`, `newsletterSubscribers`,
`redirects`, `media`.

Names reserved for later phases are documented in the same file so they are never reused.

---

## 4. Content management

Sign in and open `/admin`.

| Area | What it controls |
| --- | --- |
| Pages | Any static page, built from re-orderable content sections |
| Services | The three services, their landing pages and enquiry forms |
| Fleet | Vehicles, images, capacities, features and ordering |
| Blog | Articles with rich text, FAQs, related posts and SEO metadata |
| FAQs / Testimonials | Reusable content shown across the site |
| Media library | Uploads to Firebase Storage with alt text |
| SEO landing pages | Airport, city and city-to-city pages |
| SEO templates | Reusable starting points with `{{token}}` substitution |
| Redirects | 301/302 rules applied before a page is served |
| Navigation | Header, mobile and footer menus |
| Site settings | Company details, social links, SEO defaults, tracking IDs, feature switches |
| Users & roles | Team accounts and permissions |
| Enquiries | Every form submission, with status, notes and CSV export |

### Publishing a new landing page without a developer

1. **SEO → Landing pages → Create from template**
2. Choose a template and fill in the tokens (airport name, city, route…)
3. The page is created as a draft at, for example,
   `/airport-transfers/heathrow-airport`
4. Edit the content, sections and FAQs, then **Save & publish**

It is live immediately, included in `sitemap-locations.xml` and internally linked from
coverage sections. No code changes, no deployment.

---

## 5. SEO

- Per-page editable title, meta description, slug, canonical, Open Graph and Twitter tags
- H1/H2/H3 structure controlled by content, not by the template
- `robots.txt` generated from site settings (and always served, even if Firestore is
  briefly unavailable)
- `sitemap.xml` index plus `sitemap-pages.xml`, `sitemap-fleet.xml`, `sitemap-blog.xml`
  and `sitemap-locations.xml`, all generated from published content
- Schema.org JSON-LD: Organisation, LocalBusiness, Service, Product, Article, FAQPage and
  BreadcrumbList
- Breadcrumbs on every inner page
- 301 redirect management in the admin area
- For crawlers, the API injects the resolved `<title>`, meta and canonical tags into the
  served HTML, so the correct metadata is present in the initial response
- Analytics: GA4, GTM, Search Console and Bing verification IDs are stored in site
  settings and only loaded after cookie consent when consent is required

---

## 6. Production build

```bash
npm run build          # builds client/dist
npm start              # runs the API (serves client/dist when SERVE_CLIENT=true)
```

### Option A — single service (simplest)

Deploy the API to Cloud Run, Render, Railway, Fly.io or any Node host, and let it serve
the built React app:

```
SERVE_CLIENT=true
CLIENT_DIST_PATH=../client/dist
NODE_ENV=production
SITE_URL=https://www.yourdomain.com
CORS_ORIGINS=https://www.yourdomain.com
```

Build command: `npm install && npm run build`
Start command: `npm start`

This gives you SEO meta injection, sitemaps, robots.txt and 301 redirects on the same
origin as the site, with no CDN rewrite rules to maintain.

### Option B — split hosting

Host `client/dist` on a static host or CDN and the API separately:

- Client: set `VITE_API_BASE_URL=https://api.yourdomain.com/api`
- Client host: rewrite all unknown paths to `/index.html` (SPA fallback)
- Client host: proxy `/sitemap*.xml` and `/robots.txt` to the API so they stay dynamic
- API: set `CORS_ORIGINS` to the site origin and `SERVE_CLIENT=false`

### Deploy the Firebase rules and indexes

```bash
firebase deploy --only firestore:rules,firestore:indexes,storage
```

Firestore rules deny all direct client access by design — every read and write is
brokered by the API. Storage allows public reads of `media/**` (so images can be served
from CDN URLs) and no client writes.

### HTTPS

Terminate TLS at your host or load balancer and redirect HTTP to HTTPS there. The API
sets HSTS, `X-Content-Type-Options`, a restrictive Referrer-Policy and a Content Security
Policy via Helmet when `NODE_ENV=production`.

### Option C — Docker

```bash
docker build -t chauffeur-web .
docker run --rm -p 5010:5010 \
  -e NODE_ENV=production \
  -e SERVE_CLIENT=true \
  -e SITE_URL=https://www.yourdomain.com \
  -e CORS_ORIGINS=https://www.yourdomain.com \
  -e FIREBASE_PROJECT_ID=... \
  -e FIREBASE_CLIENT_EMAIL=... \
  -e FIREBASE_PRIVATE_KEY="..." \
  -e FIREBASE_STORAGE_BUCKET=... \
  chauffeur-web
```

Set the same variables on Cloud Run, Render, Railway or Fly.io. The image serves the
built React app from the API (`SERVE_CLIENT=true`) so sitemaps, robots.txt, 301 redirects
and crawler-facing `<head>` tags all live on the public origin.

On Render/Railway the start command is `npm start` (see `Procfile`). Build command:
`npm install && npm run build`. Set `SERVE_CLIENT=true`.

### Go-live checklist

1. `SITE_URL` and `seo.siteUrl` in site settings both point at the canonical domain
2. `NODE_ENV=production` (otherwise `robots.txt` intentionally disallows everything)
3. `BOOTSTRAP_ADMIN_EMAIL` cleared once a real admin exists
4. `EMAIL_NOTIFY_TO` set so enquiries reach the team
5. Rules and indexes deployed
6. Submit `https://www.yourdomain.com/sitemap.xml` in Google Search Console
7. Add the GA4 / GTM IDs in **Site settings → Analytics**
8. Submit a test enquiry end to end and confirm the email arrives

---

## 7. Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | API and web dev servers together |
| `npm run build` | Production client build |
| `npm start` | Start the API |
| `npm run seed` | Idempotently seed Firestore with starter content |
| `npm run set-admin -- <email>` | Grant the admin role to an existing account |
| `npm run test` | API unit and public-endpoint tests |

---

## 8. Phase 2 readiness

The Phase 1 frontend consumes future APIs without a redesign:

- `siteSettings.features.liveBookingEnabled` flips enquiry CTAs to the booking engine
- The booking widget already collects and validates the full journey payload
  (`serviceType`, pickup, destination/airport, date, time, passengers, luggage, hours,
  preferred vehicle) and posts it to `/api/booking-enquiries`; a pricing/booking service
  can consume the same shape
- Vehicles carry `startingPriceLabel` today and can carry rate cards later
- Roles, the users collection and the auth flow are ready for customer dashboards,
  drivers, dispatch and corporate accounts
- Reserved collection names are documented so the data model stays coherent
