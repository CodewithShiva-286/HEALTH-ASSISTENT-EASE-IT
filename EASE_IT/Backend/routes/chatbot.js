// Backend/routes/chatbot.js

const express = require('express');
const router = express.Router();

// This route accepts POST requests containing OCR text (and optionally healthData)
// and returns a simulated chatbot response. Later, replace the simulation with an API call to an AI service.
router.post('/', async (req, res) => {
  const { text, healthData } = req.body;
  try {
    // For demonstration purposes, we create a simulated response.
    // In the future, you can integrate with an AI API (like OpenAI's GPT-4) here.
    const simulatedResponse = `Based on the ingredients: "${text}" and your health profile, it is recommended to opt for a balanced diet with low allergens.`;
    res.json({ reply: simulatedResponse });
  } catch (error) {
    console.error("Chatbot error:", error);
    res.status(500).json({ error: "Failed to generate chatbot response" });
  }
});

module.exports = router;
