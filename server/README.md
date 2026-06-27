# Massive Inventions — Backend

Node.js + Express + MongoDB API for the Massive Inventions e-commerce site.
Implements the spec in `../massive-inventions-guide.html`:

- **Auth** — Firebase Admin verifies ID tokens from the client
- **Products** — CRUD (`GET/POST/PUT/DELETE /api/products`)
- **Orders** — Razorpay create/verify + webhook, Shiprocket dispatch
- **Uploads** — multer + Cloudinary (admin only)
- **Admin** — stats, order status, AWB tracking

All third-party integrations are **optional** — if a key is missing in `.env`,
the relevant endpoint still responds, but uses a stub. This keeps the server
fully bootable in development without external accounts.

## Quick start (no external accounts)

```bash
cd server
cp .env.example .env
# leave all values blank to run in stub mode
npm install
npm run dev          # http://localhost:4000
```

```bash
npm run seed         # loads 5 products into MongoDB (requires MONGO_URI)
```

## Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| GET    | `/api/health`                      | public  | Server + integration status |
| GET    | `/api/products`                    | public  | List products (filter: `?category=Speakers&q=...`) |
| GET    | `/api/products/:id`                | public  | Single product |
| POST   | `/api/products`                    | admin   | Create |
| PUT    | `/api/products/:id`                | admin   | Update |
| DELETE | `/api/products/:id`                | admin   | Delete |
| POST   | `/api/orders/create`               | user    | Hydrate items, create Razorpay order |
| POST   | `/api/orders/verify`               | user    | Verify signature, mark paid, dispatch via Shiprocket |
| POST   | `/api/orders/webhook/razorpay`     | public* | Razorpay webhook (raw body, HMAC verified) |
| GET    | `/api/orders/mine`                 | user    | Current user's orders |
| GET    | `/api/orders/:id`                  | user    | Single order (owner or admin) |
| GET    | `/api/orders`                      | admin   | All orders |
| POST   | `/api/upload`                      | admin   | Multipart `file=@image.png` → Cloudinary URL |
| GET    | `/api/admin/stats`                 | admin   | Counts + revenue |
| PATCH  | `/api/admin/orders/:id/status`     | admin   | Manual status override |
| GET    | `/api/admin/orders/:id/track`      | admin   | Live tracking from Shiprocket |

\* Webhook is unauthenticated by signature, not bearer token.

## Auth

Production: client logs in with Firebase, sends `Authorization: Bearer <idToken>`.
The server verifies with `firebase-admin` and upserts the user (auto-promotes
email to `role: "admin"` if listed in `ADMIN_EMAILS`).

Local dev (Firebase not configured): send `X-Dev-Email: you@example.com` instead.
Make sure your email is in `ADMIN_EMAILS` to test admin routes.

## Deployment (Railway)

1. Push the `server/` folder to a Git repo (or include it as a monorepo).
2. New project on [railway.app](https://railway.app) → Deploy from GitHub.
3. Set env vars from `.env.example` (at minimum `MONGO_URI`).
4. Add the public domain (e.g. `api.massiveinventions.in`).
5. Update frontend `VITE_API_URL` to that domain.

`railway.json` and `Procfile` are included; Railway auto-detects Node and
runs `npm run build && npm start`.

## Project layout

```
server/
├── src/
│   ├── config.ts              # env loading + integrations flag
│   ├── db.ts                  # mongoose connect
│   ├── index.ts               # app entry, mounts routes
│   ├── models/                # User, Product, Order
│   ├── middleware/auth.ts     # Firebase + admin guard
│   ├── middleware/errors.ts
│   ├── routes/products.ts
│   ├── routes/orders.ts
│   ├── routes/upload.ts
│   ├── routes/admin.ts
│   ├── services/razorpay.ts
│   ├── services/shiprocket.ts
│   ├── services/cloudinary.ts
│   └── scripts/seed.ts        # loads 5 products
├── .env.example
├── package.json
├── tsconfig.json
├── railway.json
└── Procfile
```
