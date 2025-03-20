// ocr.js
const uploadBtn = document.querySelector('#upload-btn');
const uploadInput = document.querySelector('#upload-input');
const scanResult = document.querySelector('#scanResult');

// Update the health condition summary in the Update Health Data card
function updateHealthSummary() {
    const healthSummary = document.getElementById('healthDataSummary');
    const healthConditions = localStorage.getItem('healthConditions') || "No health data available";
    healthSummary.innerHTML = `<p class="text-gray-600">Your health conditions: ${healthConditions}</p>`;
}
updateHealthSummary();

// When user clicks "Analyze Food", ask whether to use camera or file upload
uploadBtn.addEventListener('click', () => {
    const useCamera = confirm("Do you want to use the camera? Click OK for camera, Cancel to upload a file.");
    if (useCamera) {
        openCamera();
    } else {
        uploadInput.click();
    }
});

// Handle file upload
uploadInput.addEventListener('change', (ev) => {
    const file = ev.target.files[0];
    if (!file) {
        alert('Please select an image.');
        return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
        recognizeText(e.target.result);
    };
    reader.readAsDataURL(file);
});

// Camera capture functionality
function openCamera() {
    // Create a video element for preview
    const video = document.createElement('video');
    video.setAttribute("autoplay", "");
    video.setAttribute("playsinline", "");
    video.style.width = "100%";
    video.style.maxWidth = "300px";
    document.body.appendChild(video);

    // Create a button to capture the photo
    const captureButton = document.createElement('button');
    captureButton.textContent = "Capture Photo";
    captureButton.style.display = "block";
    captureButton.style.margin = "10px auto";
    document.body.appendChild(captureButton);

    // Request camera access
    navigator.mediaDevices.getUserMedia({ video: true })
    .then(stream => {
        video.srcObject = stream;
        captureButton.addEventListener('click', () => {
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const context = canvas.getContext('2d');
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            // Stop the video stream
            stream.getTracks().forEach(track => track.stop());
            // Remove video and button from DOM
            video.remove();
            captureButton.remove();
            // Process captured image
            const imageData = canvas.toDataURL('image/png');
            recognizeText(imageData);
        });
    })
    .catch(err => {
        alert("Camera not available: " + err);
        video.remove();
        captureButton.remove();
    });
}

// Main OCR and analysis function
async function recognizeText(imageSrc) {
    // Show a loading indicator
    scanResult.innerHTML = '<p class="text-gray-500 text-center">Processing... ⏳</p>';
    try {
        // Perform OCR with Tesseract.js
        const { data: { text } } = await Tesseract.recognize(imageSrc, 'eng');
        const ingredients = extractIngredients(text);
        if (!ingredients) {
            scanResult.innerHTML = '<p class="text-red-500 text-center">No ingredients recognized.</p>';
            return;
        }
        // Use stored health conditions (or default) for now
        const healthConditions = localStorage.getItem('healthConditions') || "Hypertension, Diabetes";
        
        // Build Gemini prompt with newline formatting instructions
        const analysisPrompt = `User Health Conditions: ${healthConditions}
Scanned Ingredients: ${ingredients}

Please generate a response in the following format (each line should start on a new line):
Line 1: A straightforward answer ("Yes" or "No") with an emoji.
Line 2: If the answer is Yes, provide a funny joke or phrase with emojis.
        If the answer is No, provide a 2-3 line explanation (with emojis) describing why the meal is not safe.
Line 3: List all harmful ingredients in the product with a warning emoji (e.g., ⚠️) before each.
`;
        // Show temporary loading message
        scanResult.innerHTML = '<p class="text-gray-500 text-center">Generating analysis... 🚀</p>';
        const analysisResponse = await generateChatbotResponse(analysisPrompt);
        
        // Convert newline characters to HTML breaks
        const formattedResponse = analysisResponse.replace(/\n/g, '<br>');
        
        // Display the analysis and make it clickable for redirection
        scanResult.innerHTML = `<div id="analysisResult" style="cursor:pointer;">${formattedResponse}</div>`;
        document.getElementById('analysisResult').addEventListener('click', function() {
            window.location.href = `chatbot.html?ingredients=${encodeURIComponent(ingredients)}&health=${encodeURIComponent(healthConditions)}&result=${encodeURIComponent(analysisResponse)}`;
        });
    } catch (err) {
        scanResult.innerHTML = `<p class="text-red-500">Error: ${err}</p>`;
    }
}

// Simple function to extract ingredients from OCR text
function extractIngredients(text) {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line);
    let startIndex = lines.findIndex(line => line.toLowerCase().includes("ingredients"));
    if (startIndex === -1) return "";
    let ingredientsList = [];
    for (let i = startIndex + 1; i < lines.length; i++) {
        const lowerLine = lines[i].toLowerCase();
        if (lowerLine.includes("directions") || lowerLine.includes("method") || lowerLine.includes("instructions")) {
            break;
        }
        ingredientsList.push(lines[i]);
    }
    return ingredientsList.length > 0 ? ingredientsList.join(', ') : "";
}

// Call Gemini API to generate the analysis response
async function generateChatbotResponse(prompt) {
    const API_KEY = '';
    const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent';
    
    const response = await fetch(`${API_URL}?key=${API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
        })
    });
    if (!response.ok) {
        throw new Error('Failed to generate response');
    }
    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
}

