const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { db } = require('../index');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Register
router.post('/register', async (req, res) => {
    const { name, email, password, role, university, year_graduated, program, goals, personality, interests } = req.body;
    
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        
        db.run(
            `INSERT INTO users (name, email, password, role, university, year_graduated, program, goals, personality, interests)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [name, email, hashedPassword, role, university, year_graduated, program, 
             JSON.stringify(goals), JSON.stringify(personality), JSON.stringify(interests)],
            function(err) {
                if (err) {
                    return res.status(400).json({ error: 'Email already exists' });
                }
                
                const userId = this.lastID;
                
                // Create instant match for mentee
                if (role === 'mentee') {
                    // Find compatible mentors
                    db.all(
                        `SELECT * FROM users WHERE role = 'mentor' AND university = ?`,
                        [university],
                        (err, mentors) => {
                            if (mentors && mentors.length > 0) {
                                // Simple matching - pick first compatible mentor
                                const mentor = mentors[0];
                                db.run(
                                    `INSERT INTO matches (mentor_id, mentee_id, match_score, status)
                                     VALUES (?, ?, ?, 'matched')`,
                                    [mentor.id, userId, 85],
                                    function() {
                                        res.json({ 
                                            message: 'User created and matched!', 
                                            userId,
                                            matchId: this.lastID 
                                        });
                                    }
                                );
                            } else {
                                res.json({ message: 'User created!', userId });
                            }
                        }
                    );
                } else {
                    res.json({ message: 'User created!', userId });
                }
            }
        );
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Login
router.post('/login', (req, res) => {
    const { email, password } = req.body;
    
    db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
        if (err || !user) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }
        
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }
        
        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
        
        // Get user's match if mentee
        if (user.role === 'mentee') {
            db.get(
                `SELECT m.*, u.name as mentor_name, u.university as mentor_university
                 FROM matches m 
                 JOIN users u ON m.mentor_id = u.id 
                 WHERE m.mentee_id = ? AND m.status = 'matched'`,
                [user.id],
                (err, match) => {
                    res.json({ 
                        token, 
                        user: { 
                            id: user.id, 
                            name: user.name, 
                            email: user.email,
                            role: user.role 
                        },
                        match: match || null
                    });
                }
            );
        } else {
            res.json({ 
                token, 
                user: { 
                    id: user.id, 
                    name: user.name, 
                    email: user.email,
                    role: user.role 
                }
            });
        }
    });
});

// Get user profile
router.get('/profile/:userId', (req, res) => {
    db.get('SELECT id, name, email, role, university, program, year_graduated FROM users WHERE id = ?', 
        [req.params.userId], (err, user) => {
            if (err || !user) {
                return res.status(404).json({ error: 'User not found' });
            }
            res.json(user);
        });
});

module.exports = router;