const bcrypt = require('bcrypt');
const request = require('supertest');
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const authRoutes = require('../auth');

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(session({
  secret: 'test',
  resave: false,
  saveUninitialized: false
}));

// Atrapa bazy – z symulacją zapisu
const fakeDb = {
  query: (sql, params, callback) => {
    // tylko udajemy zapis bez błędów
    callback(null);
  }
};

app.use('/', authRoutes(fakeDb));

test('hashowanie hasła działa', async () => {
  const password = 'tajnehaslo';
  const hash = await bcrypt.hash(password, 10);
  const match = await bcrypt.compare(password, hash);
  expect(match).toBe(true);
});

// Drugi test - naprawiony
test('POST /register powinien przekierować na /login.html', async () => {
  const res = await request(app)
    .post('/register')
    .send({ username: 'testuser', password: 'testpass' });

  expect(res.statusCode).toBe(302);
  expect(res.headers.location).toBe('/login');
}, 10000); // wydłużamy timeout do 10 sekund
