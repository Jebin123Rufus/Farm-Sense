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

// Critical cow tracking - persists for 1 hour minimum
let currentCriticalCow = {
  cowId: null,
  startTime: null,
  duration: 60 * 60 * 1000 // 1 hour in milliseconds
};

app.use(cors());
app.use(express.static('.')); // Serve static files from current directory

// API Route to get all cows data as JSON
app.get('/api/cows', async (req, res) => {
  console.log('API /api/cows called');
  try {
    const cows = await Cow.find({});

    // Check if we have an active critical cow that hasn't expired
    const now = Date.now();
    let criticalCowId = null;

    if (currentCriticalCow.cowId && (now - currentCriticalCow.startTime) < currentCriticalCow.duration) {
      // Keep the current critical cow active
      criticalCowId = currentCriticalCow.cowId;
      console.log(`Keeping cow ${criticalCowId} critical (active for ${(now - currentCriticalCow.startTime) / 1000}s)`);
    } else {
      // Find cows that meet critical condition (temperature >= 40 OR heart_rate >= 100)
      const criticalCandidates = cows.filter(cow => cow.temperature_c >= 40 || cow.heart_rate_bpm >= 100);

      if (criticalCandidates.length > 0) {
        // Randomly select one cow to be critical
        const randomIndex = Math.floor(Math.random() * criticalCandidates.length);
        criticalCowId = criticalCandidates[randomIndex]._id.toString();

        // Update the critical cow tracking
        currentCriticalCow.cowId = criticalCowId;
        currentCriticalCow.startTime = now;

        console.log(`New critical cow selected: ${criticalCowId} (will remain critical for 1 hour)`);
      } else if (currentCriticalCow.cowId) {
        // No candidates but we had a critical cow - clear it
        console.log(`Clearing critical cow ${currentCriticalCow.cowId} - no candidates found`);
        currentCriticalCow.cowId = null;
        currentCriticalCow.startTime = null;
      }
    }

    // Add alert logic to each cow
    const cowsWithAlerts = cows.map(cow => {
      const alerts = determineAlerts(cow, criticalCowId);
      return {
        ...cow.toObject(),
        alerts: alerts,
        is_critical: cow._id.toString() === criticalCowId
      };
    });
    res.json(cowsWithAlerts);
  } catch (err) {
    console.error('Error fetching cows:', err);
    res.status(500).json({ error: err.message });
  }
});

// Function to determine alerts based on conditions
function determineAlerts(cow, criticalCowId = null) {
  const alerts = [];

  // Pregnancy Confirmed: days_since_ai >= 45 AND estrus_detected = false
  if (cow.days_since_ai >= 45 && cow.estrus_detected === false) {
    alerts.push({
      type: 'pregnancy_confirmed',
      message: 'Pregnancy Confirmed',
      severity: 'success'
    });
  }

  // Illness Detected: Only for the randomly selected critical cow
  if (cow._id.toString() === criticalCowId) {
    alerts.push({
      type: 'critical_illness',
      message: 'CRITICAL CONDITION - Urgent Treatment Required!',
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

    // Select 7 random cows to keep completely normal (no changes)
    const normalCowIndices = new Set();
    while (normalCowIndices.size < Math.min(7, cows.length)) {
      normalCowIndices.add(Math.floor(Math.random() * cows.length));
    }

    for (let i = 0; i < cows.length; i++) {
      const cow = cows[i];

      // Skip updating the 7 normal cows completely
      if (normalCowIndices.has(i)) {
        continue;
      }

      // For non-normal cows, only change temperature
      const temperatureChange = (Math.random() - 0.5) * 2; // -1 to +1 degree
      let newTemperature = cow.temperature_c + temperatureChange;
      newTemperature = Math.max(36.5, Math.min(42.0, newTemperature));

      // Update only temperature for these cows
      await Cow.findByIdAndUpdate(cow._id, {
        temperature_c: parseFloat(newTemperature.toFixed(1)),
        last_updated: new Date()
      });
    }

    console.log(`Simulated data updates for ${cows.length} cows at ${new Date().toISOString()}`);
  } catch (error) {
    console.error('Error in simulation:', error);
  }
}

// Start simulation - update every 5 seconds
setInterval(simulateCowDataUpdates, 500);

// Initial simulation run
simulateCowDataUpdates();

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});