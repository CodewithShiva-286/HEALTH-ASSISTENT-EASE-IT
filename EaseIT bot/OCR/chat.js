const API_KEY = '';
const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent';

const chatMessages = document.getElementById('chat-messages');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');
const homeButton = document.getElementById('home-button');

const urlParams = new URLSearchParams(window.location.search);
const ingredients = urlParams.get('ingredients') || "No ingredients scanned";
const healthConditions = urlParams.get('health') || "No health conditions provided";
const initialResult = urlParams.get('result');

let chatHistory = [];

const PERSONALITY_PROMPT = `You are FoodieFriend - a cheerful food safety assistant with these traits:
1. Always positive and encouraging
2. Uses emojis tastefully (1-2 per message)
3. Remembers user's health conditions
4. Gives personalized food advice
5. Tells short food-related jokes when asked
6. Uses friendly greetings and farewells
7. Shows genuine interest in user's well-being

Health Conditions: ${healthConditions}
Scanned Ingredients: ${ingredients}

Respond to non-food questions with:
"I'm your food buddy! 🥗 Let's talk about nutrition, recipes, or food safety. Ask me anything food-related or say 'joke' for a yummy joke!"`;

const CASUAL_RESPONSES = {
    greetings: ["hi", "hello", "hey", "howdy", "hola", "what's up", "sup"],
    responses: [
        "👋 Hello food explorer! Ready for a culinary adventure?",
        "🍎 Hi there! Let's talk about healthy eating!",
        "🥑 Hey friend! Got any food questions for me?",
        "🍝 Howdy! What's cooking in your mind?",
        "🥗 Hola! Ready to explore some nutritious ideas?",
        "🍕 Hey there! Hungry for some food wisdom?"
    ]
};

function isCasualGreeting(message) {
    return CASUAL_RESPONSES.greetings.includes(message.toLowerCase());
}

async function generateResponse(prompt) {
    try {
        const fullPrompt = `${PERSONALITY_PROMPT}\n\n${formatHistory()}\nUser: ${prompt}\nFoodieFriend:`;
        
        const response = await fetch(`${API_URL}?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: fullPrompt }] }]
            })
        });

        if (!response.ok) throw new Error('API request failed');
        const data = await response.json();
        
        if (!data?.candidates?.[0]?.content?.parts?.[0]?.text) {
            return "🍳 Oops! My kitchen timer went off. Let's try that again!";
        }
        
        return formatResponse(data.candidates[0].content.parts[0].text);
    } catch (error) {
        console.error('Error:', error);
        return "🚨 Oops, my circuits are hungry! Let's try that again?";
    }
}

function formatResponse(text) {
    const greetings = ['Bonjour', 'Hola', 'Namaste', 'Konnichiwa'];
    const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];
    return text
        .replace(/^/, `${randomGreeting}, food explorer! 🌟\n`)
        .replace(/\n/g, '\n🍴 ')
        .replace(/joke time/gi, 'Joke time! 🥁')
        .replace(/warning/gi, '⚠️ Heads up:');
}

function formatHistory() {
    return chatHistory.slice(-4).map(entry => 
        `${entry.role === 'user' ? 'You' : 'FoodieFriend'}: ${entry.message}`
    ).join('\n');
}

function addMessage(message, isUser) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', isUser ? 'user-message' : 'bot-message');
    messageElement.innerHTML = message.replace(/\n/g, '<br>');
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

async function displayInitialAnalysis() {
    addMessage("🍴 Welcome to your personalized food journey!", false);
    
    // Show stored scan results if available
    if (initialResult) {
        addMessage("📋 Previous Scan Analysis:", false);
        addMessage(initialResult.replace(/\n/g, '<br>'), false);
        chatHistory.push(
            { role: 'system', message: PERSONALITY_PROMPT },
            { role: 'assistant', message: initialResult }
        );
    } else {
        try {
            const analysisResponse = await generateResponse(
                `Analyze these ingredients for ${healthConditions} and give 1 friendly tip`
            );
            addMessage(analysisResponse, false);
            chatHistory.push({ role: 'assistant', message: analysisResponse });
        } catch (error) {
            addMessage('🚨 Let\'s start fresh! Ask me anything food-related!', false);
        }
    }
    
    // Add random joke after initial message
    setTimeout(async () => {
        try {
            const jokeResponse = await generateResponse("Tell me a food joke");
            addMessage(jokeResponse, false);
            chatHistory.push({ role: 'assistant', message: jokeResponse });
        } catch (error) {
            console.log('Joke request failed silently');
        }
    }, 1500);
}

async function handleUserInput() {
    const message = userInput.value.trim();
    if (!message) return;

    addMessage(message, true);
    chatHistory.push({ role: 'user', message });
    userInput.value = '';
    sendButton.disabled = true;

    try {
        let response;
        if (isCasualGreeting(message)) {
            response = CASUAL_RESPONSES.responses[
                Math.floor(Math.random() * CASUAL_RESPONSES.responses.length)
            ];
        } else {
            response = await generateResponse(message);
        }
        
        addMessage(response, false);
        chatHistory.push({ role: 'assistant', message: response });
    } catch (error) {
        addMessage("🚨 My recipe book fell! Let's try again?", false);
    } finally {
        sendButton.disabled = false;
    }
}

homeButton.addEventListener('click', () => {
    window.location.href = 'home.html';
});

sendButton.addEventListener('click', handleUserInput);
userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleUserInput();
    }
});

window.addEventListener('load', () => {
    window.history.replaceState({}, document.title, window.location.pathname);
    displayInitialAnalysis();
});