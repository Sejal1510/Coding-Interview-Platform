import { useEffect, useRef, useState } from 'react'
import * as Y from 'yjs'

const COLORS = [
  '#f87171', '#fb923c', '#facc15', '#4ade80',
  '#34d399', '#38bdf8', '#818cf8', '#e879f9'
]

const getRandomColor = () => COLORS[Math.floor(Math.random() * COLORS.length)]

export const useCollab = (socket, roomCode, user) => {
  const ydocRef = useRef(null)
  const ytextRef = useRef(null)
  const [awareness, setAwareness] = useState([])
  const clientId = useRef(Math.random().toString(36).slice(2))
  const colorRef = useRef(getRandomColor())

  useEffect(() => {
    if (!socket || !roomCode || !user) return

    // create Yjs doc and shared text
    const ydoc = new Y.Doc()
    const ytext = ydoc.getText('monaco')
    ydocRef.current = ydoc
    ytextRef.current = ytext

    // when local doc changes, send update to server
    ydoc.on('update', (update, origin) => {
      if (origin === 'remote') return
      socket.emit('yjs-update', {
        roomCode,
        update: Array.from(update)
      })
    })

    // receive full doc state on join
    socket.on('yjs-sync', ({ update }) => {
      Y.applyUpdate(ydoc, new Uint8Array(update), 'remote')
    })

    // receive incremental updates from others
    socket.on('yjs-update', ({ update }) => {
      Y.applyUpdate(ydoc, new Uint8Array(update), 'remote')
    })

    // receive all current awareness states on join
    socket.on('awareness-sync', ({ states }) => {
      setAwareness(states.map(s => s.state).filter(Boolean))
    })

    // receive awareness updates (cursor moves, user joins/leaves)
    socket.on('awareness-update', ({ clientId: cId, state }) => {
      setAwareness(prev => {
        const filtered = prev.filter(s => s.clientId !== cId)
        if (state) return [...filtered, { ...state, clientId: cId }]
        return filtered
      })
    })

    // broadcast our own awareness (cursor position + user info)
    const broadcastAwareness = (extra = {}) => {
      socket.emit('awareness-update', {
        roomCode,
        clientId: clientId.current,
        state: {
          clientId: clientId.current,
          user: { name: user.name, color: colorRef.current },
          ...extra
        }
      })
    }

    broadcastAwareness()

    return () => {
      // tell others we left
      socket.emit('awareness-update', {
        roomCode,
        clientId: clientId.current,
        state: null
      })
      socket.off('yjs-sync')
      socket.off('yjs-update')
      socket.off('awareness-sync')
      socket.off('awareness-update')
      ydoc.destroy()
    }
  }, [socket, roomCode, user])

  return {
    ydoc: ydocRef,
    ytext: ytextRef,
    awareness,
    clientId: clientId.current,
    color: colorRef.current
  }
}