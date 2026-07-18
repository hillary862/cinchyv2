const express = require('express');
const router = express.Router();
const { db } = require('../index');

// Get user's match
router.get('/:userId', (req, res) => {
    const { userId } = req.params;
    
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
            res.json(match || null);
        }
    );
});

// Find new matches based on similarity
router.post('/find', (req, res) => {
    const { userId, interests, goals } = req.body;
    
    // Get user info
    db.get('SELECT * FROM users WHERE id = ?', [userId], (err, user) => {
        if (err || !user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Find compatible mentors/mentees
        const targetRole = user.role === 'mentee' ? 'mentor' : 'mentee';
        
        db.all(
            `SELECT * FROM users WHERE role = ? AND university = ?`,
            [targetRole, user.university],
            (err, candidates) => {
                if (err) {
                    return res.status(500).json({ error: 'Database error' });
                }
                
                // Calculate similarity scores
                const matches = candidates.map(candidate => {
                    let score = 50; // Base score
                    
                    // University match (already filtered)
                    score += 20;
                    
                    // Interest overlap
                    const userInterests = JSON.parse(user.interests || '[]');
                    const candidateInterests = JSON.parse(candidate.interests || '[]');
                    const commonInterests = userInterests.filter(i => candidateInterests.includes(i));
                    score += commonInterests.length * 5;
                    
                    // Goal alignment
                    const userGoals = JSON.parse(user.goals || '[]');
                    const candidateGoals = JSON.parse(candidate.goals || '[]');
                    const commonGoals = userGoals.filter(g => candidateGoals.includes(g));
                    score += commonGoals.length * 5;
                    
                    return {
                        ...candidate,
                        match_score: Math.min(score, 100)
                    };
                }).sort((a, b) => b.match_score - a.match_score).slice(0, 5);
                
                res.json(matches);
            }
        );
    });
});

module.exports = router;