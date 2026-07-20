// Store onboarding data (must be at top)
let onboardingData = {
    role: 'mentee',
    goal: '',
    personality: '',
    university: 'uoft',
    year: '',
    program: '',
    interests: [],
    meetingStyle: ''
};

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
    
    // Role selection
    roleButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            roleButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            onboardingData.role = btn.dataset.role;
        });
    });
    
    // Goal selection
    goalButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            goalButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            onboardingData.goal = btn.dataset.goal;
        });
    });
    
    // Personality selection
    personalityButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            personalityButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            onboardingData.personality = btn.dataset.personality;
        });
    });
    
    // Form submission - show additional questions modal
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        if (!onboardingData.goal || !onboardingData.personality) {
            alert('Please select a goal and personality!');
            return;
        }
        
        // Show additional questions modal
        document.getElementById('additionalQuestionsModal').classList.add('active');
    });
}

// Additional questions modal handling
function setupAdditionalQuestions() {
    const modal = document.getElementById('additionalQuestionsModal');
    const skipBtn = document.getElementById('skipBtn');
    const continueBtn = document.getElementById('continueBtn');
    const closeModal = document.getElementById('closeAdditional');
    
    // Get form elements
    const yearButtons = document.querySelectorAll('.year-btn');
    const industryButtons = document.querySelectorAll('.industry-btn');
    const passionButtons = document.querySelectorAll('.passion-btn');
    const meetingButtons = document.querySelectorAll('.meeting-btn');
    const programInput = document.getElementById('program');
    
    let selectedYear = '';
    let selectedIndustries = [];
    let selectedPassions = [];
    let selectedMeeting = '';
    
    // Year selection
    yearButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            yearButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedYear = btn.dataset.year;
        });
    });
    
    // Industry selection (multiple)
    industryButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            btn.classList.toggle('active');
            const industry = btn.dataset.industry;
            if (btn.classList.contains('active')) {
                selectedIndustries.push(industry);
            } else {
                selectedIndustries = selectedIndustries.filter(i => i !== industry);
            }
        });
    });
    
    // Passion selection (multiple)
    passionButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            btn.classList.toggle('active');
            const passion = btn.dataset.passion;
            if (btn.classList.contains('active')) {
                selectedPassions.push(passion);
            } else {
                selectedPassions = selectedPassions.filter(i => i !== passion);
            }
        });
    });
    
    // Meeting style selection
    meetingButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            meetingButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedMeeting = btn.dataset.meeting;
        });
    });
    
    // Close modal handlers
    skipBtn.addEventListener('click', () => {
        // Store data even when skipping
        onboardingData.year = selectedYear;
        onboardingData.program = programInput.value;
        onboardingData.interests = [...selectedIndustries, ...selectedPassions];
        onboardingData.meetingStyle = selectedMeeting;
        onboardingData.university = document.getElementById('university').value;
        
        modal.classList.remove('active');
        showMatch();
    });
    
    closeModal.addEventListener('click', () => {
        modal.classList.remove('active');
    });
    
    continueBtn.addEventListener('click', () => {
        // Store data
        onboardingData.year = selectedYear;
        onboardingData.program = programInput.value;
        onboardingData.interests = [...selectedIndustries, ...selectedPassions];
        onboardingData.meetingStyle = selectedMeeting;
        onboardingData.university = document.getElementById('university').value;
        
        modal.classList.remove('active');
        showMatch();
    });
}

// Show match result
async function showMatch() {
    // First, find a match via API
    try {
        const response = await fetch('/api/match/find', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: 0, // Will be created after profile
                interests: onboardingData.interests,
                goals: [onboardingData.goal]
            })
        });
        
        const matches = await response.json();
        
        if (matches && matches.length > 0) {
            const match = matches[0];
            document.getElementById('onboarding').style.display = 'none';
            document.getElementById('matchResult').style.display = 'block';
            
            document.getElementById('matchName').textContent = match.name;
            document.getElementById('matchInfo').textContent = `Mentor • ${match.university} • ${match.program}`;
            document.getElementById('matchScore').textContent = `${Math.round(match.match_score)}%`;
            
            // Store match data for later profile creation
            window.pendingMatch = match;
        } else {
            // No match found, show profile creation anyway
            document.getElementById('onboarding').style.display = 'none';
            document.getElementById('matchResult').style.display = 'block';
            document.getElementById('matchName').textContent = 'Finding your match...';
            document.getElementById('matchInfo').textContent = 'Complete your profile to get matched!';
            document.getElementById('matchScore').textContent = '0%';
        }
    } catch (error) {
        console.error('Error finding match:', error);
        // Show match result anyway with placeholder
        document.getElementById('onboarding').style.display = 'none';
        document.getElementById('matchResult').style.display = 'block';
        document.getElementById('matchName').textContent = 'Your Match';
        document.getElementById('matchInfo').textContent = 'Complete your profile to connect!';
    }
}

// Show profile creation modal after match
function showProfileCreation() {
    document.getElementById('profileCreationModal').classList.add('active');
}

// Profile creation handling
function setupProfileCreation() {
    const modal = document.getElementById('profileCreationModal');
    const createProfileBtn = document.getElementById('createProfileBtn');
    const closeModal = document.getElementById('closeProfileCreation');
    
    // Open profile creation when clicking "Start Chatting"
    const openChatBtn = document.getElementById('openChat');
    if (openChatBtn) {
        openChatBtn.addEventListener('click', (e) => {
            e.preventDefault();
            showProfileCreation();
        });
    }
    
    // Close modal
    closeModal.addEventListener('click', () => modal.classList.remove('active'));
    
    // Create profile (demo mode - just redirect to dashboard)
    createProfileBtn.addEventListener('click', async () => {
        const name = document.getElementById('profileName').value;
        const email = document.getElementById('profileEmail').value;
        
        if (!name || !email) {
            alert('Please fill in name and email!');
            return;
        }
        
        // Demo mode: Generate a demo user ID and store profile data
        const demoUserId = Date.now(); // Use timestamp as demo ID
        localStorage.setItem('userId', demoUserId);
        localStorage.setItem('userName', name);
        localStorage.setItem('userEmail', email);
        localStorage.setItem('userRole', onboardingData.role);
        localStorage.setItem('userUniversity', onboardingData.university);
        localStorage.setItem('userProgram', onboardingData.program);
        localStorage.setItem('userYear', onboardingData.year);
        localStorage.setItem('userInterests', JSON.stringify(onboardingData.interests));
        
        // Close profile modal
        modal.classList.remove('active');
        
        // Redirect to dashboard
        window.location.href = 'dashboard.html';
    });
}

// Chat modal handling
function setupChat() {
    const chatModal = document.getElementById('chatModal');
    const closeChatModal = document.getElementById('closeChat');
    const sendBtn = document.getElementById('sendBtn');
    const messageInput = document.getElementById('messageInput');
    
    // Close chat modal
    closeChatModal.addEventListener('click', () => {
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
    setupAdditionalQuestions();
    setupProfileCreation();
    setupChat();
});
