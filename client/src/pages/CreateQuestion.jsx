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
  const [testCases, setTestCases] = useState([
    { input: '', expectedOutput: '', isHidden: false },
    { input: '', expectedOutput: '', isHidden: false },
    { input: '', expectedOutput: '', isHidden: false }
  ])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const updateTestCase = (index, field, value) => {
    const updated = [...testCases]
    updated[index][field] = value
    setTestCases(updated)
  }

  const addTestCase = () => {
    setTestCases([...testCases, { input: '', expectedOutput: '', isHidden: false }])
  }

  const removeTestCase = (index) => {
    setTestCases(testCases.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    if (!form.title || !form.description) {
      setError('Title and description are required')
      return
    }
    setLoading(true)
    try {
      await api.post('/questions', { ...form, testCases })
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

        {/* Test Cases */}
        <div style={styles.field}>
          <label style={styles.label}>Test Cases</label>
          {testCases.map((tc, i) => (
            <div key={i} style={styles.testCaseBox}>
              <div style={styles.testCaseHeader}>
                <span style={styles.testCaseTitle}>Test Case {i + 1}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <label style={styles.hiddenLabel}>
                    <input
                      type="checkbox"
                      checked={tc.isHidden}
                      onChange={e => updateTestCase(i, 'isHidden', e.target.checked)}
                    />
                    {' '}Hidden
                  </label>
                  {testCases.length > 1 && (
                    <button style={styles.removeBtn} onClick={() => removeTestCase(i)}>
                      Remove
                    </button>
                  )}
                </div>
              </div>
              <div style={styles.testCaseFields}>
                <div style={{ flex: 1 }}>
                  <label style={styles.label}>Input (stdin)</label>
                  <textarea
                    style={styles.smallTextarea}
                    placeholder={"e.g.\n4\n2 7 11 15\n9"}
                    value={tc.input}
                    onChange={e => updateTestCase(i, 'input', e.target.value)}
                    rows={3}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={styles.label}>Expected Output</label>
                  <textarea
                    style={styles.smallTextarea}
                    placeholder="e.g. 0 1"
                    value={tc.expectedOutput}
                    onChange={e => updateTestCase(i, 'expectedOutput', e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
            </div>
          ))}
          <button style={styles.addBtn} onClick={addTestCase}>
            + Add Test Case
          </button>
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
  card: { background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '16px', padding: '2rem', width: '100%', maxWidth: '620px', height: 'fit-content' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' },
  title: { fontSize: '1.4rem', fontWeight: '600', margin: 0 },
  back: { background: 'transparent', border: 'none', color: '#888', cursor: 'pointer', fontSize: '14px' },
  error: { color: '#f87171', fontSize: '14px', marginBottom: '1rem' },
  field: { marginBottom: '1.2rem' },
  label: { display: 'block', fontSize: '13px', color: '#aaa', marginBottom: '6px' },
  input: { width: '100%', padding: '10px 12px', background: '#2a2a2a', border: '1px solid #3a3a3a', borderRadius: '8px', color: '#fff', fontSize: '14px', boxSizing: 'border-box' },
  row: { display: 'flex', gap: '12px' },
  btn: { width: '100%', padding: '12px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '15px', cursor: 'pointer', fontWeight: '600' },
  testCaseBox: { background: '#111', border: '1px solid #2a2a2a', borderRadius: '10px', padding: '1rem', marginBottom: '12px' },
  testCaseHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' },
  testCaseTitle: { color: '#e2e8f0', fontWeight: '600', fontSize: '13px' },
  hiddenLabel: { color: '#888', fontSize: '12px', cursor: 'pointer' },
  removeBtn: { background: 'transparent', border: '1px solid #dc2626', color: '#f87171', padding: '3px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' },
  testCaseFields: { display: 'flex', gap: '12px' },
  smallTextarea: { width: '100%', padding: '8px 12px', background: '#1a1a1a', border: '1px solid #3a3a3a', borderRadius: '8px', color: '#fff', fontSize: '13px', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'monospace' },
  addBtn: { background: 'transparent', border: '1px dashed #3a3a3a', color: '#888', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', width: '100%', marginTop: '4px' },
}