const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express(); // ✅ MUST exist

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const authRoutes = require('./routes/userRoutes');
const seekageRoutes = require('./routes/seekage');

app.use('/api/auth', authRoutes);
app.use('/api/groups', seekageRoutes);

// Static
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Test route
app.get('/', (req, res) => {
  res.json({ status: 'SEEKAGE API running' });
});

module.exports = app; // ✅ MUST export
