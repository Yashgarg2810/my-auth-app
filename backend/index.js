const express = require('express')
const cors = require('cors')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
require('dotenv').config()

const pool = require('./db')
const app = express()

app.use(cors())
app.use(express.json())

// REGISTER
app.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body

    // Check if user already exists
    const userExists = await pool.query(
      'SELECT * FROM users WHERE email = $1', [email]
    )
    if (userExists.rows.length > 0) {
      return res.status(400).json({ message: 'Email already registered' })
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Save user to database
    const newUser = await pool.query(
      'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email',
      [name, email, hashedPassword]
    )

    res.status(201).json({ 
      message: 'User registered successfully',
      user: newUser.rows[0]
    })

  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Server error' })
  }
})

app.listen(3000, () => {
  console.log('Server running on port 3000')
})


// LOGIN
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    // Check if user exists
    const user = await pool.query(
      'SELECT * FROM users WHERE email = $1', [email]
    )
    if (user.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid email or password' })
    }

    // Check password
    const validPassword = await bcrypt.compare(password, user.rows[0].password)
    if (!validPassword) {
      return res.status(400).json({ message: 'Invalid email or password' })
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.rows[0].id, email: user.rows[0].email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    )

    res.json({ message: 'Login successful', token })

  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Server error' })
  }
})


// JWT Middleware
const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1]
  if (!token) return res.status(401).json({ message: 'Access denied' })

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET)
    req.user = verified
    next()
  } catch {
    res.status(403).json({ message: 'Invalid token' })
  }
}

// Protected route example
app.get('/profile', authenticateToken, async (req, res) => {
  const user = await pool.query(
    'SELECT id, name, email FROM users WHERE id = $1', 
    [req.user.id]
  )
  res.json({ user: user.rows[0] })
})


// GET all topics with progress for logged in user
app.get('/topics', authenticateToken, async (req, res) => {
  try {
    const topics = await pool.query(
      'SELECT * FROM topics ORDER BY order_index'
    )

    const progress = await pool.query(
      `SELECT p.pattern_id, COUNT(up.id) as solved
       FROM user_progress up
       JOIN problems p ON up.problem_id = p.id
       WHERE up.user_id = $1
       GROUP BY p.pattern_id`,
      [req.user.id]
    )

    const totalProblems = await pool.query(
      `SELECT pa.topic_id, COUNT(p.id) as total
       FROM problems p
       JOIN patterns pa ON p.pattern_id = pa.id
       GROUP BY pa.topic_id`
    )

    const solvedProblems = await pool.query(
      `SELECT pa.topic_id, COUNT(up.id) as solved
       FROM user_progress up
       JOIN problems p ON up.problem_id = p.id
       JOIN patterns pa ON p.pattern_id = pa.id
       WHERE up.user_id = $1
       GROUP BY pa.topic_id`,
      [req.user.id]
    )

    const totalMap = {}
    totalProblems.rows.forEach(r => totalMap[r.topic_id] = parseInt(r.total))

    const solvedMap = {}
    solvedProblems.rows.forEach(r => solvedMap[r.topic_id] = parseInt(r.solved))

    const result = topics.rows.map(t => ({
      ...t,
      total_problems: totalMap[t.id] || 0,
      solved_problems: solvedMap[t.id] || 0
    }))

    res.json({ topics: result })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Server error' })
  }
})

// GET patterns for a topic with problems
app.get('/topics/:topicId/patterns', authenticateToken, async (req, res) => {
  try {
    const { topicId } = req.params

    const patterns = await pool.query(
      'SELECT * FROM patterns WHERE topic_id = $1 ORDER BY order_index',
      [topicId]
    )

    const problems = await pool.query(
      `SELECT p.*, 
        CASE WHEN up.id IS NOT NULL THEN true ELSE false END as solved
       FROM problems p
       JOIN patterns pa ON p.pattern_id = pa.id
       LEFT JOIN user_progress up ON up.problem_id = p.id AND up.user_id = $1
       WHERE pa.topic_id = $2
       ORDER BY p.pattern_id, p.order_index`,
      [req.user.id, topicId]
    )

    const result = patterns.rows.map(pat => ({
      ...pat,
      problems: problems.rows.filter(p => p.pattern_id === pat.id)
    }))

    res.json({ patterns: result })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Server error' })
  }
})

// MARK problem as solved
app.post('/problems/:problemId/solve', authenticateToken, async (req, res) => {
  try {
    const { problemId } = req.params

    await pool.query(
      `INSERT INTO user_progress (user_id, problem_id) 
       VALUES ($1, $2) ON CONFLICT (user_id, problem_id) DO NOTHING`,
      [req.user.id, problemId]
    )

    // update streak
    await pool.query(
      `INSERT INTO user_streaks (user_id, date, problems_solved)
       VALUES ($1, CURRENT_DATE, 1)
       ON CONFLICT (user_id, date) 
       DO UPDATE SET problems_solved = user_streaks.problems_solved + 1`,
      [req.user.id]
    )

    res.json({ message: 'Problem marked as solved' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Server error' })
  }
})

// GET dashboard stats
app.get('/dashboard', authenticateToken, async (req, res) => {
  try {
    const user = await pool.query(
      'SELECT id, name, email, streak, placement_months FROM users WHERE id = $1',
      [req.user.id]
    )

    const totalSolved = await pool.query(
      'SELECT COUNT(*) as count FROM user_progress WHERE user_id = $1',
      [req.user.id]
    )

    const topicsCompleted = await pool.query(
      `SELECT COUNT(DISTINCT pa.topic_id) as count
       FROM user_progress up
       JOIN problems p ON up.problem_id = p.id
       JOIN patterns pa ON p.pattern_id = pa.id
       WHERE up.user_id = $1`,
      [req.user.id]
    )

    const weeklyStreak = await pool.query(
      `SELECT date, problems_solved FROM user_streaks
       WHERE user_id = $1 AND date >= CURRENT_DATE - INTERVAL '6 days'
       ORDER BY date`,
      [req.user.id]
    )

    const patternsLearned = await pool.query(
      `SELECT COUNT(DISTINCT p.pattern_id) as count
       FROM user_progress up
       JOIN problems p ON up.problem_id = p.id
       WHERE up.user_id = $1`,
      [req.user.id]
    )

    res.json({
      user: user.rows[0],
      stats: {
        total_solved: parseInt(totalSolved.rows[0].count),
        topics_completed: parseInt(topicsCompleted.rows[0].count),
        patterns_learned: parseInt(patternsLearned.rows[0].count),
      },
      weekly_streak: weeklyStreak.rows
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Server error' })
  }
})