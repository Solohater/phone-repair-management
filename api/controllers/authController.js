const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const { query, genId } = require('../db')

const login = async (req, res) => {
    const { username, password } = req.body

    if (!username || !password) {
        return res.status(400).json({ message: 'All fields are required' })
    }

    const result = await query('SELECT id, username, password, roles, active FROM "User" WHERE username = $1', [username])
    const foundUser = result.rows[0]

    if (!foundUser || !foundUser.active) {
        return res.status(401).json({ message: 'Unauthorized' })
    }

    const match = await bcrypt.compare(password, foundUser.password)

    if (!match) return res.status(401).json({ message: 'Unauthorized' })

    const accessToken = jwt.sign(
        {
            "UserInfo": {
                "username": foundUser.username,
                "roles": JSON.parse(foundUser.roles)
            }
        },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: '15m' }
    )

    const refreshToken = jwt.sign(
        { "username": foundUser.username },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: '7d' }
    )

    const isProd = process.env.NODE_ENV === 'production'
    res.cookie('jwt', refreshToken, {
        httpOnly: true,
        secure: isProd,
        sameSite: 'Lax',
        maxAge: 7 * 24 * 60 * 60 * 1000
    })

    res.json({ accessToken })
}

const refresh = (req, res) => {
    const cookies = req.cookies

    if (!cookies?.jwt) return res.status(401).json({ message: 'Unauthorized' })

    const refreshToken = cookies.jwt

    jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET,
        async (err, decoded) => {
            if (err) return res.status(403).json({ message: 'Forbidden' })

            const result = await query('SELECT id, username, password, roles, active FROM "User" WHERE username = $1', [decoded.username])
            const foundUser = result.rows[0]

            if (!foundUser) return res.status(401).json({ message: 'Unauthorized' })

            const accessToken = jwt.sign(
                {
                    "UserInfo": {
                        "username": foundUser.username,
                        "roles": JSON.parse(foundUser.roles)
                    }
                },
                process.env.ACCESS_TOKEN_SECRET,
                { expiresIn: '15m' }
            )

            res.json({ accessToken })
        }
    )
}

const register = async (req, res) => {
    const { username, password } = req.body

    if (!username || !password) {
        return res.status(400).json({ message: 'All fields are required' })
    }

    const existing = await query('SELECT id FROM "User" WHERE username = $1', [username])
    if (existing.rows.length > 0) {
        return res.status(409).json({ message: 'Duplicate username' })
    }

    const count = await query('SELECT COUNT(*)::int AS cnt FROM "User"')
    const isFirst = count.rows[0].cnt === 0
    const roles = JSON.stringify(isFirst ? ['Admin'] : ['Employee'])

    const hashedPwd = await bcrypt.hash(password, 10)
    const id = genId()

    await query(
        'INSERT INTO "User" (id, username, password, roles, active) VALUES ($1, $2, $3, $4, $5)',
        [id, username, hashedPwd, roles, true]
    )

    res.status(201).json({ message: `User ${username} created with role ${isFirst ? 'Admin' : 'Employee'}` })
}

const logout = (req, res) => {
    const cookies = req.cookies
    if (!cookies?.jwt) return res.sendStatus(204)
    const isProd = process.env.NODE_ENV === 'production'
    res.clearCookie('jwt', { httpOnly: true, sameSite: 'Lax', secure: isProd })
    res.json({ message: 'Cookie cleared' })
}

module.exports = {
    register,
    login,
    refresh,
    logout
}
