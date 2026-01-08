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
app.use(express.static('.')); // Serve static files from current directory

// API Route to get all cows data as JSON
app.get('/api/cows', async (req, res) => {
  console.log('API /api/cows called');
  try {
    const cows = await Cow.find({});
    // Add alert logic to each cow
    const cowsWithAlerts = cows.map(cow => {
      const alerts = determineAlerts(cow);
      return {
        ...cow.toObject(),
        alerts: alerts
      };
    });
    res.json(cowsWithAlerts);
  } catch (err) {
    console.error('Error fetching cows:', err);
    res.status(500).json({ error: err.message });
  }
});

// Function to determine alerts based on conditions
function determineAlerts(cow) {
  const alerts = [];

  // Pregnancy Confirmed: days_since_ai >= 45 AND estrus_detected = false
  if (cow.days_since_ai >= 45 && cow.estrus_detected === false) {
    alerts.push({
      type: 'pregnancy_confirmed',
      message: 'Pregnancy Confirmed',
      severity: 'success'
    });
  }

  // Illness Detected: temperature_c >= 40 OR heart_rate_bpm >= 100
  if (cow.temperature_c >= 40 || cow.heart_rate_bpm >= 100) {
    alerts.push({
      type: 'illness_detected',
      message: 'Illness Detected',
      severity: 'danger'
    });
  }

  // Postpartum Stage: pregnancy_status = "delivered" AND postpartum_days >= 0
  if (cow.pregnancy_status === 'delivered' && cow.postpartum_days >= 0) {
    alerts.push({
      type: 'postpartum_stage',
      message: 'Postpartum Stage',
      severity: 'info'
    });
  }

  // Postpartum Infection Suspected: postpartum_days <= 10 AND temperature_c >= 40
  if (cow.postpartum_days <= 10 && cow.temperature_c >= 40) {
    alerts.push({
      type: 'postpartum_infection',
      message: 'Postpartum Infection Suspected',
      severity: 'warning'
    });
  }

  // Pregnancy Failure Suspected: days_since_ai >= 21 AND estrus_detected = true
  if (cow.days_since_ai >= 21 && cow.estrus_detected === true) {
    alerts.push({
      type: 'pregnancy_failure',
      message: 'Pregnancy Failure Suspected',
      severity: 'warning'
    });
  }

  return alerts;
}

// Simulation function to update cow data periodically
async function simulateCowDataUpdates() {
  try {
    const cows = await Cow.find({});

    for (const cow of cows) {
      // Simulate slight changes in vital signs
      const temperatureChange = (Math.random() - 0.5) * 2; // -1 to +1 degree
      const heartRateChange = Math.floor((Math.random() - 0.5) * 10); // -5 to +5 bpm
      const respirationChange = Math.floor((Math.random() - 0.5) * 4); // -2 to +2 bpm

      // Update temperature (keep within realistic ranges)
      let newTemperature = cow.temperature_c + temperatureChange;
      newTemperature = Math.max(36.5, Math.min(42.0, newTemperature));

      // Update heart rate (keep within realistic ranges)
      let newHeartRate = cow.heart_rate_bpm + heartRateChange;
      newHeartRate = Math.max(40, Math.min(120, newHeartRate));

      // Update respiration rate
      let newRespiration = cow.respiration_bpm + respirationChange;
      newRespiration = Math.max(15, Math.min(40, newRespiration));

      // Simulate estrus detection changes (randomly)
      const estrusChange = Math.random() < 0.05; // 5% chance to change
      let newEstrusDetected = cow.estrus_detected;
      if (estrusChange) {
        newEstrusDetected = !cow.estrus_detected;
      }

      // Update days_since_ai (increment slowly)
      let newDaysSinceAI = cow.days_since_ai;
      if (Math.random() < 0.1) { // 10% chance to increment
        newDaysSinceAI += 1;
      }

      // Update postpartum_days if applicable
      let newPostpartumDays = cow.postpartum_days;
      if (cow.pregnancy_status === 'delivered' && Math.random() < 0.1) {
        newPostpartumDays += 1;
      }

      // Update milk yield (slight variations)
      const milkYieldChange = (Math.random() - 0.5) * 2;
      let newMilkYield = cow.milk_yield_liters + milkYieldChange;
      newMilkYield = Math.max(0, Math.min(50, newMilkYield));

      // Update activity level randomly
      const activityLevels = ['Low', 'Medium', 'High'];
      const newActivityLevel = activityLevels[Math.floor(Math.random() * activityLevels.length)];

      // Update the cow document
      await Cow.findByIdAndUpdate(cow._id, {
        temperature_c: parseFloat(newTemperature.toFixed(1)),
        heart_rate_bpm: newHeartRate,
        respiration_bpm: newRespiration,
        estrus_detected: newEstrusDetected,
        days_since_ai: newDaysSinceAI,
        postpartum_days: newPostpartumDays,
        milk_yield_liters: parseFloat(newMilkYield.toFixed(1)),
        activity_level: newActivityLevel,
        last_updated: new Date()
      });
    }

    console.log(`Simulated data updates for ${cows.length} cows at ${new Date().toISOString()}`);
  } catch (error) {
    console.error('Error in simulation:', error);
  }
}

// Start simulation - update every 30 seconds
setInterval(simulateCowDataUpdates, 30000);

// Initial simulation run
simulateCowDataUpdates();

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});