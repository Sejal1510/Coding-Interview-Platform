import { useState, useEffect } from 'react'

const PRESETS = [
  { label: '15 min', value: 900 },
  { label: '20 min', value: 1200 },
  { label: '30 min', value: 1800 },
  { label: '45 min', value: 2700 },
  { label: '60 min', value: 3600 }
]

const formatTime = (seconds) => {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

export default function Timer({ socket, roomCode, isInterviewer }) {
  const [remaining, setRemaining] = useState(0)
  const [running, setRunning] = useState(false)
  const [selected, setSelected] = useState(1800)
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (!socket) return

    // request current timer state in case we joined mid-session
    socket.emit('timer-request', { roomCode })

    socket.on('timer-update', ({ remaining: r, running: run }) => {
      setRemaining(r)
      setRunning(run)
      setDone(false)
    })

    socket.on('timer-done', () => {
      setRemaining(0)
      setRunning(false)
      setDone(true)
    })

    return () => {
      socket.off('timer-update')
      socket.off('timer-done')
    }
  }, [socket, roomCode])

  const handleStart = () => {
    socket.emit('timer-start', { roomCode, duration: selected })
    setDone(false)
  }

  const handleStop = () => {
    socket.emit('timer-stop', { roomCode })
  }

  const isWarning = remaining <= 300 && remaining > 0  // last 5 mins
  const isCritical = remaining <= 60 && remaining > 0  // last 1 min

  const timerColor = isCritical
    ? '#f87171'
    : isWarning
    ? '#fb923c'
    : '#e2e8f0'

  return (
    <div style={styles.container}>
      <div style={{ ...styles.timeDisplay, color: timerColor }}>
        {formatTime(remaining)}
      </div>

      {done && (
        <div style={styles.doneLabel}>Time is up!</div>
      )}

      {isInterviewer && (
        <div style={styles.controls}>
          <select
            style={styles.select}
            value={selected}
            onChange={e => setSelected(Number(e.target.value))}
            disabled={running}
          >
            {PRESETS.map(p => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>

          {!running ? (
            <button style={styles.startBtn} onClick={handleStart}>
              Start
            </button>
          ) : (
            <button style={styles.stopBtn} onClick={handleStop}>
              Stop
            </button>
          )}
        </div>
      )}
    </div>
  )
}

const styles = {
  container: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' },
  timeDisplay: { fontSize: '22px', fontWeight: '700', fontVariantNumeric: 'tabular-nums', letterSpacing: '2px', transition: 'color 0.3s' },
  doneLabel: { fontSize: '12px', color: '#f87171', fontWeight: '600' },
  controls: { display: 'flex', gap: '6px', alignItems: 'center' },
  select: { background: '#2a2a2a', color: '#fff', border: '1px solid #3a3a3a', padding: '4px 8px', borderRadius: '6px', fontSize: '12px' },
  startBtn: { background: '#4f46e5', color: '#fff', border: 'none', padding: '4px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' },
  stopBtn: { background: '#7f1d1d', color: '#fff', border: 'none', padding: '4px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }
}