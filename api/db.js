const crypto = require('crypto')
const { spawnSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const connectionString = process.env.DATABASE_URL
const hostname = new URL(connectionString).hostname
const endpoint = `https://${hostname}/sql`
const tmpDir = '/tmp/neon-queries'

if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true })

function runQuery(sql, params = []) {
  const body = JSON.stringify({ query: sql, params })
  const tmpFile = path.join(tmpDir, `${Date.now()}_${Math.random().toString(36).slice(2)}.json`)
  fs.writeFileSync(tmpFile, body)
  try {
    const result = spawnSync('curl', [
      '-s', '--max-time', '25',
      '-H', 'Content-Type: application/json',
      '-H', `Neon-Connection-String: ${connectionString}`,
      '-d', `@${tmpFile}`,
      endpoint,
    ], { timeout: 30000, encoding: 'utf-8' })
    if (result.error) throw result.error
    if (result.status !== 0) {
      throw new Error(`curl exited with code ${result.status}: ${result.stderr}`)
    }
    return JSON.parse(result.stdout)
  } finally {
    try { fs.unlinkSync(tmpFile) } catch (e) { /* ignore */ }
  }
}

function wake() {
  try { runQuery('SELECT 1') } catch (e) { /* ignore */ }
}

function query(text, params = []) {
  const result = runQuery(text, params)
  if (result.message && !result.fields) {
    throw new Error(result.message)
  }
  return result
}

function genId() {
  return crypto.randomUUID()
}

module.exports = { query, genId, wake }
