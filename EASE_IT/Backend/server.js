// Load environment variables from .env file
require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const path = require('path');

// Import API routes
const authRoutes = require('./routes/auth');
const healthDataRoutes = require('./routes/healthdata');
const chatbotRoutes = require('./routes/chatbot'); // New OCR Chatbot route

const app = express();
const PORT = process.env.PORT || 3000;
const DB_URI = process.env.DB_URI;

// Middleware to parse JSON bodies
app.use(express.json());

// Connect to MongoDB using the URI from .env
mongoose.connect(DB_URI)
  .then(() => console.log('Connected to MongoDB!'))
  .catch((err) => console.error('Failed to connect to MongoDB:', err));

// Serve static frontend files from the "public" folder
app.use(express.static(path.join(__dirname, '../public')));

// Default route: Serve the landing page (index.html)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/html/index.html'));
});

// Mount API routes for authentication, health data, and chatbot
app.use('/api/auth', authRoutes);
app.use('/api/healthdata', healthDataRoutes);
app.use('/api/chatbot', chatbotRoutes);

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

