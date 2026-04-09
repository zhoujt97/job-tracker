const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');

const signup = (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const existingUser = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (existingUser) {
    return res.status(400).json({ error: 'Email already in use' });
  }

  const salt = bcrypt.genSaltSync(10);
  const password_hash = bcrypt.hashSync(password, salt);
  const id = uuidv4();

  db.prepare(
    'INSERT INTO users (id, username, email, password_hash, salt) VALUES (?, ?, ?, ?, ?)'
  ).run(id, username, email, password_hash, salt);

  const token = jwt.sign({ id, username }, process.env.JWT_SECRET, { expiresIn: '7d' });

  res.status(201).json({ token, user: { id, username, email } });
};

const login = (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const isValid = bcrypt.compareSync(password, user.password_hash);
  if (!isValid) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign(
    { id: user.id, username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({ token, user: { id: user.id, username: user.username, email: user.email } });
};

module.exports = { signup, login };