import { useEffect, useState } from 'react'
import { getProfile } from '../api'
import { useNavigate } from 'react-router-dom'

export default function Dashboard() {
  const [user, setUser] = useState<any>(null)
  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/login')
      return
    }

    getProfile(token)
      .then(res => setUser(res.data.user))
      .catch(() => navigate('/login'))
  }, [navigate])

  const logout = () => {
    localStorage.removeItem('token')
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="bg-gray-900 p-8 rounded-2xl shadow-lg w-full max-w-md text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Dashboard</h2>
        {user ? (
          <>
            <p className="text-gray-400 mb-1">Welcome, <span className="text-violet-400 font-semibold">{user.name}</span></p>
            <p className="text-gray-500 text-sm mb-6">{user.email}</p>
          </>
        ) : (
          <p className="text-gray-400 mb-6">Loading...</p>
        )}
        <button
          onClick={logout}
          className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition"
        >
          Logout
        </button>
      </div>
    </div>
  )
}