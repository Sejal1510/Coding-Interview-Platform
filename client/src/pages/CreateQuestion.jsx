import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

export default function CreateQuestion() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    title: '',
    description: '',
    difficulty: 'EASY',
    timeLimitSec: 1800
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!form.title || !form.description) {
      setError('Title and description are required')
      return
    }
    setLoading(true)
    try {
      await api.post('/questions', form)
      navigate('/sessions/new')
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create question')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h2 style={styles.title}>New question</h2>
          <button style={styles.back} onClick={() => navigate(-1)}>← Back</button>
        </div>

        {error && <p style={styles.error}>{error}</p>}

        <div style={styles.field}>
          <label style={styles.label}>Title</label>
          <input
            style={styles.input}
            placeholder="e.g. Two Sum"
            value={form.title}
            onChange={e => setForm({ ...form, title: e.target.value })}
          />
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Description</label>
          <textarea
            style={{ ...styles.input, height: '160px', resize: 'vertical' }}
            placeholder="Describe the problem clearly..."
            value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
          />
        </div>

        <div style={styles.row}>
          <div style={{ ...styles.field, flex: 1 }}>
            <label style={styles.label}>Difficulty</label>
            <select
              style={styles.input}
              value={form.difficulty}
              onChange={e => setForm({ ...form, difficulty: e.target.value })}
            >
              <option value="EASY">Easy</option>
              <option value="MEDIUM">Medium</option>
              <option value="HARD">Hard</option>
            </select>
          </div>

          <div style={{ ...styles.field, flex: 1 }}>
            <label style={styles.label}>Time limit</label>
            <select
              style={styles.input}
              value={form.timeLimitSec}
              onChange={e => setForm({ ...form, timeLimitSec: Number(e.target.value) })}
            >
              <option value={900}>15 minutes</option>
              <option value={1200}>20 minutes</option>
              <option value={1800}>30 minutes</option>
              <option value={2700}>45 minutes</option>
              <option value={3600}>60 minutes</option>
            </select>
          </div>
        </div>

        <button
          style={{ ...styles.btn, opacity: loading ? 0.7 : 1 }}
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Save question'}
        </button>
      </div>
    </div>
  )
}

const styles = {
  container: { minHeight: '100vh', background: '#0f0f0f', display: 'flex', justifyContent: 'center', padding: '2rem', color: '#fff' },
  card: { background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '16px', padding: '2rem', width: '100%', maxWidth: '560px', height: 'fit-content' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' },
  title: { fontSize: '1.4rem', fontWeight: '600', margin: 0 },
  back: { background: 'transparent', border: 'none', color: '#888', cursor: 'pointer', fontSize: '14px' },
  error: { color: '#f87171', fontSize: '14px', marginBottom: '1rem' },
  field: { marginBottom: '1.2rem' },
  label: { display: 'block', fontSize: '13px', color: '#aaa', marginBottom: '6px' },
  input: { width: '100%', padding: '10px 12px', background: '#2a2a2a', border: '1px solid #3a3a3a', borderRadius: '8px', color: '#fff', fontSize: '14px', boxSizing: 'border-box' },
  row: { display: 'flex', gap: '12px' },
  btn: { width: '100%', padding: '12px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '15px', cursor: 'pointer', fontWeight: '600' }
}