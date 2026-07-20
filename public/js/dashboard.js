// Create starfield background
function createStarfield() {
    const starfield = document.getElementById('starfield');
    const starCount = 100;
    
    for (let i = 0; i < starCount; i++) {
        const star = document.createElement('div');
        star.classList.add('star');
        
        const x = Math.random() * 100;
        const y = Math.random() * 100;
        const size = Math.random() * 3;
        const duration = 1 + Math.random() * 3;
        
        star.style.left = `${x}%`;
        star.style.top = `${y}%`;
        star.style.width = `${size}px`;
        star.style.height = `${size}px`;
        star.style.setProperty('--twinkle-duration', `${duration}s`);
        
        starfield.appendChild(star);
    }
}

// Get user ID from localStorage or URL
function getUserId() {
    return localStorage.getItem('userId') || '1';
}

// Get user data from localStorage (demo mode)
function getDemoUserData() {
    return {
        id: localStorage.getItem('userId') || '1',
        name: localStorage.getItem('userName') || 'Demo User',
        email: localStorage.getItem('userEmail') || 'demo@example.com',
        role: localStorage.getItem('userRole') || 'mentee',
        university: localStorage.getItem('userUniversity') || 'uoft',
        program: localStorage.getItem('userProgram') || 'Computer Science',
        year_graduated: localStorage.getItem('userYear') || '2',
        interests: JSON.parse(localStorage.getItem('userInterests') || '["Technology", "Networking"]')
    };
}

// Fetch user data and display
async function loadDashboard() {
    const userId = getUserId();
    
    try {
        // Try to fetch from API first
        const response = await fetch(`/api/dashboard/${userId}`);
        
        if (response.ok) {
            const data = await response.json();
            
            if (data.user) {
                displayUserProfile(data.user);
            }
            
            if (data.currentMatch) {
                displayCurrentMatch(data.currentMatch);
            }
            
            // Fetch match history
            const matchesResponse = await fetch(`/api/dashboard/${userId}/matches`);
            const matches = await matchesResponse.json();
            displayMatchHistory(matches);
            
            // Fetch user events
            const eventsResponse = await fetch(`/api/dashboard/${userId}/events`);
            const events = await eventsResponse.json();
            displayUserEvents(events);
        } else {
            // Use demo data if API fails
            loadDemoData();
        }
    } catch (error) {
        console.error('Error loading dashboard, using demo data:', error);
        loadDemoData();
    }
}

// Load demo data for demonstration
function loadDemoData() {
    const user = getDemoUserData();
    displayUserProfile(user);
    
    // Show demo match
    const demoMatch = {
        id: 1,
        mentor_id: 100,
        mentee_id: user.id,
        match_score: 85,
        mentor_name: 'Alex Johnson',
        mentor_university: 'University of Toronto',
        mentor_program: 'Computer Science'
    };
    displayCurrentMatch(demoMatch);
    
    // Show demo match history
    const demoMatches = [
        {
            id: 1,
            mentor_id: 100,
            mentee_id: user.id,
            match_score: 85,
            mentor_name: 'Alex Johnson',
            mentor_university: 'University of Toronto'
        }
    ];
    displayMatchHistory(demoMatches);
    
    // Show demo events
    const demoEvents = [
        {
            id: 1,
            title: 'Coffee Chat Meetup',
            location: 'Starbucks Downtown',
            date_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            participant_role: 'mentee'
        }
    ];
    displayUserEvents(demoEvents);
}

// Display user profile
function displayUserProfile(user) {
    document.getElementById('userName').textContent = user.name || 'User';
    document.getElementById('userEmail').textContent = user.email || '-';
    document.getElementById('userUniversity').textContent = user.university || '-';
    document.getElementById('userProgram').textContent = user.program || '-';
    document.getElementById('userYear').textContent = getYearLabel(user.year_graduated);
    document.getElementById('userRole').textContent = user.role || '-';
    
    // Display interests as tags
    const interestsContainer = document.getElementById('userInterests');
    interestsContainer.innerHTML = '';
    if (user.interests && user.interests.length > 0) {
        user.interests.forEach(interest => {
            const tag = document.createElement('span');
            tag.className = 'tag';
            tag.textContent = interest;
            interestsContainer.appendChild(tag);
        });
    } else {
        interestsContainer.innerHTML = '<span class="tag">No interests set</span>';
    }
}

// Get year label
function getYearLabel(year) {
    const labels = {
        '1': '1st Year',
        '2': '2nd Year',
        '3': '3rd Year',
        '4': '4th Year',
        'grad': 'Graduate',
        'alumni': 'Alumni'
    };
    return labels[year] || year || '-';
}

// Display current match
function displayCurrentMatch(match) {
    const noMatchMessage = document.getElementById('noMatchMessage');
    const matchDetails = document.getElementById('matchDetails');
    
    if (match) {
        noMatchMessage.style.display = 'none';
        matchDetails.style.display = 'block';
        
        const isMentor = match.mentor_id == getUserId();
        const otherName = isMentor ? match.mentee_name : match.mentor_name;
        const otherUniversity = isMentor ? match.mentee_university : match.mentor_university;
        const otherProgram = isMentor ? match.mentee_program : match.mentor_program;
        
        document.getElementById('matchName').textContent = otherName;
        document.getElementById('matchInfo').textContent = `${isMentor ? 'Mentee' : 'Mentor'} • ${otherUniversity} • ${otherProgram}`;
        document.getElementById('matchScore').textContent = `${Math.round(match.match_score)}%`;
        
        // Store match ID for chat
        window.currentMatchId = match.id;
    } else {
        noMatchMessage.style.display = 'block';
        matchDetails.style.display = 'none';
    }
}

