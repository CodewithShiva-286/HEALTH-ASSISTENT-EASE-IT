const API_KEY = 'AIzaSyC65f2H9lZYCtkBG7PYbFDyDpaZkuX8HNU';  
const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent';

const chatMessages = document.getElementById('chat-messages');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');

// Assume these variables are provided by your server after scanning the image.
const healthConditions = "Lactose Intolerance, Type 2 Diabetes"; 
const recognizedText = `INGREDIENTS: 55
Rice: Basmati Rice 
Hyderabadi Biryani Paste: Onion, Refined Sunflower Oil, Curd, Tomatoes, Green Chili, Ginger, Iodized Salt, Garlic, Coriander, Garam Masala Seasoning, Coriander Powder, Flavor Enhancer (INS 627, INS 631), Cumin Seed, Keoza Water, Spices And Condiments.
Spices: Cinnamon Stick, Green Cardamom, Bay Leaf, Clove, Black Pepper.
Buzani Raita Seasoning: Maltodextrin, Spices & Condiments, Cumin Powder, Chilli Powder, Coriander Powder, Ginger Powder, Sugar, Iodized Salt, Black Salt, Dehydrated Onion Powder, Dehydrated Garlic Powder, Hydrolyzed Vegetable Protein (Soya), Dried Mango Powder, Anticaking Agent (INS 551), Dehydrated Parsley, Cumin Extract, Flavor Enhancer (INS 627, INS 631), Natural Coloring Agent (INS 160).`;

// Store chat history to provide context for follow-up questions
let chatHistory = [];

async function generateResponse(prompt) {
    const response = await fetch(`${API_URL}?key=${API_KEY}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            contents: [
                {
                    parts: [
                        { text: prompt }
                    ]
                }
            ]
        })
    });

    if (!response.ok) {
        throw new Error('Failed to generate response');
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
}

function cleanMarkdown(text) {
    return text
        .replace(/#{1,6}\s?/g, '')
        .replace(/\*\*/g, '')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}

function addMessage(message, isUser) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', isUser ? 'user-message' : 'bot-message');

    const profileImage = document.createElement('img');
    profileImage.classList.add('profile-image');
    profileImage.src = isUser ? 'user.jpg' : 'bot.jpg';
    profileImage.alt = isUser ? 'User' : 'Bot';

    const messageContent = document.createElement('div');
    messageContent.classList.add('message-content');
    messageContent.textContent = message;

    messageElement.appendChild(profileImage);
    messageElement.appendChild(messageContent);
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

async function displayInitialAnalysis() {
    const analysisPrompt = `🍽️ **Food Compatibility Check!** 🔍  

Hey there, **health detective**! 🕵️‍♂️✨ Let’s investigate if this food is a **perfect match** for your health or a **red flag** 🚨.  

📌 **Your Health Conditions:** 🏥 ${healthConditions}  
🍛 **Scanned Ingredients:** 📸 ${recognizedText}  

🔥 **Mission: Food Investigation!** 🔎  
1️⃣ **✅ Safe or ❌ Not Safe?** – Can you enjoy this meal guilt-free? (Yes/No)  
2️⃣ **🚀 Quick Verdict!** – A **snappy two-line summary** on whether to **dig in or dodge**!  
3️⃣ **⚠️ Danger Zone!** – If No, which ingredients might cause trouble and why?  

💡 **Remember:** Healthy eating is all about making the right choices! Let’s crack the case! 🥗🔍`;

    try {
        addMessage("🤖 Generating analysis... 🍽️", false);
        const analysisResponse = await generateResponse(analysisPrompt);
        const cleanResponse = cleanMarkdown(analysisResponse);

        chatHistory.push({ role: "bot", message: cleanResponse }); // Store bot response
        addMessage(cleanResponse, false);
    } catch (error) {
        console.error('Error:', error);
        addMessage('🚨 Oops! Something went wrong while analyzing. Please try again later. 🤖', false);
    }
}

// Handles user follow-up questions with context.
async function handleUserInput() {
    const userMessage = userInput.value.trim();
    if (userMessage) {
        addMessage(userMessage, true);
        chatHistory.push({ role: "user", message: userMessage }); // Store user input

        userInput.value = '';
        sendButton.disabled = true;
        userInput.disabled = true;

        try {
            // Build a conversation-aware prompt
            let historyContext = chatHistory.map(entry => `${entry.role}: ${entry.message}`).join("\n");
            const contextPrompt = `Here is the conversation so far:\n${historyContext}\nUser Question: ${userMessage}\nProvide a response considering previous interactions.`;

            const botMessage = await generateResponse(contextPrompt);
            const cleanResponse = cleanMarkdown(botMessage);

            chatHistory.push({ role: "bot", message: cleanResponse }); // Store bot response
            addMessage(cleanResponse, false);
        } catch (error) {
            console.error('Error:', error);
            addMessage('🚨 Oops! I ran into an issue. Please try again! 🤖', false);
        } finally {
            sendButton.disabled = false;
            userInput.disabled = false;
            userInput.focus();
        }
    }
}

sendButton.addEventListener('click', handleUserInput);
userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleUserInput();
    }
});

// Run the initial analysis as soon as the page loads.
window.addEventListener('load', displayInitialAnalysis);
