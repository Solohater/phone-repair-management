require('dotenv').config()
require('express-async-errors')
const express = require('express')
const app = express()
const path = require('path')
const { logger, logEvents } = require('./middleware/logger')
const errorHandler = require('./middleware/errorHandler')
const cookieParser = require('cookie-parser')
const corsOptions = require('./config/corsOptions')
const cors = require('cors')
const { wake, query } = require('./db')
const PORT = process.env.PORT || 3500

console.log(process.env.NODE_ENV)

app.use(logger)
app.use(cors(corsOptions))
app.use(express.json())
app.use(cookieParser())

app.use('/', express.static(path.join(__dirname, 'public')))
app.use('/', require('./routes/root'))
app.use('/auth', require('./routes/authRoutes'))
app.use('/users', require('./routes/userRoutes'))
app.use('/notes', require('./routes/noteRoutes'))

app.all('*', (req, res) => {
    res.status(404)
    if (req.accepts('html')) {
        res.sendFile(path.join(__dirname, 'views', '404.html'))
    } else if (req.accepts('json')) {
        res.json({ message: '404 Not Found' })
    } else {
        res.type('txt').send('404 Not Found')
    }
})

app.use(errorHandler)

async function initSchema() {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS "User" (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        roles TEXT NOT NULL DEFAULT '["Employee"]',
        active BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMPTZ DEFAULT NOW()
      )
    `)
    await query(`
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
  } catch (e) {
    console.error('Schema init failed:', e.message)
  }
}

async function keepAlive() {
  try {
    await wake()
  } catch (e) {
    // retry
  }
}

app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`)
  await initSchema()
  keepAlive()
  setInterval(keepAlive, 15000)
})
