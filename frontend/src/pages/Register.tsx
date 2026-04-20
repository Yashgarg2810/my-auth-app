import { useState } from 'react'
import { registerUser } from '../api'
import { useNavigate, Link } from 'react-router-dom'

const s: Record<string, React.CSSProperties> = {
  root: {
    minHeight: '100vh',
    background: '#fbf8f1',
    backgroundImage: "url('https://www.transparenttextures.com/patterns/paper-fibers.png')",
    fontFamily: "'Patrick Hand', 'Segoe UI', sans-serif",
    color: '#2c2c2c',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px'
  },
  card: {
    background: '#fffdf6',
    border: '2px solid #ece0b6',
    borderRadius: '14px',
    padding: '40px 30px',
    width: '100%',
    maxWidth: '400px',
    boxShadow: '4px 4px 0px #e5d5a0'
  },
  title: {
    fontSize: '32px',
    fontWeight: 700,
    color: '#2c4a7a',
    textAlign: 'center',
    margin: '0 0 24px 0'
  },
  input: {
    width: '100%',
    background: '#fffaf0',
    border: '2px dashed #d2c59d',
    color: '#444',
    padding: '12px 16px',
    borderRadius: '10px',
    marginBottom: '16px',
    outline: 'none',
    fontSize: '18px',
    fontFamily: 'inherit',
    boxSizing: 'border-box'
  },
  button: {
    width: '100%',
    background: '#ff8c42',
    color: '#fff',
    border: '2px solid #e67e22',
    padding: '12px',
    borderRadius: '10px',
    fontSize: '20px',
    fontWeight: 700,
    cursor: 'pointer',
    marginTop: '10px',
    boxShadow: '2px 2px 0px #e67e22',
    fontFamily: 'inherit'
  },
  linkText: {
    fontSize: '16px',
    color: '#777',
    textAlign: 'center',
    marginTop: '20px',
    margin: '20px 0 0 0'
  },
  link: {
    color: '#2c4a7a',
    fontWeight: 700,
    textDecoration: 'underline'
  },
  error: {
    color: '#721c24',
    background: '#f8d7da',
    border: '2px dashed #f5c6cb',
    padding: '10px',
    borderRadius: '8px',
    fontSize: '15px',
    textAlign: 'center',
    marginBottom: '16px',
    fontWeight: 600
  }
}

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async () => {
    try {
      await registerUser(form)
      navigate('/login')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Something went wrong')
    }
  }

  return (
    <div style={s.root}>
      <form style={s.card} onSubmit={e => { e.preventDefault(); handleSubmit(); }}>
        <h2 style={s.title}>Create Account</h2>
        {error && <p style={s.error}>{error}</p>}
        <input
          style={s.input}
          placeholder="Full Name"
          type="text"
          name="name"
          autoComplete="name"
          value={form.name}
          onChange={e => setForm({ ...form, name: e.target.value })}
        />
        <input
          style={s.input}
          placeholder="Email"
          type="email"
          name="email"
          autoComplete="email"
          value={form.email}
          onChange={e => setForm({ ...form, email: e.target.value })}
        />
        <input
          style={s.input}
          placeholder="Password"
          type="password"
          name="password"
          autoComplete="new-password"
          value={form.password}
          onChange={e => setForm({ ...form, password: e.target.value })}
        />
        <button
          type="submit"
          style={s.button}
        >
          Register
        </button>
        <p style={s.linkText}>
          Already have an account? <Link to="/login" style={s.link}>Login</Link>
        </p>
      </form>
    </div>
  )
}