import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

export default function Register() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'STUDENT' })
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const res = await api.post('/auth/register', form)
      login(res.data.token, res.data.user)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed')
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Create account</h2>
        {error && <p style={styles.error}>{error}</p>}
        <form onSubmit={handleSubmit}>
          <input
            style={styles.input}
            type="text"
            placeholder="Full name"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            required
          />
          <input
            style={styles.input}
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
            required
          />
          <input
            style={styles.input}
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })}
            required
          />
          <select
            style={styles.input}
            value={form.role}
            onChange={e => setForm({ ...form, role: e.target.value })}
          >
            <option value="STUDENT">Student</option>
            <option value="INTERVIEWER">Interviewer</option>
          </select>
          <button style={styles.button} type="submit">Register</button>
        </form>
        <p style={styles.link}>
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  )
}

const styles = {
  container: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#0f0f0f' },
  card: { background: '#1a1a1a', padding: '2rem', borderRadius: '12px', width: '360px', border: '1px solid #2a2a2a' },
  title: { color: '#fff', marginBottom: '1.5rem', fontSize: '1.5rem' },
  input: { width: '100%', padding: '10px 12px', marginBottom: '12px', background: '#2a2a2a', border: '1px solid #3a3a3a', borderRadius: '8px', color: '#fff', fontSize: '14px', boxSizing: 'border-box' },
  button: { width: '100%', padding: '10px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '15px', cursor: 'pointer' },
  error: { color: '#f87171', marginBottom: '12px', fontSize: '14px' },
  link: { color: '#888', marginTop: '1rem', fontSize: '14px', textAlign: 'center' }
}