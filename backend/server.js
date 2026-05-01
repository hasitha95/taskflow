// Import required packages
const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Create the Express app
const app = express();

// Middleware
app.use(cors());              // Allow cross-origin requests (mobile app → backend)
app.use(express.json());      // Parse JSON request bodies

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'TaskFlow API is running' });
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});