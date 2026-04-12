import { useEffect, useState } from 'react'
import { getDashboard, getTopics, getPatterns, solveProblem } from '../api'
import { useNavigate } from 'react-router-dom'

export default function Dashboard() {
  const [user, setUser] = useState<any>(null)
  const [stats, setStats] = useState<any>(null)
  const [topics, setTopics] = useState<any[]>([])
  const [selectedTopic, setSelectedTopic] = useState<any>(null)
  const [patterns, setPatterns] = useState<any[]>([])
  const [weeklyStreak, setWeeklyStreak] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  const token = localStorage.getItem('token') || ''

  useEffect(() => {
    if (!token) return navigate('/login')
    loadDashboard()
  }, [])

  const loadDashboard = async () => {
    try {
      const [dashRes, topicsRes] = await Promise.all([
        getDashboard(token),
        getTopics(token)
      ])
      setUser(dashRes.data.user)
      setStats(dashRes.data.stats)
      setWeeklyStreak(dashRes.data.weekly_streak)
      setTopics(topicsRes.data.topics)

      const activeTopic = topicsRes.data.topics.find((t: any) =>
        t.solved_problems < t.total_problems || t.order_index === 1
      )
      if (activeTopic) loadPatterns(activeTopic)
    } catch {
      navigate('/login')
    } finally {
      setLoading(false)
    }
  }

  const loadPatterns = async (topic: any) => {
    setSelectedTopic(topic)
    const res = await getPatterns(token, topic.id)
    setPatterns(res.data.patterns)
  }

  const handleSolve = async (problemId: number) => {
    await solveProblem(token, problemId)

    // update stats without resetting selected topic
    try {
      const [dashRes, topicsRes] = await Promise.all([
        getDashboard(token),
        getTopics(token)
      ])
      setUser(dashRes.data.user)
      setStats(dashRes.data.stats)
      setWeeklyStreak(dashRes.data.weekly_streak)
      setTopics(topicsRes.data.topics)
    } catch {}

    // reload patterns for current topic only
    if (selectedTopic) loadPatterns(selectedTopic)
  }

  const logout = () => {
    localStorage.removeItem('token')
    navigate('/login')
  }

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <p className="text-gray-400">Loading your roadmap...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Topbar */}
      <div className="border-b border-gray-800 px-6 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-semibold">DSA Roadmap</h1>
          <p className="text-gray-400 text-sm">Welcome back, {user?.name}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-medium text-violet-400">{user?.streak || 0} day streak</p>
            <p className="text-xs text-gray-500">Placement in {user?.placement_months || 6} months</p>
          </div>
          <button onClick={logout} className="text-sm text-gray-400 hover:text-white transition">
            Logout
          </button>
        </div>
      </div>

      <div className="p-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-900 rounded-xl p-4">
            <p className="text-gray-400 text-xs mb-1">Problems solved</p>
            <p className="text-2xl font-semibold">{stats?.total_solved || 0}</p>
            <p className="text-gray-500 text-xs mt-1">of 150 curated</p>
          </div>
          <div className="bg-gray-900 rounded-xl p-4">
            <p className="text-gray-400 text-xs mb-1">Topics completed</p>
            <p className="text-2xl font-semibold">{stats?.topics_completed || 0}/16</p>
          </div>
          <div className="bg-gray-900 rounded-xl p-4">
            <p className="text-gray-400 text-xs mb-1">Patterns learned</p>
            <p className="text-2xl font-semibold">{stats?.patterns_learned || 0}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Topics list */}
          <div className="bg-gray-900 rounded-xl p-4">
            <h2 className="text-sm font-medium mb-4">Roadmap</h2>
            <div className="space-y-2">
              {topics.map((topic) => {
                const isDone = topic.total_problems > 0 && topic.solved_problems >= topic.total_problems
                const isActive = selectedTopic?.id === topic.id
                const progress = topic.total_problems > 0
                  ? (topic.solved_problems / topic.total_problems) * 100 : 0

                return (
                  <div
                    key={topic.id}
                    onClick={() => loadPatterns(topic)}
                    className={`p-3 rounded-lg cursor-pointer transition ${isActive ? 'bg-violet-900/40 border border-violet-700' : 'hover:bg-gray-800'}`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm">{topic.icon} {topic.title}</span>
                      {isDone ? (
                        <span className="text-xs text-green-400">Done</span>
                      ) : topic.solved_problems > 0 ? (
                        <span className="text-xs text-violet-400">Active</span>
                      ) : (
                        <span className="text-xs text-gray-600">{topic.order_index}</span>
                      )}
                    </div>
                    <div className="h-1 bg-gray-700 rounded-full">
                      <div
                        className="h-1 rounded-full transition-all"
                        style={{
                          width: `${progress}%`,
                          background: isDone ? '#22c55e' : '#7c3aed'
                        }}
                      />
                    </div>
                    {topic.total_problems > 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        {topic.solved_problems}/{topic.total_problems} problems
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Patterns & Problems */}
          <div className="col-span-2 space-y-4">
            {/* Weekly streak */}
            <div className="bg-gray-900 rounded-xl p-4">
              <h2 className="text-sm font-medium mb-3">Weekly activity</h2>
              <div className="flex gap-2">
                {days.map((day, i) => {
                  const today = new Date().getDay()
                  const dayIndex = (i + 1) % 7
                  const streakDay = weeklyStreak.find((s: any) => {
                    const d = new Date(s.date).getDay()
                    return d === dayIndex
                  })
                  const isToday = dayIndex === today
                  return (
                    <div key={day} className="flex-1 text-center">
                      <div className={`h-8 rounded flex items-center justify-center text-xs font-medium
                        ${isToday ? 'bg-violet-600 text-white' :
                          streakDay ? 'bg-violet-900 text-violet-300' :
                          'bg-gray-800 text-gray-600'}`}>
                        {day[0]}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Patterns */}
            {selectedTopic && (
              <div className="bg-gray-900 rounded-xl p-4">
                <h2 className="text-sm font-medium mb-4">
                  {selectedTopic.icon} {selectedTopic.title} — Patterns
                </h2>
                {patterns.length === 0 ? (
                  <p className="text-gray-500 text-sm">No patterns added yet for this topic.</p>
                ) : (
                  <div className="space-y-4">
                    {patterns.map((pattern) => (
                      <div key={pattern.id} className="border border-gray-800 rounded-lg p-4">
                        <h3 className="font-medium text-violet-400 mb-1">{pattern.title}</h3>
                        <p className="text-gray-400 text-xs mb-2">{pattern.explanation}</p>

                        {pattern.when_to_use && (
                          <p className="text-xs text-gray-500 mb-3">
                            <span className="text-gray-400">When to use: </span>
                            {pattern.when_to_use}
                          </p>
                        )}

                        {pattern.key_methods && (
                          <div className="bg-gray-800 rounded p-2 mb-3">
                            <p className="text-xs text-gray-400 mb-1">Key methods</p>
                            <code className="text-xs text-green-400">{pattern.key_methods}</code>
                          </div>
                        )}

                        <div className="space-y-2">
                          {pattern.problems?.map((problem: any) => (
                            <div key={problem.id} className="flex items-center gap-3 py-2 border-t border-gray-800">
                              <input
                                type="checkbox"
                                checked={problem.solved}
                                onChange={() => !problem.solved && handleSolve(problem.id)}
                                className="accent-violet-500"
                              />
                              <a
                                href={problem.url}
                                target="_blank"
                                rel="noreferrer"
                                className="flex-1 text-sm hover:text-violet-400 transition"
                              >
                                {problem.title}
                              </a>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${
                                problem.difficulty === 'Easy' ? 'bg-green-900 text-green-400' :
                                problem.difficulty === 'Medium' ? 'bg-yellow-900 text-yellow-400' :
                                'bg-red-900 text-red-400'
                              }`}>
                                {problem.difficulty}
                              </span>
                              <span className="text-xs text-gray-600">{problem.platform}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}