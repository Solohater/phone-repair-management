require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })
const bcrypt = require('bcrypt')
const crypto = require('crypto')
const { pool } = require('../db')

const ADMIN_USERNAME = 'admin'
const ADMIN_PASSWORD = 'admin123'

async function initSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS "User" (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      roles TEXT NOT NULL DEFAULT '["Employee"]',
      active BOOLEAN NOT NULL DEFAULT true,
      "createdAt" TIMESTAMPTZ DEFAULT NOW()
    )
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS "Note" (
      id TEXT PRIMARY KEY,
      ticket TEXT,
      title TEXT NOT NULL,
      text TEXT NOT NULL,
      comment TEXT DEFAULT '',
      status TEXT NOT NULL DEFAULT 'new',
      "userId" TEXT NOT NULL REFERENCES "User"(id),
      "createdAt" TIMESTAMPTZ DEFAULT NOW(),
      "updatedAt" TIMESTAMPTZ DEFAULT NOW()
    )
  `)

  console.log('Schema initialized.')
}

async function seedAdmin() {
  const existing = await pool.query('SELECT id FROM "User" WHERE username = $1', [ADMIN_USERNAME])
  if (existing.rows.length > 0) {
    console.log(`Admin user "${ADMIN_USERNAME}" already exists, skipping seed.`)
    return
  }

  const hashedPwd = await bcrypt.hash(ADMIN_PASSWORD, 10)
  const id = crypto.randomUUID()
  const roles = JSON.stringify(['Admin'])

  await pool.query(
    'INSERT INTO "User" (id, username, password, roles, active) VALUES ($1, $2, $3, $4, $5)',
    [id, ADMIN_USERNAME, hashedPwd, roles, true]
  )

  console.log(`Admin user seeded: username="${ADMIN_USERNAME}" password="${ADMIN_PASSWORD}"`)
}

async function main() {
  try {
    await initSchema()
    await seedAdmin()
    console.log('Seed complete.')
  } catch (err) {
    console.error('Seed failed:', err)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

main()
