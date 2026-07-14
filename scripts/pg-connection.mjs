import pg from "pg";
import { readFileSync } from "fs";

/**
 * Build Supabase Postgres clients in the order most likely to succeed for DDL.
 * Direct connection (db.<ref>.supabase.co) is tried before pooler modes.
 */
export function loadEnvFile(envPath) {
  const env = {};
  try {
    const raw = readFileSync(envPath, "utf8");
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const idx = trimmed.indexOf("=");
      if (idx === -1) continue;
      env[trimmed.slice(0, idx)] = trimmed.slice(idx + 1);
    }
  } catch {
    return null;
  }
  return env;
}

export function buildPgClients(env) {
  if (!env) return [];

  const databaseUrl = env.DATABASE_URL || env.SUPABASE_DB_URL;
  if (databaseUrl) {
    return [
      {
        label: "DATABASE_URL",
        client: new pg.Client({
          connectionString: databaseUrl,
          ssl: { rejectUnauthorized: false },
        }),
      },
    ];
  }

  const password = env.SUPABASE_DB_PASSWORD?.trim();
  const projectRef = env.NEXT_PUBLIC_SUPABASE_URL
    ? new URL(env.NEXT_PUBLIC_SUPABASE_URL).hostname.split(".")[0]
    : null;

  if (!password || !projectRef) return [];

  const poolerHost = env.SUPABASE_DB_HOST?.trim();
  const poolerRegions = [
    ...(poolerHost ? [poolerHost] : []),
    "aws-1-ap-south-1.pooler.supabase.com",
    "aws-0-ap-south-1.pooler.supabase.com",
    "aws-0-ap-southeast-1.pooler.supabase.com",
    "aws-0-us-east-1.pooler.supabase.com",
    "aws-0-eu-west-1.pooler.supabase.com",
    "aws-0-eu-central-1.pooler.supabase.com",
  ].filter((host, index, all) => all.indexOf(host) === index);
  const ssl = { rejectUnauthorized: false };

  const clients = [
    {
      label: "direct",
      client: new pg.Client({
        user: "postgres",
        password,
        host: `db.${projectRef}.supabase.co`,
        port: 5432,
        database: "postgres",
        ssl,
      }),
    },
  ];

  for (const host of poolerRegions) {
    clients.push(
      {
        label: `pooler-session@${host}`,
        client: new pg.Client({
          user: `postgres.${projectRef}`,
          password,
          host,
          port: Number(env.SUPABASE_DB_PORT || 5432),
          database: "postgres",
          ssl,
        }),
      },
      {
        label: `pooler-transaction@${host}`,
        client: new pg.Client({
          user: `postgres.${projectRef}`,
          password,
          host,
          port: 6543,
          database: "postgres",
          ssl,
        }),
      }
    );
  }

  return clients;
}

/** Connect using the first working client config. */
export async function connectPg(env) {
  const candidates = buildPgClients(env);
  const errors = [];

  for (const { label, client } of candidates) {
    try {
      await client.connect();
      return { client, label };
    } catch (err) {
      errors.push(`${label}: ${err instanceof Error ? err.message : String(err)}`);
      await client.end().catch(() => {});
    }
  }

  return {
    client: null,
    error:
      errors.length > 0
        ? errors.join("; ")
        : "No DATABASE_URL or SUPABASE_DB_PASSWORD configured",
  };
}
