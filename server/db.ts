import * as schema from "@shared/schema";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL must be set. Did you forget to provision a database?");
}

const isNeon = /neon\.tech/i.test(databaseUrl);

let db: any;

if (isNeon) {
  // Neon serverless (WebSocket-based) - for Neon cloud
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const { Pool, neonConfig } = await import('@neondatabase/serverless');
  const ws = (await import('ws')).default;
  neonConfig.webSocketConstructor = ws as any;
  const pool = new Pool({
    connectionString: databaseUrl,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });
  const { drizzle } = await import('drizzle-orm/neon-serverless');
  db = drizzle({ client: pool, schema });
} else {
  // Standard Postgres (node-postgres) - for local/managed PostgreSQL
  const pgMod: any = await import('pg');
  const PoolCtor = pgMod?.Pool ?? pgMod?.default?.Pool ?? pgMod?.default;
  if (!PoolCtor) {
    throw new Error('Failed to load pg Pool constructor');
  }
  const pool = new PoolCtor({
    connectionString: databaseUrl,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });
  const { drizzle } = await import('drizzle-orm/node-postgres');
  db = drizzle(pool, { schema });
}

export { db };