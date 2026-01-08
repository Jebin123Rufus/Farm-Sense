require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');

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

app.use(express.static('.'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

// API Route to get all cows data as JSON
app.get('/api/cows', async (req, res) => {
  console.log('API /api/cows called');
  try {
    const cows = await Cow.find({});
    console.log('Found cows:', cows.length);
    res.json(cows);
  } catch (err) {
    console.error('Error fetching cows:', err);
    res.status(500).json({ error: err.message });
  }
});

// Route to display all cows data (HTML table)
app.get('/cows', async (req, res) => {
  try {
    const cows = await Cow.find({});
    let html = `
      <html>
        <head>
          <title>Farm Sense - Cows Data</title>
          <style>
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
          </style>
        </head>
        <body>
          <h1>Cows Data from FarmSense Database</h1>
          <table>
            <tr>
              <th>Cow ID</th>
              <th>Reproductive Stage</th>
              <th>Last AI Date</th>
              <th>Days Since AI</th>
              <th>Postpartum Days</th>
              <th>Pregnancy Status</th>
              <th>Temperature (°C)</th>
              <th>Heart Rate (BPM)</th>
              <th>Respiration (BPM)</th>
              <th>Activity Level</th>
              <th>Milk Yield (Liters)</th>
              <th>Estrus Detected</th>
              <th>Health Condition</th>
              <th>Alert Level</th>
            </tr>`;

    cows.forEach(cow => {
      html += `
            <tr>
              <td>${cow.cow_id || ''}</td>
              <td>${cow.reproductive_stage || ''}</td>
              <td>${cow.last_ai_date ? cow.last_ai_date.toDateString() : ''}</td>
              <td>${cow.days_since_ai || ''}</td>
              <td>${cow.postpartum_days || ''}</td>
              <td>${cow.pregnancy_status || ''}</td>
              <td>${cow.temperature_c || ''}</td>
              <td>${cow.heart_rate_bpm || ''}</td>
              <td>${cow.respiration_bpm || ''}</td>
              <td>${cow.activity_level || ''}</td>
              <td>${cow.milk_yield_liters || ''}</td>
              <td>${cow.estrus_detected ? 'Yes' : 'No'}</td>
              <td>${cow.health_condition || ''}</td>
              <td>${cow.alert_level || ''}</td>
            </tr>`;
    });

    html += `
          </table>
        </body>
      </html>`;
    res.send(html);
  } catch (err) {
    res.status(500).send('Error fetching cows data: ' + err.message);
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});