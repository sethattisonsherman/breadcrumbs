import test from "node:test";
import assert from "node:assert/strict";
import { databaseConfig } from "../db-config.js";
test("Supabase session pooler uses verified TLS without exposing credentials", () => {
  const config = databaseConfig({
    DATABASE_URL:
      "postgresql://postgres.example:placeholder@aws-0-us-east-1.pooler.supabase.com:5432/postgres",
  });
  const url = new URL(config.connectionString);
  assert.equal(url.searchParams.get("sslmode"), "verify-full");
  assert.equal(config.max, 5);
  assert.equal(url.port, "5432");
});
test("provider CA is supported and insecure Supabase TLS mode is not retained", () => {
  const config = databaseConfig({
    DATABASE_URL:
      "postgresql://postgres:placeholder@db.example.supabase.co/postgres?sslmode=no-verify",
    DATABASE_CA_CERT_PATH: "./secrets/provider-ca.crt",
  });
  const url = new URL(config.connectionString);
  assert.equal(url.searchParams.get("sslmode"), "verify-full");
  assert.equal(
    url.searchParams.get("sslrootcert"),
    "./secrets/provider-ca.crt",
  );
});
test("local Postgres continues to work and malformed config errors contain no URL", () => {
  const config = databaseConfig({
    DATABASE_URL:
      "postgresql://breadcrumbs:placeholder@127.0.0.1:5432/breadcrumbs",
    DATABASE_SCHEMA: "bc_test",
    DATABASE_POOL_MAX: "3",
  });
  assert.equal(
    new URL(config.connectionString).searchParams.has("sslmode"),
    false,
  );
  assert.equal(config.max, 3);
  assert.equal(config.options, "-c search_path=bc_test");
  assert.throws(
    () => databaseConfig({ DATABASE_URL: "private-placeholder" }),
    /^Error: DATABASE_URL must be a valid PostgreSQL connection URL\.$/,
  );
  assert.throws(
    () =>
      databaseConfig({
        DATABASE_URL: "postgresql://localhost/db",
        DATABASE_SCHEMA: "public;DROP TABLE users",
      }),
    /Invalid database schema/,
  );
});
