import "dotenv/config";
import { defineConfig } from "drizzle-kit";

// Loads DATABASE_URL from .env automatically — `npx drizzle-kit push` works with no CLI flags.
// Never hardcode a connection string here. See config.txt for where each variable comes from.
export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  strict: true,
  verbose: true,
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
