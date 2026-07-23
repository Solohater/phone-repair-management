const { query, genId } = require('../db')

const getAllNotes = async (req, res) => {
    const result = await query(
        'SELECT n.id, n.ticket, n.title, n.text, n.comment, n.status, n."userId", n."createdAt", n."updatedAt", u.username ' +
        'FROM "Note" n JOIN "User" u ON n."userId" = u.id ORDER BY n."createdAt" DESC'
    )

    if (!result.rows?.length) {
        return res.json([])
    }

    const notes = result.rows.map(note => ({
        ...note,
        user: note.userId,
    }))

    res.json(notes)
}

const createNewNote = async (req, res) => {
    const { user: userId, title, text, status } = req.body

    if (!userId || !title || !text) {
        return res.status(400).json({ message: 'All fields are required' })
    }

    const duplicate = await query('SELECT id FROM "Note" WHERE title = $1', [title])
    if (duplicate.rows.length > 0) {
        return res.status(409).json({ message: 'Duplicate note title' })
    }

    const id = genId()

    const result = await query(
        'INSERT INTO "Note" (id, title, text, status, "userId", "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, NOW(), NOW())',
        [id, title, text, status || 'new', userId]
    )

    if (result.command === 'INSERT') {
        return res.status(201).json({ message: 'New note created' })
    } else {
        return res.status(400).json({ message: 'Invalid note data received' })
    }
}

const updateNote = async (req, res) => {
    const { id, user: userId, title, text, status, comment } = req.body
    const { roles, user: username } = req

    if (!id) {
        return res.status(400).json({ message: 'Note ID is required' })
    }

    const isAdmin = roles.includes('Admin')
    const isManager = roles.includes('Manager')

    const existing = await query('SELECT n.id, n.title, n."userId", u.username FROM "Note" n JOIN "User" u ON n."userId" = u.id WHERE n.id = $1', [id])
    if (!existing.rows.length) {
        return res.status(400).json({ message: 'Note not found' })
    }

    const note = existing.rows[0]
    const isOwner = note.username === username

    const validStatuses = ['new', 'pending', 'in_progress', 'blocked', 'completed', 'needs_rework']

    // Comment-only update
    if (comment !== undefined && !title && !text && !userId && !status) {
        if (!isAdmin && !isManager && !isOwner) {
            return res.status(403).json({ message: 'Not authorized to comment on this task' })
        }
        await query(
            'UPDATE "Note" SET comment = $1, "updatedAt" = NOW() WHERE id = $2',
            [comment, id]
        )
        return res.json(`Comment updated on '${note.title}'`)
    }

    // Status-only update (for drag-and-drop)
    if (status && !title && !text && !userId && comment === undefined) {
        if (!isAdmin && !isManager && !isOwner) {
            return res.status(403).json({ message: 'Not authorized to change status' })
        }
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: 'Invalid status value' })
        }
        await query(
            'UPDATE "Note" SET status = $1, "updatedAt" = NOW() WHERE id = $2',
            [status, id]
        )
        return res.json(`Status updated on '${note.title}'`)
    }

    // Full update — only admin or manager
    if (!isAdmin && !isManager) {
        return res.status(403).json({ message: 'Not authorized to edit this task' })
    }

    if (!userId || !title || !text || !status) {
        return res.status(400).json({ message: 'All fields are required for full update' })
    }

    if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: 'Invalid status value' })
    }

    const duplicate = await query('SELECT id FROM "Note" WHERE title = $1 AND id != $2', [title, id])
    if (duplicate.rows.length > 0) {
        return res.status(409).json({ message: 'Duplicate note title' })
    }

    await query(
        'UPDATE "Note" SET title = $1, text = $2, status = $3, "userId" = $4, comment = $5, "updatedAt" = NOW() WHERE id = $6',
        [title, text, status, userId, comment || '', id]
    )

    res.json(`'${title}' updated`)
}

const deleteNote = async (req, res) => {
    const { id } = req.body

    if (!id) {
        return res.status(400).json({ message: 'Note ID required' })
    }

    const note = await query('SELECT id, title FROM "Note" WHERE id = $1', [id])
    if (!note.rows.length) {
        return res.status(400).json({ message: 'Note not found' })
    }

    await query('DELETE FROM "Note" WHERE id = $1', [id])

    const reply = `Note '${note.rows[0].title}' with ID ${id} deleted`

    res.json(reply)
}

module.exports = {
    getAllNotes,
    createNewNote,
    updateNote,
    deleteNote
}
