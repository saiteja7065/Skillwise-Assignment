const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const router = express.Router();

// JWT Secret (in production, use environment variable)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Import database
let db;
const setDb = (database) => {
  db = database;
};

// Register User
router.post(
  '/register',
  [
    body('username').trim().isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
    body('email').isEmail().withMessage('Invalid email address'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password } = req.body;

    try {
      // Check if username already exists
      db.get('SELECT id FROM users WHERE username = ?', [username], async (err, user) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }

        if (user) {
          return res.status(400).json({ error: 'Username already exists' });
        }

        // Check if email already exists
        db.get('SELECT id FROM users WHERE email = ?', [email], async (err, user) => {
          if (err) {
            return res.status(500).json({ error: 'Database error' });
          }

          if (user) {
            return res.status(400).json({ error: 'Email already exists' });
          }

          // Hash password
          const hashedPassword = await bcrypt.hash(password, 10);

          // Insert new user
          db.run(
            'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
            [username, email, hashedPassword],
            function (err) {
              if (err) {
                return res.status(500).json({ error: 'Failed to create user' });
              }

              // Generate JWT token
              const token = jwt.sign(
                { id: this.lastID, username, email },
                JWT_SECRET,
                { expiresIn: '7d' }
              );

              res.status(201).json({
                message: 'User registered successfully',
                token,
                user: {
                  id: this.lastID,
                  username,
                  email,
                },
              });
            }
          );
        });
      });
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// Login User (supports both username and email)
router.post(
  '/login',
  [
    body('identifier').notEmpty().withMessage('Username or email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { identifier, password } = req.body;

    try {
      // Check if identifier is email or username
      const isEmail = identifier.includes('@');
      const query = isEmail
        ? 'SELECT * FROM users WHERE email = ?'
        : 'SELECT * FROM users WHERE username = ?';

      db.get(query, [identifier], async (err, user) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }

        if (!user) {
          return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Compare password
        const isValidPassword = await bcrypt.compare(password, user.password);

        if (!isValidPassword) {
          return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = jwt.sign(
          { id: user.id, username: user.username, email: user.email },
          JWT_SECRET,
          { expiresIn: '7d' }
        );

        res.json({
          message: 'Login successful',
          token,
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
          },
        });
      });
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// Get Current User (protected route)
router.get('/me', verifyToken, (req, res) => {
  db.get('SELECT id, username, email, created_at FROM users WHERE id = ?', [req.user.id], (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  });
});

// Middleware to verify JWT token
function verifyToken(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(403).json({ error: 'No token provided' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    req.user = decoded;
    next();
  });
}

// Export middleware for use in other routes
module.exports = { router, setDb, verifyToken };
