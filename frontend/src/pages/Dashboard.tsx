import { useEffect, useState } from 'react'
import { getDashboard, getTopics, getPatterns, solveProblem } from '../api'
import { useNavigate } from 'react-router-dom'
 
const s: Record<string, React.CSSProperties> = {

root:{
minHeight:'100vh',
// background:'#fbf8f1',
// backgroundImage:`repeating-linear-gradient(
// 0deg,
// #fbf8f1,
// #fbf8f1 32px,
// #e6ecff 33px
// )`,
background:'#fbf8f1',
backgroundImage:"url('https://www.transparenttextures.com/patterns/paper-fibers.png')",
fontFamily:"'Patrick Hand','Segoe UI',sans-serif",
color:'#2c2c2c'
},

topbar:{
display:'flex',
justifyContent:'space-between',
alignItems:'center',
padding:'20px 34px',
borderBottom:'2px dashed #e2d7b8'
},

logo:{
fontSize:'30px',
fontWeight:700,
color:'#2c4a7a'
},

sub:{
fontSize:'17px',
color:'#6d6d6d'
},

topRight:{
display:'flex',
alignItems:'center',
gap:'22px'
},

streakLabel:{
fontSize:'16px',
fontWeight:600,
color:'#ff8c42'
},

placementLabel:{
fontSize:'15px',
color:'#777'
},

avatar:{
width:'44px',
height:'44px',
borderRadius:'50%',
background:'#ffe6a7',
display:'flex',
alignItems:'center',
justifyContent:'center',
fontSize:'16px',
fontWeight:700,
color:'#444'
},

logoutBtn:{
fontSize:'15px',
background:'#ffd6e0',
border:'none',
padding:'8px 14px',
borderRadius:'8px',
cursor:'pointer'
},

body:{
padding:'34px'
},

statsRow:{
display:'grid',
gridTemplateColumns:'repeat(4,1fr)',
gap:'20px',
marginBottom:'26px'
},

statCard:{
background:'#fffaf0',
border:'2px solid #f2e6c8',
borderRadius:'14px',
padding:'20px',
boxShadow:'3px 3px 0px #e5d5a0'
},

statLabel:{
fontSize:'15px',
color:'#777',
marginBottom:'6px'
},

statValue:{
fontSize:'32px',
fontWeight:700,
color:'#2c4a7a'
},

statSub:{
fontSize:'14px',
color:'#8a8a8a'
},

mainGrid:{
display:'grid',
gridTemplateColumns:'320px 1fr',
gap:'20px',
marginBottom:'20px'
},

panel:{
background:'#fffdf6',
border:'2px solid #ece0b6',
borderRadius:'14px',
padding:'22px'
},

panelTitle:{
fontSize:'22px',
fontWeight:700,
marginBottom:'16px',
color:'#2c4a7a'
},

rightCol:{
display:'flex',
flexDirection:'column',
gap:'18px'
},

bottomGrid:{
display:'grid',
gridTemplateColumns:'1fr 1fr',
gap:'18px'
}

}

