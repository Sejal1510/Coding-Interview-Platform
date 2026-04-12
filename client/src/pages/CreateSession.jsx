import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

export default function CreateSession() {
  const navigate = useNavigate()
  const [studentEmail, setStudentEmail] = useState('')
  const [questions, setQuestions] = useState([])
  const [selectedQuestion, setSelectedQuestion] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/questions')
      .then(res => setQuestions(res.data.questions))
      .catch(() => setError('Failed to load questions'))
  }, [])

  const createRoom = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await api.post('/sessions', {
        studentEmail: studentEmail.trim() || undefined,
        questionIds: selectedQuestion ? [selectedQuestion] : []
      })
      const roomCode = res.data.session.roomCode
      navigate(`/room/${roomCode}`)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create room')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Create a New Room</h1>
        <p style={styles.subtitle}>Start a new interview session</p>

        <div style={styles.field}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
             <label style={styles.label}>Select Question</label>
             <button style={styles.addQuestionBtn} onClick={() => navigate('/questions/new')}>
               + Add New Question
             </button>
          </div>
          <select
            style={styles.select}
            value={selectedQuestion}
            onChange={e => setSelectedQuestion(e.target.value)}
          >
            <option value="">-- Pick a question --</option>
            {questions.map(q => (
              <option key={q.id} value={q.id}>
                {q.title} ({q.difficulty})
              </option>
            ))}
          </select>
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Student Email (optional)</label>
          <input
            style={styles.input}
            placeholder="student@example.com"
            value={studentEmail}
            onChange={e => setStudentEmail(e.target.value)}
          />
          <p style={styles.hint}>Leave empty to create an open room</p>
        </div>

        {error && <p style={styles.error}>{error}</p>}

        <div style={styles.buttons}>
          <button style={styles.cancelBtn} onClick={() => navigate('/dashboard')}>
            Cancel
          </button>
          <button style={styles.createBtn} onClick={createRoom} disabled={loading}>
            {loading ? 'Creating...' : 'Create Room'}
          </button>
        </div>
      </div>
    </div>
  )
}

const styles = {
  container: { minHeight: '100vh', background: '#0f0f0f', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' },
  card: { background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '16px', padding: '2.5rem', width: '100%', maxWidth: '480px' },
  title: { fontSize: '1.8rem', fontWeight: '700', color: '#fff', margin: 0 },
  subtitle: { color: '#888', fontSize: '14px', marginTop: '8px', marginBottom: '2rem' },
  field: { marginBottom: '1.5rem' },
  label: { display: 'block', color: '#aaa', fontSize: '13px', marginBottom: '8px', fontWeight: '500' },
  select: { width: '100%', padding: '10px 14px', background: '#2a2a2a', border: '1px solid #3a3a3a', borderRadius: '8px', color: '#fff', fontSize: '15px', boxSizing: 'border-box' },
  input: { width: '100%', padding: '10px 14px', background: '#2a2a2a', border: '1px solid #3a3a3a', borderRadius: '8px', color: '#fff', fontSize: '15px', boxSizing: 'border-box' },
  hint: { color: '#555', fontSize: '12px', marginTop: '6px' },
  error: { color: '#f87171', fontSize: '13px', marginBottom: '1rem' },
  buttons: { display: 'flex', gap: '12px', justifyContent: 'flex-end' },
  cancelBtn: { padding: '10px 20px', background: 'transparent', border: '1px solid #3a3a3a', color: '#aaa', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' },
  createBtn: { padding: '10px 24px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' },
  addQuestionBtn: { background: 'transparent', border: '1px dashed #4f46e5', color: '#818cf8', padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' },
  }