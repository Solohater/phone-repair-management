const { Pool } = require('pg')
const crypto = require('crypto')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
})

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err)
})

async function query(text, params = []) {
  const result = await pool.query(text, params)
  return result
}

async function wake() {
  try {
    await pool.query('SELECT 1')
  } catch (e) {
    console.error('Wake query failed:', e.message)
  }
}

function genId() {
  return crypto.randomUUID()
}

module.exports = { query, genId, wake, pool }
