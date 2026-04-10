const express = require('express')
const router = express.Router()
const prisma = require('../prisma/client')
const { authGuard, roleGuard } = require('../middleware/authGuard')
const crypto = require('crypto')

// helper to generate a short unique room code like "XK93PL"
const generateRoomCode = () => {
  return crypto.randomBytes(3).toString('hex').toUpperCase()
}

// POST /api/sessions — interviewer creates a session
router.post('/', authGuard, roleGuard('INTERVIEWER'), async (req, res) => {
  try {
    const { studentEmail, questionIds, scheduledAt } = req.body

    // find student by email if provided
    let studentId = null
    if (studentEmail) {
      const student = await prisma.user.findUnique({
        where: { email: studentEmail }
      })
      if (!student) return res.status(404).json({ error: 'Student not found' })
      if (student.role !== 'STUDENT') {
        return res.status(400).json({ error: 'That user is not a student' })
      }
      studentId = student.id
    }

    // generate unique room code
    let roomCode
    let exists = true
    while (exists) {
      roomCode = generateRoomCode()
      const existing = await prisma.session.findUnique({ where: { roomCode } })
      exists = !!existing
    }

    // create session
    const session = await prisma.session.create({
      data: {
        roomCode,
        interviewerId: req.user.userId,
        studentId,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        sessionQuestions: {
          create: (questionIds || []).map((qId, index) => ({
            questionId: qId,
            orderIndex: index
          }))
        },
        state: {
          create: {
            language: 'javascript'
          }
        }
      },
      include: {
        sessionQuestions: {
          include: { question: true }
        },
        interviewer: { select: { id: true, name: true, email: true } },
        student: { select: { id: true, name: true, email: true } }
      }
    })

    res.status(201).json({ session })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/sessions — get all sessions for logged in user
router.get('/', authGuard, async (req, res) => {
  try {
    const { userId, role } = req.user

    const sessions = await prisma.session.findMany({
      where: role === 'INTERVIEWER'
        ? { interviewerId: userId }
        : { studentId: userId },
      include: {
        interviewer: { select: { id: true, name: true, email: true } },
        student: { select: { id: true, name: true, email: true } },
        sessionQuestions: {
          include: { question: { select: { id: true, title: true, difficulty: true } } },
          orderBy: { orderIndex: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    res.json({ sessions })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/sessions/room/:roomCode — join by room code
router.get('/room/:roomCode', authGuard, async (req, res) => {
  try {
    const session = await prisma.session.findUnique({
      where: { roomCode: req.params.roomCode },
      include: {
        interviewer: { select: { id: true, name: true, email: true } },
        student: { select: { id: true, name: true, email: true } },
        sessionQuestions: {
          include: { question: true },
          orderBy: { orderIndex: 'asc' }
        },
        state: true
      }
    })

    if (!session) return res.status(404).json({ error: 'Room not found' })

    res.json({ session })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/sessions/:id — get single session by id
router.get('/:id', authGuard, async (req, res) => {
  try {
    const session = await prisma.session.findUnique({
      where: { id: req.params.id },
      include: {
        interviewer: { select: { id: true, name: true, email: true } },
        student: { select: { id: true, name: true, email: true } },
        sessionQuestions: {
          include: { question: true },
          orderBy: { orderIndex: 'asc' }
        },
        state: true,
        submissions: {
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!session) return res.status(404).json({ error: 'Session not found' })

    res.json({ session })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// PATCH /api/sessions/:id/status — update session status
router.patch('/:id/status', authGuard, roleGuard('INTERVIEWER'), async (req, res) => {
  try {
    const { status } = req.body

    if (!['SCHEDULED', 'ACTIVE', 'COMPLETED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' })
    }

    const session = await prisma.session.update({
      where: { id: req.params.id },
      data: { status }
    })

    res.json({ session })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

module.exports = router