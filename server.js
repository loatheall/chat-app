const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mysql = require('mysql2');
const session = require('express-session');
const bodyParser = require('body-parser');
const authRoutes = require('./auth');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(session({
  secret: 'tajnyklucz',
  resave: false,
  saveUninitialized: false
}));

function connectWithRetry() {
  const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'chatuser',
    password: process.env.DB_PASSWORD || 'ch@tpass',
    database: process.env.DB_NAME || 'chatdb'
  });

  db.connect((err) => {
    if (err) {
      console.error('❌ MySQL connection failed. Retrying in 5s...', err.message);
      setTimeout(connectWithRetry, 5000);
    } else {
      console.log('✅ Connected to MySQL');
      startChatServer(db);
    }
  });
}

function startChatServer(db) {
  // Tworzenie tabeli wiadomości
  db.query(`
    CREATE TABLE IF NOT EXISTS messages (
      id INT AUTO_INCREMENT PRIMARY KEY,
      text TEXT NOT NULL,
      username VARCHAR(255),
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tworzenie tabeli użytkowników
  db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(255) NOT NULL UNIQUE,
      password TEXT NOT NULL
    )
  `);

  // Routing autoryzacji
  app.use('/', authRoutes(db));

  // Socket.io obsługa
  io.on('connection', (socket) => {
    const req = socket.request;

    // Brak sesji? Nie wpuszczamy
    if (!req.session || !req.session.user) {
      console.log('🔒 Niezalogowany użytkownik próbował się połączyć');
      socket.disconnect();
      return;
    }

    console.log(`🔌 ${req.session.user} dołączył do czatu`);

    db.query('SELECT * FROM messages ORDER BY timestamp ASC', (err, results) => {
      if (!err) {
        results.forEach(row => {
          socket.emit('chat message', `${row.username || 'Anon'}: ${row.text}`);
        });
      }
    });

    socket.on('chat message', (msg) => {
      const username = req.session.user;
      db.query('INSERT INTO messages (text, username) VALUES (?, ?)', [msg, username]);
      io.emit('chat message', `${username}: ${msg}`);
    });
  });

  server.listen(3000, () => {
    console.log('🚀 Server listening on *:3000');
  });
}

// start
connectWithRetry();

