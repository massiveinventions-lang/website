# TODO - Run project locally (frontend + backend + admin APIs)

## Step 1: Identify run commands/ports
- [x] Checked root frontend `package.json` (pnpm dev)
- [x] Checked Vite proxy config in `vite.config.ts`
- [x] Checked backend `server/package.json` (npm run dev)
- [x] Checked backend port expectations from `server/src/config.ts` and server entry

## Step 2: Identify admin panel implementation
- [x] Confirmed admin UI is not a separate frontend route in `src/App.tsx`
- [x] Confirmed admin panel functionality is implemented via backend routes under `/api/admin/*`
- [x] Read `server/src/routes/admin.ts` to confirm admin login endpoint and protected endpoints

## Step 3: Provide local run procedure
- [ ] Add a consolidated run guide (frontend + backend)
- [ ] Add admin login + header usage examples

## Step 4: Local verification checklist
- [ ] Verify `GET /api/health` works
- [ ] Verify `GET /api/products` works
- [ ] Verify admin: `POST /api/admin/login` then `GET /api/admin/stats`

