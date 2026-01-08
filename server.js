require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

const uri = process.env.MONGODB_URI;

mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('Connected to MongoDB successfully');
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
  });

// Define Cow Schema
const cowSchema = new mongoose.Schema({
  cow_id: String,
  reproductive_stage: String,
  last_ai_date: Date,
  days_since_ai: Number,
  postpartum_days: Number,
  pregnancy_status: String,
  temperature_c: Number,
  heart_rate_bpm: Number,
  respiration_bpm: Number,
  activity_level: String,
  milk_yield_liters: Number,
  estrus_detected: Boolean,
  health_condition: String,
  alert_level: String
});

const Cow = mongoose.model('Cow', cowSchema);

app.use(cors());

// API Route to get all cows data as JSON
app.get('/api/cows', async (req, res) => {
  console.log('API /api/cows called');
  try {
    const cows = await Cow.find({});
    res.json(cows);
  } catch (err) {
    console.error('Error fetching cows:', err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});