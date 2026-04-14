const Y = require('yjs')
const { encodeStateAsUpdate, applyUpdate, encodeStateVector } = require('yjs')

const rooms = new Map()
const timers = new Map()

const getOrCreateRoom = (roomCode) => {
  if (!rooms.has(roomCode)) {
    rooms.set(roomCode, {
      doc: new Y.Doc(),
      awareness: new Map()
    })
  }
  return rooms.get(roomCode)
}

const setupCollabSockets = (io, socket) => {

  socket.on('join-room', ({ roomCode, user }) => {
    socket.join(roomCode)
    socket.roomCode = roomCode
    socket.userInfo = user

    const room = getOrCreateRoom(roomCode)

    // send current doc state to the newly joined user
    const stateUpdate = encodeStateAsUpdate(room.doc)
    socket.emit('yjs-sync', { update: Array.from(stateUpdate) })

    // send current awareness states
    const awarenessStates = Array.from(room.awareness.entries()).map(
      ([clientId, state]) => ({ clientId, state })
    )
    socket.emit('awareness-sync', { states: awarenessStates })

    // notify others
    socket.to(roomCode).emit('user-joined', { user })

    console.log(`${user?.name} joined room ${roomCode}`)
  })

  // receive a Yjs update from a client and broadcast to others
  socket.on('yjs-update', ({ roomCode, update }) => {
    const room = getOrCreateRoom(roomCode)
    const uint8Update = new Uint8Array(update)
    applyUpdate(room.doc, uint8Update)
    socket.to(roomCode).emit('yjs-update', { update })
  })

  // awareness = cursor positions, user info, selections
  socket.on('awareness-update', ({ roomCode, clientId, state }) => {
    const room = getOrCreateRoom(roomCode)
    if (state) {
      room.awareness.set(clientId, { ...state, user: socket.userInfo })
    } else {
      room.awareness.delete(clientId)
    }
    socket.to(roomCode).emit('awareness-update', { clientId, state: state ? { ...state, user: socket.userInfo } : null })
  })

  socket.on('language-change', ({ roomCode, language }) => {
    socket.to(roomCode).emit('language-update', { language })
  })

  //socket.on('run-code', async ({ roomCode, code, language, questionId }) => {
    socket.on('run-code', async ({ roomCode, code, language, questionId, role }) => {
    console.log('run-code received, questionId:', questionId)
    try {
      const { runCode } = require('../services/judge0')
      const prisma = require('../prisma/client')

      // fetch test cases for this question
      const testCases = questionId ? await prisma.testCase.findMany({
        where: { questionId }
      }) : []

      if (testCases.length === 0) {
        // no test cases, just run normally
        const result = await runCode(code, language)
        io.to(roomCode).emit('run-result', {
          output: result.output,
          status: result.status,
          testResults: []
        })
        return
      }

      // run code against each test case
      const testResults = []
      for (const tc of testCases) {
        console.log('Sending input to Judge0:', JSON.stringify(tc.input))
        const result = await runCode(code, language, tc.input)
        const actual = result.output?.trim()
        const expected = tc.expectedOutput?.trim()
        const passed = actual === expected
        testResults.push({
            input: (tc.isHidden && role === 'STUDENT') ? "Hidden" : tc.input,
            expectedOutput: (tc.isHidden && role === 'STUDENT') ? "Hidden" : expected,
            actualOutput: (tc.isHidden && role === 'STUDENT') ? "Hidden" : actual,
            passed,
            isHidden: tc.isHidden
          })
        // testResults.push({
        //   input: tc.isHidden ? "Hidden" : tc.input,
        //   expectedOutput: tc.isHidden ? "Hidden" : expected,
        //   actualOutput: tc.isHidden ? "Hidden" : actual,
        //   passed,
        //   isHidden: tc.isHidden
        // })


        // testResults.push({
        //   input: tc.input,
        //   expectedOutput: expected,
        //   actualOutput: actual,
        //   passed,
        //   isHidden: tc.isHidden
        // })
      }

      const allPassed = testResults.every(t => t.passed)
      io.to(roomCode).emit('run-result', {
        output: allPassed ? 'All test cases passed! 🎉' : 'Some test cases failed.',
        status: allPassed ? 'success' : 'error',
        testResults
      })

    } catch (err) {
      io.to(roomCode).emit('run-result', {
        output: `Server error: ${err.message}`,
        status: 'error',
        testResults: []
      })
    }
  })

  socket.on('submit-code', async ({ roomCode, code, language, questionId }) => {
  try {
    const { runCode } = require('../services/judge0')
    const prisma = require('../prisma/client')

    const testCases = questionId ? await prisma.testCase.findMany({
      where: { questionId }
    }) : []

    if (testCases.length === 0) {
      io.to(roomCode).emit('submit-result', {
        output: 'No test cases found.',
        status: 'error',
        testResults: [],
        score: 0,
        total: 0
      })
      return
    }

    const testResults = []
    for (const tc of testCases) {
      const result = await runCode(code, language, tc.input)
      const actual = result.output?.trim()
      const expected = tc.expectedOutput?.trim()
      const passed = actual === expected
      testResults.push({
        input: tc.input,
        expectedOutput: expected,
        actualOutput: actual,
        passed,
        isHidden: tc.isHidden
      })
    }

    const passed = testResults.filter(t => t.passed).length
    const total = testResults.length
    const allPassed = passed === total

    // Save final submission to DB
    // (optional but recommended - you already have a submissions table)

    io.to(roomCode).emit('submit-result', {
      output: allPassed
        ? `✅ All ${total} test cases passed! Great job!`
        : `${passed}/${total} test cases passed.`,
      status: allPassed ? 'success' : 'error',
      testResults,
      score: passed,
      total
    })

  } catch (err) {
    io.to(roomCode).emit('submit-result', {
      output: `Server error: ${err.message}`,
      status: 'error',
      testResults: [],
      score: 0,
      total: 0
    })
  }
})

  socket.on('timer-start', ({ roomCode, duration }) => {
    // clear any existing timer for this room
    if (timers.has(roomCode)) {
      clearInterval(timers.get(roomCode).interval)
    }

    const endsAt = Date.now() + duration * 1000
    let remaining = duration

    // broadcast immediately so both users see it start
    io.to(roomCode).emit('timer-update', { remaining, running: true })

    const interval = setInterval(() => {
      remaining = Math.max(0, Math.round((endsAt - Date.now()) / 1000))
      io.to(roomCode).emit('timer-update', { remaining, running: remaining > 0 })

      if (remaining <= 0) {
        clearInterval(interval)
        timers.delete(roomCode)
        io.to(roomCode).emit('timer-done', {})
      }
    }, 1000)

    timers.set(roomCode, { interval, endsAt, duration })
  })

  socket.on('timer-stop', ({ roomCode }) => {
    if (timers.has(roomCode)) {
      clearInterval(timers.get(roomCode).interval)
      timers.delete(roomCode)
    }
    io.to(roomCode).emit('timer-update', { remaining: 0, running: false })
  })

  socket.on('timer-request', ({ roomCode }) => {
    // when someone joins mid-session, send them the current timer state
    if (timers.has(roomCode)) {
      const { endsAt, duration } = timers.get(roomCode)
      const remaining = Math.max(0, Math.round((endsAt - Date.now()) / 1000))
      socket.emit('timer-update', { remaining, running: remaining > 0 })
    }
  })

  socket.on('disconnect', () => {
    const { roomCode, userInfo } = socket
    if (roomCode) {
      const room = rooms.get(roomCode)
      if (room) {
        socket.to(roomCode).emit('user-left', { user: userInfo })
      }
    }
    console.log('Client disconnected:', socket.id)
  })
}

module.exports = { setupCollabSockets }