import pg from "pg";
import { databaseConfig } from "../db-config.js";
const pool = new pg.Pool(databaseConfig());
try {
  const result = await pool.query(
    "SELECT current_setting('server_version') AS version, (SELECT ssl FROM pg_stat_ssl WHERE pid=pg_backend_pid()) AS tls",
  );
  console.log(
    `PostgreSQL connection verified (version ${result.rows[0].version}; TLS ${result.rows[0].tls ? "enabled" : "not used on this connection"}).`,
  );
} catch {
  console.error(
    "Could not connect. Check DATABASE_URL, database availability, and the provider CA certificate. No credentials were logged.",
  );
  process.exitCode = 1;
} finally {
  await pool.end();
}
