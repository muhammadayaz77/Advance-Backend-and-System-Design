/**
 * Ensures the database from DATABASE_URL exists (connects to `postgres` and runs CREATE DATABASE).
 * Then runs Prisma migrations. Requires a user with CREATEDB (typical local superuser/postgres).
 */
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
const { spawnSync } = require('child_process');

function loadDatabaseUrl() {
  const envPath = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) {
    throw new Error(`Missing ${envPath}`);
  }
  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    if (key !== 'DATABASE_URL') continue;
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    return val;
  }
  throw new Error('DATABASE_URL not found in .env');
}

function adminUrlFor(databaseUrl) {
  const normalized = databaseUrl.replace(/^postgresql:/i, 'http:');
  const u = new URL(normalized);
  const search = u.search;
  u.pathname = '/postgres';
  u.search = search;
  return u.toString().replace(/^http:/i, 'postgresql:');
}

function databaseNameFrom(databaseUrl) {
  const normalized = databaseUrl.replace(/^postgresql:/i, 'http:');
  const u = new URL(normalized);
  const name = u.pathname.replace(/^\//, '').split('?')[0];
  if (!name) throw new Error('DATABASE_URL has no database name in path');
  return decodeURIComponent(name);
}

async function main() {
  const databaseUrl = loadDatabaseUrl();
  process.env.DATABASE_URL = databaseUrl;

  const dbName = databaseNameFrom(databaseUrl);
  const adminUrl = adminUrlFor(databaseUrl);

  const admin = new Client({ connectionString: adminUrl });
  await admin.connect();

  const { rows } = await admin.query(
    'SELECT 1 FROM pg_database WHERE datname = $1',
    [dbName],
  );

  if (rows.length === 0) {
    const ident = `"${dbName.replace(/"/g, '""')}"`;
    await admin.query(`CREATE DATABASE ${ident}`);
    console.log(`[ensure-db] Created database ${dbName}`);
  } else {
    console.log(`[ensure-db] Database ${dbName} already exists`);
  }

  await admin.end();

  const prisma = spawnSync(
    process.platform === 'win32' ? 'npx.cmd' : 'npx',
    ['prisma', 'migrate', 'deploy'],
    {
      cwd: path.join(__dirname, '..'),
      stdio: 'inherit',
      env: process.env,
      shell: process.platform === 'win32',
    },
  );
  if (prisma.status !== 0) {
    process.exit(prisma.status ?? 1);
  }
}

main().catch((err) => {
  console.error('[ensure-db]', err.message || err);
  process.exit(1);
});
