const express = require('express');
const router = express.Router();
const { db, io } = require('../index');

// Get chat history for a match
router.get('/:matchId', (req, res) => {
    const { matchId } = req.params;
    
    db.all(
        `SELECT c.*, u.name as sender_name 
         FROM chats c 
         JOIN users u ON c.sender_id = u.id 
         WHERE c.match_id = ? 
         ORDER BY c.created_at ASC`,
        [matchId],
        (err, messages) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }
            res.json(messages || []);
        }
    );
});

// Send a message
router.post('/send', (req, res) => {
    const { matchId, senderId, message } = req.body;
    
    db.run(
        `INSERT INTO chats (match_id, sender_id, message) VALUES (?, ?, ?)`,
        [matchId, senderId, message],
        function(err) {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }
            
            // Emit to socket
            io.to(`match-${matchId}`).emit('new-message', {
                id: this.lastID,
                match_id: matchId,
                sender_id: senderId,
                message: message,
                created_at: new Date()
            });
            
            res.json({ message: 'Message sent!', id: this.lastID });
        }
    );
});

// Get AI-generated message suggestion
router.post('/suggest', (req, res) => {
    const { matchId, userId, tone } = req.body;
    
    // Get match info
    db.get(
        `SELECT m.*, u1.name as mentor_name, u2.name as mentee_name, u1.interests as mentor_interests
         FROM matches m
         JOIN users u1 ON m.mentor_id = u1.id
         JOIN users u2 ON m.mentee_id = u2.id
         WHERE m.id = ?`,
        [matchId],
        (err, match) => {
            if (err || !match) {
                return res.status(404).json({ error: 'Match not found' });
            }
            
            // Simple AI message generation (can be enhanced with OpenAI API)
            const isMentor = match.mentor_id === userId;
            const otherName = isMentor ? match.mentee_name : match.mentor_name;
            const otherInterests = isMentor ? JSON.parse(match.mentor_interests || '[]') : [];
            
            const templates = {
                professional: `Hi ${otherName}, I'm excited to connect! I noticed we share interests in ${otherInterests.slice(0, 2).join(' and ')}. I'd love to hear about your journey and share some insights. When would be a good time to chat?`,
                casual: `Hey ${otherName}! 👋 I saw we're both from U of T and thought it would be cool to connect. Want to grab coffee and chat about your path?`,
                excited: `Hi ${otherName}! 🎉 I'm thrilled to match with you! Your background in ${otherInterests.slice(0, 2).join(' and ')} is exactly what I'm looking for. Let's connect soon!`
            };
            
            res.json({ suggestion: templates[tone] || templates.professional });
        }
    );
});

module.exports = router;