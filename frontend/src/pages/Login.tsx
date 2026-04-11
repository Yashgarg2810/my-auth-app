import { useState } from 'react'
import { loginUser } from '../api'
import { useNavigate, Link } from 'react-router-dom'

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async () => {
    try {
      const res = await loginUser(form)
      localStorage.setItem('token', res.data.token)
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Something went wrong')
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="bg-gray-900 p-8 rounded-2xl shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold text-white mb-6 text-center">Welcome Back</h2>
        {error && <p className="text-red-400 text-sm mb-4 text-center">{error}</p>}
        <input
          className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg mb-4 outline-none"
          placeholder="Email"
          value={form.email}
          onChange={e => setForm({ ...form, email: e.target.value })}
        />
        <input
          className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg mb-6 outline-none"
          placeholder="Password"
          type="password"
          value={form.password}
          onChange={e => setForm({ ...form, password: e.target.value })}
        />
        <button
          onClick={handleSubmit}
          className="w-full bg-violet-600 hover:bg-violet-700 text-white py-3 rounded-lg font-semibold transition"
        >
          Login
        </button>
        <p className="text-gray-400 text-sm text-center mt-4">
          Don't have an account? <Link to="/register" className="text-violet-400 hover:underline">Register</Link>
        </p>
      </div>
    </div>
  )
}