export default function Dashboard() {
  const [user, setUser] = useState<any>(null)
  const [stats, setStats] = useState<any>(null)
  const [topics, setTopics] = useState<any[]>([])
  const [selectedTopic, setSelectedTopic] = useState<any>(null)
  const [patterns, setPatterns] = useState<any[]>([])
  const [weeklyStreak, setWeeklyStreak] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isPatternsLoading, setIsPatternsLoading] = useState(false)
  const navigate = useNavigate()
  const token = localStorage.getItem('token') || ''
 
  const loadDashboard = async () => {
    try {
      const [dashRes, topicsRes] = await Promise.all([getDashboard(token), getTopics(token)])
      setUser(dashRes.data.user)
      setStats(dashRes.data.stats)
      setWeeklyStreak(dashRes.data.weekly_streak)
      setTopics(topicsRes.data.topics)
      const active = topicsRes.data.topics.find((t: any) => t.solved_problems < t.total_problems && t.total_problems > 0) || topicsRes.data.topics[0]
      if (active) await loadPatterns(active)
    } catch { navigate('/login') }
    finally { setLoading(false) }
  }
 
  useEffect(() => {
    if (!token) { navigate('/login'); return }
    void loadDashboard()
  }, [])
 
  const loadPatterns = async (topic: any) => {
    if (selectedTopic?.id !== topic.id) {
      setPatterns([]) // Clear immediately to give fast visual feedback
      setIsPatternsLoading(true)
    }
    try {
      setSelectedTopic(topic)
      const res = await getPatterns(token, topic.id)
      setPatterns(res.data.patterns)
    } finally {
      setIsPatternsLoading(false)
    }
  }
 
  const handleSolve = async (problemId: number) => {
    await solveProblem(token, problemId)
    try {
      const [dashRes, topicsRes] = await Promise.all([getDashboard(token), getTopics(token)])
      setUser(dashRes.data.user)
      setStats(dashRes.data.stats)
      setWeeklyStreak(dashRes.data.weekly_streak)
      setTopics(topicsRes.data.topics)
    } catch {}
    if (selectedTopic) await loadPatterns(selectedTopic)
  }
 
  const logout = () => { localStorage.removeItem('token'); navigate('/login') }
 
  const initials = user?.name?.split(' ').map((w: string) => w[0]).join('').slice(0, 2) || 'YG'
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
 
  const currentPattern = patterns.find((p: any) => {
    const solved = p.problems?.filter((pr: any) => pr.solved).length || 0
    return solved < (p.problems?.length || 0)
  })
 
  if (loading) return (
    <div style={{ ...s.root, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#525861', fontSize: '13px' }}>Loading...</p>
    </div>
  )
 
  return (
    <div style={s.root}>
      {/* Topbar */}
      <div style={s.topbar}>
        <div>
          <p style={s.logo}>DSA Roadmap</p>
          <p style={s.sub}>Welcome back, {user?.name} — keep going!</p>
        </div>
        <div style={s.topRight}>
          <div>
            <p style={s.streakLabel}>{user?.streak || 0} day streak</p>
            <p style={s.placementLabel}>Campus placement: {user?.placement_months || 6} months</p>
          </div>
          <div style={s.avatar}>{initials}</div>
          <button onClick={logout} style={s.logoutBtn}>Logout</button>
        </div>
      </div>
 
      <div style={s.body}>
        {/* Stats */}
        <div style={s.statsRow}>
          {[
            { label: 'Problems solved', value: stats?.total_solved || 0, sub: 'of 150 curated' },
            { label: 'Topics completed', value: `${stats?.topics_completed || 0}/16`, sub: 'keep going' },
            { label: 'Patterns learned', value: stats?.patterns_learned || 0, sub: 'Two pointer, Sliding window...' },
            { label: 'Current streak', value: `${user?.streak || 0}d`, sub: 'Best: keep going!' },
          ].map((stat, i) => (
            <div key={i} style={s.statCard}>
              <p style={s.statLabel}>{stat.label}</p>
              <p style={s.statValue}>{stat.value}</p>
              <p style={s.statSub}>{stat.sub}</p>
            </div>
          ))}
        </div>
 
        {/* Main grid */}
        <div style={s.mainGrid}>
          {/* Roadmap progress */}
          <div style={s.panel}>
            <p style={s.panelTitle}>Roadmap progress</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {topics.map((topic) => {
                const isDone = topic.total_problems > 0 && topic.solved_problems >= topic.total_problems
                const isActive = selectedTopic?.id === topic.id
                const hasProgress = topic.solved_problems > 0
                const pct = topic.total_problems > 0 ? (topic.solved_problems / topic.total_problems) * 100 : 0
                return (
                  <div key={topic.id} onClick={() => loadPatterns(topic)} style={{
                    display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px',
                    borderRadius: '10px', cursor: 'pointer',
                    background: isActive ? '#fffaf0' : '#fffdf6',
                    border: `2px solid ${isActive ? '#ff8c42' : 'transparent'}`,
                    boxShadow: isActive ? '3px 3px 0px #ff8c42' : 'none',
                    transition: 'all 0.2s ease',
                  }}>
                    <div style={{
                      width: '32px', height: '32px', borderRadius: '8px', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px',
                      background: isDone ? '#d4edda' : hasProgress ? '#ffe6a7' : '#ece0b6',
                      border: '2px solid',
                      borderColor: isDone ? '#28a745' : hasProgress ? '#ff8c42' : '#d2c59d'
                    }}>
                      {isDone ? <span style={{ color: '#28a745', fontSize: '16px', fontWeight: 'bold' }}>✓</span> : <span>{topic.icon}</span>}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <span style={{ fontSize: '16px', fontWeight: 600, color: isDone ? '#28a745' : isActive ? '#ff8c42' : '#444' }}>{topic.title}</span>
                        <span style={{
                          fontSize: '12px', padding: '2px 8px', borderRadius: '8px', fontWeight: 600,
                          background: isDone ? '#d4edda' : hasProgress ? '#ffe6a7' : '#ece0b6',
                          color: isDone ? '#28a745' : hasProgress ? '#ff8c42' : '#777',
                          border: `1px solid ${isDone ? '#28a745' : hasProgress ? '#ff8c42' : '#d2c59d'}`,
                        }}>
                          {isDone ? 'Done' : hasProgress ? 'Active' : 'Locked'}
                        </span>
                      </div>
                      <div style={{ height: '6px', background: '#ece0b6', borderRadius: '3px', border: '1px solid #d2c59d' }}>
                        <div style={{ height: '4px', width: `${pct}%`, borderRadius: '2px', background: isDone ? '#28a745' : '#ff8c42', transition: 'width 0.4s ease' }} />
                      </div>
                      {topic.total_problems > 0 && (
                        <p style={{ fontSize: '13px', color: '#777', margin: '4px 0 0 0', fontWeight: 500 }}>
                          {topic.solved_problems}/{topic.total_problems} problems
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
 
          {/* Right column */}
          <div style={s.rightCol}>
            {/* Current topic patterns */}
            {selectedTopic && (
              <div style={s.panel}>
                <p style={s.panelTitle}>Current topic — {selectedTopic.title}</p>
                {isPatternsLoading ? (
                  <p style={{ fontSize: '15px', color: '#8a8a8a', fontStyle: 'italic', margin: 0 }}>Loading patterns...</p>
                ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {patterns.map((pattern) => {
                    const solved = pattern.problems?.filter((p: any) => p.solved).length || 0
                    const total = pattern.problems?.length || 0
                    const isDone = solved === total && total > 0
                    const isActive = solved > 0 && !isDone
                    return (
                      <div key={pattern.id} style={{
                        display: 'flex', alignItems: 'center', gap: '12px',
                        padding: '12px 14px', borderRadius: '10px',
                        background: isActive ? '#fffaf0' : '#fffdf6',
                        border: `2px dashed ${isActive ? '#ff8c42' : '#ece0b6'}`,
                      }}>
                        <div style={{
                          width: '12px', height: '12px', borderRadius: '50%', flexShrink: 0,
                          background: isDone ? '#28a745' : isActive ? '#ff8c42' : '#ece0b6',
                          border: `2px solid ${isDone ? '#1e7e34' : isActive ? '#e67e22' : '#d2c59d'}`
                        }} />
                        <span style={{ flex: 1, fontSize: '16px', fontWeight: 600, color: isDone ? '#28a745' : isActive ? '#2c4a7a' : '#6d6d6d' }}>
                          {pattern.title}
                        </span>
                        <span style={{ fontSize: '14px', fontWeight: 600, color: isDone ? '#28a745' : isActive ? '#ff8c42' : '#8a8a8a' }}>
                          {isDone ? 'Done' : isActive ? `${solved}/${total} solved` : 'Upcoming'}
                        </span>
                      </div>
                    )
                  })}
                </div>
                )}
              </div>
            )}
 
            {/* Weekly activity */}
            <div style={s.panel}>
              <p style={s.panelTitle}>Weekly activity</p>
              <div style={{ display: 'flex', gap: '8px' }}>
                {days.map((day, i) => {
                  const today = new Date().getDay()
                  const dayIndex = (i + 1) % 7
                  const hit = weeklyStreak.find((x: any) => new Date(x.date).getDay() === dayIndex)
                  const isToday = dayIndex === today
                  return (
                    <div key={i} style={{ flex: 1 }}>
                      <div style={{
                        height: '40px', borderRadius: '8px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '14px', fontWeight: 700,
                        background: isToday ? '#2c4a7a' : hit ? '#ffe6a7' : '#ece0b6',
                        color: isToday ? '#fff' : hit ? '#ff8c42' : '#8a8a8a',
                        border: `2px solid ${isToday ? '#1a2e4c' : hit ? '#f2ca6d' : '#d2c59d'}`,
                        boxShadow: isToday ? '2px 2px 0px #1a2e4c' : 'none'
                      }}>
                        {day}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
 
        {/* Bottom row */}
        {selectedTopic && (patterns.length > 0 || isPatternsLoading) && (
          <div style={s.bottomGrid}>
            {/* Up next */}
            <div style={s.panel}>
              <p style={s.panelTitle}>Up next{currentPattern ? ` — ${currentPattern.title}` : ''}</p>
              {isPatternsLoading ? (
                <p style={{ fontSize: '15px', color: '#8a8a8a', fontStyle: 'italic', margin: 0 }}>Loading...</p>
              ) : !currentPattern ? (
                <p style={{ fontSize: '16px', color: '#6d6d6d', fontWeight: 600 }}>All done! 🎉</p>
              ) : (
                currentPattern.problems?.filter((p: any) => !p.solved).slice(0, 4).map((prob: any, i: number) => (
                  <div key={prob.id} style={{
                    display: 'flex', alignItems: 'center', gap: '14px',
                    padding: '12px 0',
                    borderTop: i === 0 ? 'none' : '2px dashed #ece0b6',
                  }}>
                    <span style={{ fontSize: '15px', fontWeight: 700, color: '#8a8a8a', width: '20px', flexShrink: 0 }}>{i + 1}.</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <a href={prob.url} target="_blank" rel="noreferrer" style={{
                        fontSize: '16px', fontWeight: 600, color: '#2c4a7a', textDecoration: 'none',
                        display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {prob.title}
                      </a>
                      <span style={{ fontSize: '13px', color: '#8a8a8a', fontWeight: 600 }}>{prob.platform}</span>
                    </div>
                    <span style={{
                      fontSize: '12px', padding: '4px 10px', borderRadius: '12px', fontWeight: 700, flexShrink: 0,
                      background: prob.difficulty === 'Easy' ? '#d4edda' : prob.difficulty === 'Medium' ? '#fff3cd' : '#f8d7da',
                      color: prob.difficulty === 'Easy' ? '#28a745' : prob.difficulty === 'Medium' ? '#856404' : '#721c24',
                      border: `2px solid ${prob.difficulty === 'Easy' ? '#c3e6cb' : prob.difficulty === 'Medium' ? '#ffe8a1' : '#f5c6cb'}`
                    }}>
                      {prob.difficulty}
                    </span>
                  </div>
                ))
              )}
            </div>
 
            {/* Key methods */}
            <div style={s.panel}>
              <p style={s.panelTitle}>Key methods to know</p>
              {isPatternsLoading ? (
                <p style={{ fontSize: '15px', color: '#8a8a8a', fontStyle: 'italic', margin: 0 }}>Loading...</p>
              ) : currentPattern && (
                <>
                  <div style={{ background: '#fffaf0', border: '2px solid #ece0b6', borderRadius: '10px', padding: '16px', marginBottom: '16px', boxShadow: '3px 3px 0px #ece0b6' }}>
                    <pre style={{ margin: 0, fontFamily: "'JetBrains Mono', 'Fira Code', monospace", fontSize: '14px', lineHeight: '1.9', color: '#444', whiteSpace: 'pre-wrap' as const }}>
                      {currentPattern.template_code?.split('\n').map((line: string, i: number) => {
                        const isComment = line.trim().startsWith('//')
                        const isType = /\b(int|void|boolean|String|long)\b/.test(line)
                        const isMath = line.includes('Math.')
                        return (
                          <span key={i} style={{
                            display: 'block',
                            color: isComment ? '#8a8a8a' : isMath ? '#28a745' : isType ? '#ff8c42' : '#2c4a7a',
                            fontStyle: isComment ? 'italic' : 'normal',
                            fontWeight: isType || isMath ? 700 : 500
                          }}>
                            {line}
                          </span>
                        )
                      })}
                    </pre>
                  </div>
                  <p style={{ fontSize: '16px', color: '#6d6d6d', margin: 0, lineHeight: '1.7', fontWeight: 500 }}>
                    {currentPattern.when_to_use}
                  </p>
                </>
              )}
            </div>
          </div>
        )}
 
        {/* All problems */}
        {selectedTopic && (patterns.length > 0 || isPatternsLoading) && (
          <div style={{ ...s.panel, marginTop: '20px' }}>
            <p style={s.panelTitle}>{selectedTopic.icon} {selectedTopic.title} — All problems</p>
            {isPatternsLoading ? (
              <p style={{ fontSize: '15px', color: '#8a8a8a', fontStyle: 'italic', margin: 0 }}>Loading all problems...</p>
            ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '26px' }}>
              {patterns.map((pattern) => {
                const solved = pattern.problems?.filter((p: any) => p.solved).length || 0
                const total = pattern.problems?.length || 0
                return (
                  <div key={pattern.id}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                      <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#ff8c42', margin: 0 }}>{pattern.title}</h3>
                      <span style={{ fontSize: '14px', fontWeight: 700, color: '#777', background: '#ece0b6', padding: '2px 10px', borderRadius: '10px', border: '2px solid #d2c59d' }}>
                        {solved}/{total}
                      </span>
                    </div>
                    {pattern.key_methods && (
                      <div style={{ background: '#fffaf0', border: '2px dashed #ece0b6', borderRadius: '10px', padding: '10px 14px', marginBottom: '12px' }}>
                        <code style={{ fontSize: '14px', fontWeight: 700, color: '#28a745', fontFamily: "'Patrick Hand', monospace" }}>{pattern.key_methods}</code>
                      </div>
                    )}
                    {pattern.problems?.map((prob: any, i: number) => (
                      <div key={prob.id} style={{
                        display: 'flex', alignItems: 'center', gap: '14px',
                        padding: '10px 0',
                        borderTop: i === 0 ? 'none' : '2px dashed #ece0b6',
                      }}>
                        <input
                          type="checkbox"
                          checked={prob.solved}
                          onChange={() => !prob.solved && handleSolve(prob.id)}
                          style={{ accentColor: '#ff8c42', width: '20px', height: '20px', cursor: prob.solved ? 'default' : 'pointer', flexShrink: 0 }}
                        />
                        <a href={prob.url} target="_blank" rel="noreferrer" style={{
                          flex: 1, fontSize: '16px', fontWeight: 600, textDecoration: 'none',
                          color: prob.solved ? '#8a8a8a' : '#2c4a7a',
                          textDecorationLine: prob.solved ? 'line-through' : 'none',
                        }}>
                          {prob.title}
                        </a>
                        <span style={{
                          fontSize: '12px', padding: '4px 10px', borderRadius: '12px', fontWeight: 700, flexShrink: 0,
                          background: prob.difficulty === 'Easy' ? '#d4edda' : prob.difficulty === 'Medium' ? '#fff3cd' : '#f8d7da',
                          color: prob.difficulty === 'Easy' ? '#28a745' : prob.difficulty === 'Medium' ? '#856404' : '#721c24',
                          border: `2px solid ${prob.difficulty === 'Easy' ? '#c3e6cb' : prob.difficulty === 'Medium' ? '#ffe8a1' : '#f5c6cb'}`
                        }}>
                          {prob.difficulty}
                        </span>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#8a8a8a', flexShrink: 0 }}>{prob.platform}</span>
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}