// Display match history
function displayMatchHistory(matches) {
    const container = document.getElementById('matchesList');
    
    if (!matches || matches.length === 0) {
        container.innerHTML = '<p class="no-data">No match history yet. Start matching to build your network!</p>';
        return;
    }
    
    container.innerHTML = '';
    matches.forEach(match => {
        const isMentor = match.mentor_id == getUserId();
        const otherName = isMentor ? match.mentee_name : match.mentor_name;
        const otherUniversity = isMentor ? match.mentee_university : match.mentor_university;
        
        const matchEl = document.createElement('div');
        matchEl.className = 'match-history-item';
        matchEl.innerHTML = `
            <div class="match-history-info">
                <h4>${otherName}</h4>
                <p>${isMentor ? 'Mentee' : 'Mentor'} • ${otherUniversity}</p>
            </div>
            <div class="match-history-score">
                <span>${Math.round(match.match_score)}% Match</span>
            </div>
        `;
        container.appendChild(matchEl);
    });
}

// Display user events
function displayUserEvents(events) {
    const container = document.getElementById('eventsList');
    
    if (!events || events.length === 0) {
        container.innerHTML = '<p class="no-data">No events joined yet. Check out upcoming events!</p>';
        return;
    }
    
    container.innerHTML = '';
    events.forEach(event => {
        const eventDate = new Date(event.date_time);
        const formattedDate = eventDate.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
            year: 'numeric'
        });
        
        const eventEl = document.createElement('div');
        eventEl.className = 'event-item';
        eventEl.innerHTML = `
            <div class="event-info">
                <h4>${event.title}</h4>
                <p><i class="fas fa-map-marker-alt"></i> ${event.location}</p>
                <p><i class="fas fa-calendar"></i> ${formattedDate}</p>
            </div>
            <div class="event-role">
                <span class="tag ${event.participant_role}">${event.participant_role === 'mentor' ? 'Mentor' : 'Mentee'}</span>
            </div>
        `;
        container.appendChild(eventEl);
    });
}

// Edit profile modal handling
function setupEditProfile() {
    const modal = document.getElementById('editProfileModal');
    const editBtn = document.getElementById('editProfileBtn');
    const closeModal = document.getElementById('closeEditProfile');
    const cancelBtn = document.getElementById('cancelEdit');
    const saveBtn = document.getElementById('saveProfile');
    
    // Open modal
    editBtn.addEventListener('click', () => {
        // Load current values
        const userId = getUserId();
        fetch(`/api/dashboard/${userId}`)
            .then(res => res.json())
            .then(data => {
                if (data.user) {
                    document.getElementById('editName').value = data.user.name || '';
                    document.getElementById('editUniversity').value = data.user.university || 'uoft';
                    document.getElementById('editProgram').value = data.user.program || '';
                    document.getElementById('editYear').value = data.user.year_graduated || '1';
                    document.getElementById('editInterests').value = data.user.interests ? data.user.interests.join(', ') : '';
                }
            });
        modal.classList.add('active');
    });
    
    // Close modal
    closeModal.addEventListener('click', () => modal.classList.remove('active'));
    cancelBtn.addEventListener('click', () => modal.classList.remove('active'));
    
    // Save profile
    saveBtn.addEventListener('click', async () => {
        const userId = getUserId();
        const interests = document.getElementById('editInterests').value
            .split(',')
            .map(i => i.trim())
            .filter(i => i);
        
        const profileData = {
            name: document.getElementById('editName').value,
            university: document.getElementById('editUniversity').value,
            program: document.getElementById('editProgram').value,
            year_graduated: document.getElementById('editYear').value,
            interests: interests
        };
        
        try {
            const response = await fetch(`/api/dashboard/${userId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(profileData)
            });
            
            if (response.ok) {
                modal.classList.remove('active');
                loadDashboard(); // Refresh dashboard
            }
        } catch (error) {
            console.error('Error updating profile:', error);
        }
    });
}

// Chat modal handling
function setupChat() {
    const chatModal = document.getElementById('chatModal');
    const openChatBtn = document.getElementById('openChatFromDashboard');
    const closeModal = document.getElementById('closeChat');
    const sendBtn = document.getElementById('sendBtn');
    const messageInput = document.getElementById('messageInput');
    
    if (openChatBtn) {
        openChatBtn.addEventListener('click', () => {
            chatModal.classList.add('active');
            document.getElementById('chatWithName').textContent = document.getElementById('matchName').textContent;
        });
    }
    
    closeModal.addEventListener('click', () => chatModal.classList.remove('active'));
    
    sendBtn.addEventListener('click', () => {
        const message = messageInput.value.trim();
        if (message && window.currentMatchId) {
            addMessage(message, 'me');
            messageInput.value = '';
            
            // Send to server
            fetch('/api/chat/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    matchId: window.currentMatchId,
                    senderId: getUserId(),
                    message: message
                })
            });
        }
    });
}

// Add message to chat
function addMessage(text, sender) {
    const messagesContainer = document.getElementById('chatMessages');
    const messageEl = document.createElement('div');
    messageEl.className = `message ${sender}`;
    messageEl.innerHTML = `<p>${text}</p>`;
    messagesContainer.appendChild(messageEl);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    createStarfield();
    loadDashboard();
    setupEditProfile();
    setupChat();
});