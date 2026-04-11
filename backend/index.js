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