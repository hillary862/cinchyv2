const express = require('express');
const router = express.Router();
const { db } = require('../index');

// Get upcoming events
router.get('/', (req, res) => {
    db.all(
        `SELECT e.*, 
         (SELECT COUNT(*) FROM event_participants WHERE event_id = e.id AND role = 'mentor') as mentor_count,
         (SELECT COUNT(*) FROM event_participants WHERE event_id = e.id AND role = 'mentee') as mentee_count
         FROM events e 
         WHERE e.date_time > datetime('now')
         ORDER BY e.date_time ASC`,
        [],
        (err, events) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }
            res.json(events || []);
        }
    );
});

// Get event details
router.get('/:eventId', (req, res) => {
    const { eventId } = req.params;
    
    db.get(
        `SELECT e.*, 
         (SELECT COUNT(*) FROM event_participants WHERE event_id = e.id AND role = 'mentor') as mentor_count,
         (SELECT COUNT(*) FROM event_participants WHERE event_id = e.id AND role = 'mentee') as mentee_count
         FROM events e 
         WHERE e.id = ?`,
        [eventId],
        (err, event) => {
            if (err || !event) {
                return res.status(404).json({ error: 'Event not found' });
            }
            res.json(event);
        }
    );
});

// Join an event
router.post('/join', (req, res) => {
    const { eventId, userId, role } = req.body;
    
    // Check if spots available
    db.get(
        `SELECT * FROM events WHERE id = ?`,
        [eventId],
        (err, event) => {
            if (err || !event) {
                return res.status(404).json({ error: 'Event not found' });
            }
            
            const spotField = role === 'mentor' ? 'mentor_spots' : 'mentee_spots';
            const currentCount = role === 'mentor' ? event.mentor_count : event.mentee_count;
            
            if (currentCount >= event[spotField]) {
                return res.status(400).json({ error: 'No spots available' });
            }
            
            // Add participant
            db.run(
                `INSERT INTO event_participants (event_id, user_id, role) VALUES (?, ?, ?)`,
                [eventId, userId, role],
                function(err) {
                    if (err) {
                        return res.status(500).json({ error: 'Database error' });
                    }
                    res.json({ message: 'Joined event!', coupon: event.coupon_code });
                }
            );
        }
    );
});

// Create an event (admin only)
router.post('/create', (req, res) => {
    const { title, location, date_time, mentor_spots, mentee_spots, coupon_code } = req.body;
    
    db.run(
        `INSERT INTO events (title, location, date_time, mentor_spots, mentee_spots, coupon_code) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [title, location, date_time, mentor_spots, mentee_spots, coupon_code],
        function(err) {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }
            res.json({ message: 'Event created!', id: this.lastID });
        }
    );
});

module.exports = router;