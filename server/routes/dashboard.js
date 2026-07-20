const express = require('express');
const router = express.Router();
const { db } = require('../index');

// Get user profile and current match
router.get('/:userId', (req, res) => {
    const { userId } = req.params;
    
    // Get user profile
    db.get(
        `SELECT id, name, email, role, university, program, year_graduated, interests, goals, personality 
         FROM users WHERE id = ?`,
        [userId],
        (err, user) => {
            if (err || !user) {
                return res.status(404).json({ error: 'User not found' });
            }
            
            // Get current match
            db.get(
                `SELECT m.*, 
                 u1.name as mentor_name, u1.university as mentor_university, u1.program as mentor_program,
                 u2.name as mentee_name, u2.university as mentee_university, u2.program as mentee_program
                 FROM matches m
                 JOIN users u1 ON m.mentor_id = u1.id
                 JOIN users u2 ON m.mentee_id = u2.id
                 WHERE (m.mentor_id = ? OR m.mentee_id = ?) AND m.status = 'matched'`,
                [userId, userId],
                (err, match) => {
                    if (err) {
                        return res.status(500).json({ error: 'Database error' });
                    }
                    
                    // Parse JSON fields
                    const userData = {
                        ...user,
                        interests: JSON.parse(user.interests || '[]'),
                        goals: JSON.parse(user.goals || '[]')
                    };
                    
                    res.json({
                        user: userData,
                        currentMatch: match || null
                    });
                }
            );
        }
    );
});

// Update user profile
router.put('/:userId', (req, res) => {
    const { userId } = req.params;
    const { name, university, program, year_graduated, interests, goals, personality } = req.body;
    
    db.run(
        `UPDATE users SET name = ?, university = ?, program = ?, year_graduated = ?, 
         interests = ?, goals = ?, personality = ? WHERE id = ?`,
        [name, university, program, year_graduated, 
         JSON.stringify(interests), JSON.stringify(goals), JSON.stringify(personality), userId],
        function(err) {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }
            res.json({ message: 'Profile updated successfully!' });
        }
    );
});

// Get all matches for a user
router.get('/:userId/matches', (req, res) => {
    const { userId } = req.params;
    
    db.all(
        `SELECT m.*, 
         u1.name as mentor_name, u1.university as mentor_university, u1.program as mentor_program,
         u2.name as mentee_name, u2.university as mentee_university, u2.program as mentee_program
         FROM matches m
         JOIN users u1 ON m.mentor_id = u1.id
         JOIN users u2 ON m.mentee_id = u2.id
         WHERE m.mentor_id = ? OR m.mentee_id = ?
         ORDER BY m.created_at DESC`,
        [userId, userId],
        (err, matches) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }
            res.json(matches || []);
        }
    );
});

// Get events the user has joined
router.get('/:userId/events', (req, res) => {
    const { userId } = req.params;
    
    db.all(
        `SELECT e.*, ep.role as participant_role
         FROM events e
         JOIN event_participants ep ON e.id = ep.event_id
         WHERE ep.user_id = ?
         ORDER BY e.date_time ASC`,
        [userId],
        (err, events) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }
            res.json(events || []);
        }
    );
});

module.exports = router;