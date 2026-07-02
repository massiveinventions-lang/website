// Runtime configuration for the static build.
// Read by src/lib/api.ts on app startup.
//
// Why runtime config instead of build-time env var?
// --------------------------------------------------
// When the public site is hosted on Hostinger (or any static host),
// you can't change environment variables after deployment without
// rebuilding. By reading the API URL from this file instead, you can
// point the same build at a staging backend, a production backend,
// or a local mock — just by editing this file and re-uploading.
//
// SECURITY: this file is served to the public. Do NOT put secrets
// here. Only the public backend URL goes in. Admin auth tokens and
// Razorpay keys stay server-side.

window.__APP_CONFIG__ = {
  apiUrl: "https://massive-inventions-api.vercel.app",
};