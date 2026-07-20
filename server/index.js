const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../public')));

// Database setup
const db = new sqlite3.Database('./database.db', (err) => {
    if (err) {
        console.error('Database connection error:', err);
    } else {
        console.log('Connected to SQLite database');
    }
});

// Create tables
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        email TEXT UNIQUE,
        password TEXT,
        role TEXT CHECK(role IN ('mentor', 'mentee')),
        university TEXT,
        year_graduated INTEGER,
        program TEXT,
        goals TEXT,
        personality TEXT,
        interests TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS matches (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        mentor_id INTEGER REFERENCES users(id),
        mentee_id INTEGER REFERENCES users(id),
        match_score REAL,
        status TEXT CHECK(status IN ('pending', 'matched', 'rejected')) DEFAULT 'matched',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS chats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        match_id INTEGER REFERENCES matches(id),
        sender_id INTEGER REFERENCES users(id),
        message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT,
        location TEXT,
        date_time TIMESTAMP,
        mentor_spots INTEGER,
        mentee_spots INTEGER,
        coupon_code TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS event_participants (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_id INTEGER REFERENCES events(id),
        user_id INTEGER REFERENCES users(id),
        role TEXT CHECK(role IN ('mentor', 'mentee'))
    )`);
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/match', require('./routes/match'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/events', require('./routes/events'));
app.use('/api/dashboard', require('./routes/dashboard'));

// Socket.IO for real-time chat
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join-chat', (matchId) => {
        socket.join(`match-${matchId}`);
    });

    socket.on('send-message', (data) => {
        io.to(`match-${data.matchId}`).emit('new-message', data);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = { db, io };