import fs from "node:fs";
import path from "node:path";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  prismaConnectionString?: string;
};

const SSL_MODES_ALIASED_TO_VERIFY_FULL = new Set(["prefer", "require", "verify-ca"]);

function readEnvValueFromProjectFile(key: string) {
  for (const fileName of [".env.local", ".env"]) {
    const filePath = path.join(/* turbopackIgnore: true */ process.cwd(), fileName);
    if (!fs.existsSync(filePath)) {
      continue;
    }

    const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) {
        continue;
      }

      const separatorIndex = trimmed.indexOf("=");
      if (separatorIndex === -1) {
        continue;
      }

      const currentKey = trimmed.slice(0, separatorIndex).trim();
      if (currentKey !== key) {
        continue;
      }

      let value = trimmed.slice(separatorIndex + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      return value;
    }
  }

  return undefined;
}

function normalizePostgresSslMode(connectionString: string) {
  try {
    const parsedUrl = new URL(connectionString);
    if (parsedUrl.protocol !== "postgres:" && parsedUrl.protocol !== "postgresql:") {
      return connectionString;
    }

    const useLibpqCompat = parsedUrl.searchParams.get("uselibpqcompat");
    if (useLibpqCompat?.toLowerCase() === "true") {
      return connectionString;
    }

    const sslMode = parsedUrl.searchParams.get("sslmode");
    if (!sslMode || !SSL_MODES_ALIASED_TO_VERIFY_FULL.has(sslMode.toLowerCase())) {
      return connectionString;
    }

    parsedUrl.searchParams.set("sslmode", "verify-full");
    return parsedUrl.toString();
  } catch {
    return connectionString;
  }
}

function resolveDatabaseUrl() {
  const databaseUrlFromFile = readEnvValueFromProjectFile("DATABASE_URL");
  const databaseUrl = databaseUrlFromFile ?? process.env.DATABASE_URL;
  const normalizedDatabaseUrl = databaseUrl ? normalizePostgresSslMode(databaseUrl) : databaseUrl;

  if (normalizedDatabaseUrl) {
    process.env.DATABASE_URL = normalizedDatabaseUrl;
  }

  return normalizedDatabaseUrl;
}

const resolvedConnectionString = resolveDatabaseUrl();
const shouldReusePrisma =
  Boolean(globalForPrisma.prisma) && globalForPrisma.prismaConnectionString === resolvedConnectionString;

export const prisma =
  (shouldReusePrisma ? globalForPrisma.prisma : undefined) ??
  (() => {
    const connectionString = resolvedConnectionString;
    if (!connectionString) {
      throw new Error("DATABASE_URL belum di-set. Isi env sebelum menjalankan aplikasi.");
    }

    const adapter = new PrismaPg({ connectionString });

    return new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    });
  })();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
  globalForPrisma.prismaConnectionString = resolvedConnectionString;
}

