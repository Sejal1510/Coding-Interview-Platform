const express = require('express')
const router = express.Router()
const prisma = require('../prisma/client')
const { authGuard, roleGuard } = require('../middleware/authGuard')

// POST /api/questions — only interviewers can create questions
router.post('/', authGuard, roleGuard('INTERVIEWER'), async (req, res) => {
  try {
    const { title, description, difficulty, timeLimitSec } = req.body

    if (!title || !description || !difficulty) {
      return res.status(400).json({ error: 'title, description and difficulty are required' })
    }

    const question = await prisma.question.create({
      data: {
        title,
        description,
        difficulty,
        timeLimitSec: timeLimitSec || 1800,
        createdBy: req.user.userId
      }
    })

    res.status(201).json({ question })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/questions — get all questions (both roles can view)
router.get('/', authGuard, async (req, res) => {
  try {
    const questions = await prisma.question.findMany({
      include: {
        creator: {
          select: { id: true, name: true }
        }
      },
      orderBy: { title: 'asc' }
    })

    res.json({ questions })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/questions/:id — get single question
router.get('/:id', authGuard, async (req, res) => {
  try {
    const question = await prisma.question.findUnique({
      where: { id: req.params.id },
      include: {
        creator: { select: { id: true, name: true } }
      }
    })

    if (!question) return res.status(404).json({ error: 'Question not found' })

    res.json({ question })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// PUT /api/questions/:id — update question (interviewer only)
router.put('/:id', authGuard, roleGuard('INTERVIEWER'), async (req, res) => {
  try {
    const { title, description, difficulty, timeLimitSec } = req.body

    const question = await prisma.question.update({
      where: { id: req.params.id },
      data: { title, description, difficulty, timeLimitSec }
    })

    res.json({ question })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// DELETE /api/questions/:id — delete question (interviewer only)
router.delete('/:id', authGuard, roleGuard('INTERVIEWER'), async (req, res) => {
  try {
    await prisma.question.delete({ where: { id: req.params.id } })
    res.json({ message: 'Question deleted' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

module.exports = router