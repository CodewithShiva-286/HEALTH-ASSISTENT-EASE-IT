const express = require('express');
const router = express.Router();
const multer = require('multer');
const Tesseract = require('tesseract.js');

// Configure Multer to store the uploaded file temporarily
const upload = multer({ dest: 'uploads/' });

router.post('/', upload.single('image'), async (req, res) => {
  try {
    // Use Tesseract to recognize text from the uploaded image
    const { data: { text } } = await Tesseract.recognize(req.file.path, 'eng');
    // Optionally, delete the file from 'uploads/' if not needed further
    res.json({ recognizedText: text });
  } catch (error) {
    console.error('OCR error:', error);
    res.status(500).json({ error: 'Failed to process image' });
  }
});

module.exports = router;
