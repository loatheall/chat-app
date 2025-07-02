const express = require('express');
const session = require('express-session');
const sharedSession = require('express-socket.io-session');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');
const authRoutes = require('./auth');
const mysql = require('mysql2');

// Możesz odkomentować jeśli chcesz używać .env pliku:
// require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Silnik widoków
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Konfiguracja sesji
const sessionMiddleware = session({
  secret: 'tajnyklucz',
  resave: false,
  saveUninitialized: false
});
app.use(sessionMiddleware);

// Udostępnianie plików statycznych
app.use(express.static(path.join(__dirname, 'public')));

// Połączenie z MySQL (teraz z użyciem zmiennych środowiskowych)
const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'chatdb'
});

db.connect(err => {
  if (err) {
    console.error('❌ Błąd połączenia z MySQL:', err);
    process.exit(1);
  }
  console.log('✅ Połączono z MySQL');
});

// Routing
app.use(authRoutes(db));

app.get('/', (req, res) => res.redirect('/login'));

app.get('/chat', (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  res.render('index', { username: req.session.user });
});

// Socket.IO z sesją
io.use(sharedSession(sessionMiddleware, {
  autoSave: true
}));

io.on('connection', (socket) => {
  const username = socket.handshake.session.user;

  if (!username) {
    console.log('🔒 Brak sesji – rozłączam');
    socket.disconnect();
    return;
  }

  socket.username = username;
  console.log(`💬 ${username} połączony`);

  socket.on('chat message', (msg) => {
    console.log(`📨 ${socket.username}: ${msg}`);
    io.emit('chat message', {
      user: socket.username,
      message: msg
    });
  });

  socket.on('disconnect', () => {
    console.log(`❌ ${socket.username} rozłączony`);
  });
});

// Start serwera
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Serwer działa na http://0.0.0.0:${PORT}`);
});
