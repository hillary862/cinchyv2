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

// Onboarding form handling
function setupOnboarding() {
    const form = document.getElementById('onboardingForm');
    const roleButtons = document.querySelectorAll('.role-btn');
    const goalButtons = document.querySelectorAll('.goal-btn');
    const personalityButtons = document.querySelectorAll('.personality-btn');
    
    let selectedRole = 'mentee';
    let selectedGoal = '';
    let selectedPersonality = '';
    
    // Role selection
    roleButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            roleButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedRole = btn.dataset.role;
        });
    });
    
    // Goal selection
    goalButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            goalButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedGoal = btn.dataset.goal;
        });
    });
    
    // Personality selection
    personalityButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            personalityButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedPersonality = btn.dataset.personality;
        });
    });
    
    // Form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!selectedGoal || !selectedPersonality) {
            alert('Please select a goal and personality!');
            return;
        }
        
        // Simulate instant matching
        const matchData = {
            name: selectedRole === 'mentee' ? 'Alex Johnson' : 'Sarah Chen',
            role: selectedRole === 'mentee' ? 'mentor' : 'mentee',
            university: 'University of Toronto',
            program: 'Computer Science',
            year: '2018',
            matchScore: 92,
            interests: ['Career Growth', 'Networking', 'Work-Life Balance']
        };
        
        showMatch(matchData);
    });
}

// Show match result
function showMatch(match) {
    document.getElementById('onboarding').style.display = 'none';
    document.getElementById('matchResult').style.display = 'block';
    
    document.getElementById('matchName').textContent = match.name;
    document.getElementById('matchInfo').textContent = `${match.role === 'mentor' ? 'Mentor' : 'Mentee'} • ${match.university} • ${match.program}`;
    document.getElementById('matchScore').textContent = `${match.matchScore}%`;
}

// Chat modal handling
function setupChat() {
    const chatModal = document.getElementById('chatModal');
    const openChatBtn = document.getElementById('openChat');
    const closeModal = document.querySelector('.close-modal');
    const sendBtn = document.getElementById('sendBtn');
    const messageInput = document.getElementById('messageInput');
    
    openChatBtn.addEventListener('click', () => {
        chatModal.classList.add('active');
        document.getElementById('chatWithName').textContent = document.getElementById('matchName').textContent;
    });
    
    closeModal.addEventListener('click', () => {
        chatModal.classList.remove('active');
    });
    
    sendBtn.addEventListener('click', () => {
        const message = messageInput.value.trim();
        if (message) {
            addMessage(message, 'me');
            messageInput.value = '';
            
            // Simulate reply
            setTimeout(() => {
                addMessage("Thanks for reaching out! I'd love to chat about your goals. When are you free for a coffee chat?", 'other');
            }, 1000);
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
    setupOnboarding();
    setupChat();
});