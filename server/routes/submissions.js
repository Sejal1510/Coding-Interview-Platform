const express = require('express')
const router = express.Router()
const prisma = require('../prisma/client')
const { authGuard } = require('../middleware/authGuard')

// POST /api/submissions — save a code submission
router.post('/', authGuard, async (req, res) => {
  try {
    const { sessionId, code, language, output } = req.body

    const submission = await prisma.submission.create({
      data: {
        sessionId,
        userId: req.user.userId,
        code,
        language,
        output
      }
    })

    res.status(201).json({ submission })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/submissions/session/:sessionId — get all submissions for a session
router.get('/session/:sessionId', authGuard, async (req, res) => {
  try {
    const submissions = await prisma.submission.findMany({
      where: { sessionId: req.params.sessionId },
      include: {
        user: { select: { id: true, name: true, role: true } }
      },
      orderBy: { createdAt: 'desc' }
    })

    res.json({ submissions })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

module.exports = router