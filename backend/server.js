const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const userRoutes = require('./routes/userRoutes');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'TaskFlow API is running' });
});

app.use('/api/users', userRoutes);

const PORT = process.env.PORT || 5000;

connectDB();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});