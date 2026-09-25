import "dotenv/config";
import { defineConfig } from "drizzle-kit";

// Loads environment variables from .env automatically.
// Never hardcode a connection string here.
// See config.txt for where each variable comes from.
const url = process.env.DATABASE_URL_DIRECT || process.env.DATABASE_URL;

if (!url) {
throw new Error(
"DATABASE_URL is required. Copy .env.example to .env and set it. Never pass the URL on the CLI."
);
}

export default defineConfig({
dialect: "postgresql",
schema: "./src/db/schema.ts",
out: "./drizzle",
strict: true,
verbose: true,
dbCredentials: {
url,
},
});