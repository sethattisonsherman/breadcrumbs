export function databaseConfig(env = process.env) {
  if (!env.DATABASE_URL)
    throw new Error(
      "DATABASE_URL is required. Configure a PostgreSQL or Supabase connection in .env.",
    );
  let url;
  try {
    url = new URL(env.DATABASE_URL);
  } catch {
    throw new Error("DATABASE_URL must be a valid PostgreSQL connection URL.");
  }
  if (!["postgres:", "postgresql:"].includes(url.protocol))
    throw new Error("DATABASE_URL must use the PostgreSQL protocol.");
  const schema = env.DATABASE_SCHEMA || "public";
  if (!/^[a-z][a-z0-9_]{0,62}$/.test(schema))
    throw new Error("Invalid database schema name.");
  const poolMax = Number(env.DATABASE_POOL_MAX || 5);
  if (!Number.isInteger(poolMax) || poolMax < 1 || poolMax > 50)
    throw new Error("DATABASE_POOL_MAX must be between 1 and 50.");
  const supabase = /\.(supabase\.co|supabase\.com)$/.test(url.hostname);
  if (supabase) url.searchParams.set("sslmode", "verify-full");
  if (env.DATABASE_CA_CERT_PATH) {
    url.searchParams.set("sslrootcert", env.DATABASE_CA_CERT_PATH);
    url.searchParams.set("sslmode", "verify-full");
  }
  return {
    connectionString: url.toString(),
    max: poolMax,
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
    options: `-c search_path=${schema}`,
  };
}
