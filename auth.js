const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();

module.exports = (db) => {
  router.post('/register', async (req, res) => {
    const { username, password } = req.body;
    const hash = await bcrypt.hash(password, 10);
    db.query('INSERT INTO users (username, password) VALUES (?, ?)', [username, hash], (err) => {
      if (err) return res.status(500).send('Błąd rejestracji');
      res.redirect('/login.html');
    });
  });

  router.post('/login', (req, res) => {
    const { username, password } = req.body;
    db.query('SELECT * FROM users WHERE username = ?', [username], async (err, results) => {
      if (err || results.length === 0) return res.status(401).send('Błędny login');
      const match = await bcrypt.compare(password, results[0].password);
      if (match) {
        req.session.user = username;
        res.redirect('/');
      } else {
        res.status(401).send('Błędne hasło');
      }
    });
  });

  return router;
};

