const bcrypt = require('bcrypt')
const { query, genId } = require('../db')

const getAllUsers = async (req, res) => {
    const result = await query('SELECT id, username, roles, active FROM "User" ORDER BY username')

    if (!result.rows?.length) {
        return res.status(400).json({ message: 'No users found' })
    }

    const users = result.rows.map(user => ({
        ...user,
        roles: JSON.parse(user.roles)
    }))

    res.json(users)
}

const createNewUser = async (req, res) => {
    const { username, password, roles } = req.body

    if (!username || !password) {
        return res.status(400).json({ message: 'All fields are required' })
    }

    const existing = await query('SELECT id FROM "User" WHERE username = $1', [username])

    if (existing.rows.length > 0) {
        return res.status(409).json({ message: 'Duplicate username' })
    }

    const hashedPwd = await bcrypt.hash(password, 10)
    const rolesStr = (!Array.isArray(roles) || !roles.length)
        ? JSON.stringify(["Employee"])
        : JSON.stringify(roles)
    const id = genId()

    const result = await query(
        'INSERT INTO "User" (id, username, password, roles) VALUES ($1, $2, $3, $4)',
        [id, username, hashedPwd, rolesStr]
    )

    if (result.command === 'INSERT') {
        res.status(201).json({ message: `New user ${username} created` })
    } else {
        res.status(400).json({ message: 'Invalid user data received' })
    }
}

const updateUser = async (req, res) => {
    const { id, username, roles, active, password } = req.body

    if (!id || !username || !Array.isArray(roles) || !roles.length || typeof active !== 'boolean') {
        return res.status(400).json({ message: 'All fields except password are required' })
    }

    const existing = await query('SELECT id FROM "User" WHERE id = $1', [id])
    if (!existing.rows.length) {
        return res.status(400).json({ message: 'User not found' })
    }

    const duplicate = await query('SELECT id FROM "User" WHERE username = $1 AND id != $2', [username, id])
    if (duplicate.rows.length > 0) {
        return res.status(409).json({ message: 'Duplicate username' })
    }

    let hashedPwd = null
    if (password) {
        hashedPwd = await bcrypt.hash(password, 10)
    }

    await query(
        'UPDATE "User" SET username = $1, roles = $2, active = $3' +
        (hashedPwd ? ', password = $4' : '') +
        ' WHERE id = $' + (hashedPwd ? '5' : '4'),
        hashedPwd
            ? [username, JSON.stringify(roles), active, hashedPwd, id]
            : [username, JSON.stringify(roles), active, id]
    )

    res.json({ message: `${username} updated` })
}

const deleteUser = async (req, res) => {
    const { id } = req.body

    if (!id) {
        return res.status(400).json({ message: 'User ID Required' })
    }

    const notes = await query('SELECT id FROM "Note" WHERE "userId" = $1', [id])
    if (notes.rows.length > 0) {
        return res.status(400).json({ message: 'User has assigned notes' })
    }

    const user = await query('SELECT id, username FROM "User" WHERE id = $1', [id])
    if (!user.rows.length) {
        return res.status(400).json({ message: 'User not found' })
    }

    await query('DELETE FROM "User" WHERE id = $1', [id])

    res.json(`Username ${user.rows[0].username} with ID ${id} deleted`)
}

module.exports = {
    getAllUsers,
    createNewUser,
    updateUser,
    deleteUser
}
