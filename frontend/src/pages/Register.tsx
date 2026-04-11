import { useState } from 'react'
import { registerUser } from '../api'
import { useNavigate, Link } from 'react-router-dom'

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
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="bg-gray-900 p-8 rounded-2xl shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold text-white mb-6 text-center">Create Account</h2>
        {error && <p className="text-red-400 text-sm mb-4 text-center">{error}</p>}
        <input
          className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg mb-4 outline-none"
          placeholder="Full Name"
          value={form.name}
          onChange={e => setForm({ ...form, name: e.target.value })}
        />
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
          Register
        </button>
        <p className="text-gray-400 text-sm text-center mt-4">
          Already have an account? <Link to="/login" className="text-violet-400 hover:underline">Login</Link>
        </p>
      </div>
    </div>
  )
}