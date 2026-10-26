import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Fallback keeps `prisma generate` working when no .env is present (e.g. Docker build).
    url: process.env.DATABASE_URL ?? "file:./data/wichtel.db",
  },
});
