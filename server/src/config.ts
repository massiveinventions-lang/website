import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const required = (key: string): string => {
  const v = process.env[key];
  if (!v) return "";
  return v;
};

export const config = {
  port: Number(process.env.PORT ?? 4000),
  nodeEnv: process.env.NODE_ENV ?? "development",
  clientOrigin: process.env.CLIENT_ORIGIN ?? "http://localhost:3000",

  jwtSecret: process.env.JWT_SECRET ?? "dev-only-jwt-secret-change-me",

  databaseUrl: process.env.DATABASE_URL ?? "",

  supabase: {
    url: required("SUPABASE_URL"),
    anonKey: required("SUPABASE_ANON_KEY"),
    serviceRoleKey: required("SUPABASE_SERVICE_ROLE_KEY"),
    storageBucket: process.env.SUPABASE_STORAGE_BUCKET ?? "products",
  },

  useMocks: process.env.MOCK_INTEGRATIONS === "true",

  adminEmails: (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean),

  razorpay: {
    keyId: required("RAZORPAY_KEY_ID"),
    keySecret: required("RAZORPAY_KEY_SECRET"),
    webhookSecret: required("RAZORPAY_WEBHOOK_SECRET"),
  },

  shiprocket: {
    email: required("SHIPROCKET_EMAIL"),
    password: required("SHIPROCKET_PASSWORD"),
    pickupLocation: process.env.SHIPROCKET_PICKUP_LOCATION ?? "Home",
  },
};

// Boolean helpers — true only if all required keys are present
export const integrations = {
  database: Boolean(config.databaseUrl),
  supabase: Boolean(
    config.supabase.url && config.supabase.anonKey && config.supabase.serviceRoleKey
  ),
  razorpay: Boolean(config.razorpay.keyId && config.razorpay.keySecret),
  shiprocket: Boolean(config.shiprocket.email && config.shiprocket.password),
};
