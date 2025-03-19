const uploadBtn = document.querySelector('#upload-btn');
const uploadInput = document.querySelector('#upload-input');
const scanResult = document.querySelector('#scanResult');

uploadBtn.addEventListener('click', () => {
    uploadInput.click();
});

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

async function recognizeText(imageSrc) {
    scanResult.innerHTML = '<p class="text-gray-500 text-center">Processing...</p>';

    try {
        const { data: { text } } = await Tesseract.recognize(imageSrc, 'eng');

        // Extract only the ingredients
        const ingredients = extractIngredients(text);

        // Display extracted ingredients or fallback message
        scanResult.innerHTML = ingredients 
            ? `<p class="text-green-600 font-semibold">Ingredients Detected:</p><p>${ingredients}</p>` 
            : '<p class="text-red-500 text-center">No ingredients recognized.</p>';

    } catch (err) {
        scanResult.innerHTML = `<p class="text-red-500">Error: ${err}</p>`;
    }
}

/**
 * Extracts ingredients from OCR text by looking for an "ingredients" header.
 * Assumes that the list starts right after "Ingredients" and stops at another section like "Directions" or "Method".
 */
function extractIngredients(text) {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line);
    let startIndex = lines.findIndex(line => line.toLowerCase().includes("ingredients"));

    if (startIndex === -1) return ""; // No "ingredients" found

    let ingredientsList = [];
    for (let i = startIndex + 1; i < lines.length; i++) {
        const lowerLine = lines[i].toLowerCase();
        if (lowerLine.includes("directions") || lowerLine.includes("method") || lowerLine.includes("instructions")) {
            break; // Stop at next section
        }
        ingredientsList.push(lines[i]);
    }

    return ingredientsList.length > 0 ? ingredientsList.join('<br>') : "";
}




