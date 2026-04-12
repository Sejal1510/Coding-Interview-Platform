import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

const STATUS_COLORS = {
  SCHEDULED: { bg: '#1e3a5f', text: '#7dd3fc' },
  ACTIVE: { bg: '#14532d', text: '#86efac' },
  COMPLETED: { bg: '#2d1b69', text: '#c4b5fd' }
}

export default function Dashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [sessions, setSessions] = useState([])
  const [roomCode, setRoomCode] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/sessions')
      .then(res => setSessions(res.data.sessions))
      .finally(() => setLoading(false))
  }, [])

  const joinRoom = () => {
    if (roomCode.trim()) navigate(`/room/${roomCode.trim().toUpperCase()}`)
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Interview Platform</h1>
          <p style={styles.subtitle}>Welcome back, {user?.name}</p>
        </div>
        <div style={styles.userInfo}>
          {user?.role === 'INTERVIEWER' && (
            <button style={styles.createBtn} onClick={() => navigate('/sessions/new')}>
              + Create room
            </button>
          )}
          <span style={styles.roleBadge}>{user?.role}</span>
          <button style={styles.logoutBtn} onClick={logout}>Logout</button>
        </div>
      </div>

      {/* Join room */}
      <div style={styles.joinCard}>
        <h2 style={styles.sectionTitle}>Join a room</h2>
        <div style={styles.joinRow}>
          <input
            style={styles.input}
            placeholder="Enter room code e.g. A3F9BC"
            value={roomCode}
            onChange={e => setRoomCode(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === 'Enter' && joinRoom()}
            maxLength={6}
          />
          <button style={styles.joinBtn} onClick={joinRoom}>
            Join Room
          </button>
        </div>
      </div>

      {/* Sessions */}
      <div style={styles.sessionsSection}>
        <h2 style={styles.sectionTitle}>
          {user?.role === 'INTERVIEWER' ? 'Your sessions' : 'Your interviews'}
        </h2>

        {loading ? (
          <p style={styles.empty}>Loading...</p>
        ) : sessions.length === 0 ? (
          <p style={styles.empty}>No sessions yet.</p>
        ) : (
          <div style={styles.grid}>
            {sessions.map(s => {
              const colors = STATUS_COLORS[s.status] || STATUS_COLORS.SCHEDULED
              const question = s.sessionQuestions?.[0]?.question
              const other = user?.role === 'INTERVIEWER' ? s.student : s.interviewer

              return (
                <div
                  key={s.id}
                  style={styles.card}
                  onClick={() => navigate(`/room/${s.roomCode}`)}
                >
                  <div style={styles.cardTop}>
                    <span style={styles.cardRoomCode}>{s.roomCode}</span>
                    <span style={{ ...styles.statusBadge, background: colors.bg, color: colors.text }}>
                      {s.status}
                    </span>
                  </div>

                  {question && (
                    <p style={styles.questionName}>{question.title}</p>
                  )}

                  {other && (
                    <p style={styles.otherUser}>
                      {user?.role === 'INTERVIEWER' ? 'Student' : 'Interviewer'}: {other.name}
                    </p>
                  )}

                  <p style={styles.dateText}>
                    {new Date(s.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric', month: 'short', year: 'numeric'
                    })}
                  </p>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

const styles = {
  container: { minHeight: '100vh', background: '#0f0f0f', color: '#fff', padding: '2rem', maxWidth: '1100px', margin: '0 auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' },
  title: { fontSize: '1.8rem', fontWeight: '700', margin: 0 },
  subtitle: { color: '#888', fontSize: '14px', marginTop: '4px' },
  userInfo: { display: 'flex', alignItems: 'center', gap: '12px' },
  roleBadge: { background: '#4f46e5', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' },
  logoutBtn: { background: 'transparent', border: '1px solid #3a3a3a', color: '#aaa', padding: '6px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' },
  joinCard: { background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '12px', padding: '1.5rem', marginBottom: '2rem' },
  sectionTitle: { fontSize: '1rem', color: '#aaa', marginBottom: '1rem', fontWeight: '500' },
  joinRow: { display: 'flex', gap: '12px' },
  input: { flex: 1, padding: '10px 14px', background: '#2a2a2a', border: '1px solid #3a3a3a', borderRadius: '8px', color: '#fff', fontSize: '15px', letterSpacing: '2px', fontWeight: '600' },
  joinBtn: { padding: '10px 28px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' },
  sessionsSection: { marginTop: '1rem' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' },
  card: { background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '12px', padding: '1.2rem', cursor: 'pointer', transition: 'border-color 0.2s' },
  cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' },
  cardRoomCode: { fontSize: '1.2rem', fontWeight: '700', letterSpacing: '3px' },
  statusBadge: { fontSize: '11px', padding: '3px 10px', borderRadius: '20px', fontWeight: '600' },
  questionName: { fontSize: '13px', color: '#e2e8f0', marginBottom: '6px', fontWeight: '500' },
  otherUser: { fontSize: '12px', color: '#666', marginBottom: '6px' },
  dateText: { fontSize: '12px', color: '#555', marginTop: '8px' },
  empty: { color: '#555', fontSize: '14px' },
  createBtn: { background: '#4f46e5', color: '#fff', border: 'none', padding: '8px 18px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' },
}