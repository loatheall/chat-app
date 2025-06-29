const express = require('express');
const bcrypt = require('bcrypt');
const path = require('path');
const router = express.Router();

module.exports = (db) => {
  // Widok logowania
  router.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
  });

  // Widok rejestracji
  router.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'register.html'));
  });

  // Obsługa rejestracji
  router.post('/register', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).send('Brakuje loginu lub hasła');

    try {
      const hash = await bcrypt.hash(password, 10);
      db.query(
        'INSERT INTO users (username, password) VALUES (?, ?)',
        [username, hash],
        (err) => {
          if (err) return res.status(500).send('Rejestracja nieudana');
          res.redirect('/login');
        }
      );
    } catch (err) {
      res.status(500).send('Błąd serwera');
    }
  });

  // Obsługa logowania
  router.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).send('Brakuje loginu lub hasła');

    db.query('SELECT * FROM users WHERE username = ?', [username], async (err, results) => {
      if (err || results.length === 0) {
        return res.status(401).send('Nieprawidłowy login');
      }

      const match = await bcrypt.compare(password, results[0].password);
      if (match) {
        req.session.user = username;
        return res.redirect('/chat');
      } else {
        return res.status(401).send('Błędne hasło');
      }
    });
  });

  return router;
};
