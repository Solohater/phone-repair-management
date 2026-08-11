const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5173',
    process.env.WEB_URL
].filter(Boolean)

module.exports = allowedOrigins
