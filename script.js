// Store previous critical cow IDs to detect new critical conditions
let previousCriticalCows = new Set();

async function loadCows() {
    try {
        const response = await fetch('http://localhost:3000/api/cows');
        const cows = await response.json();

        const container = document.getElementById('cows-container');
        container.innerHTML = '';

        if (cows.length === 0) {
            container.innerHTML = '<div class="error">No cow data found in the database.</div>';
            return;
        }

        // Check for newly critical cows and show alerts
        const currentCriticalCows = new Set();
        cows.forEach(cow => {
            if (cow.is_critical) {
                currentCriticalCows.add(cow.cow_id);
            }
        });

        // Find cows that became critical this update
        const newlyCriticalCows = cows.filter(cow =>
            cow.is_critical && !previousCriticalCows.has(cow.cow_id)
        );

        // Show alert for newly critical cows
        newlyCriticalCows.forEach(cow => {
            showCriticalAlert(cow);
        });

        // Update previous critical cows
        previousCriticalCows = currentCriticalCows;

        const grid = document.createElement('div');
        grid.className = 'cows-grid';

        cows.forEach(cow => {
            const card = createCowCard(cow);
            grid.appendChild(card);
        });

        container.appendChild(grid);
    } catch (error) {
        document.getElementById('cows-container').innerHTML =
            '<div class="error">Error loading cow data: ' + error.message + '</div>';
    }
}

// Auto-refresh function
function startAutoRefresh() {
    // Load data immediately
    loadCows();

    // Set up periodic refresh every 5 seconds (matching simulation interval)
    setInterval(loadCows, 500);
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', startAutoRefresh);

function createCowCard(cow) {
    const card = document.createElement('div');
    card.className = 'cow-card';

    // Determine alert level based on alerts
    let alertLevel = 'Normal';
    let alertClass = 'alert-low';
    if (cow.alerts && cow.alerts.length > 0) {
        const highestSeverity = cow.alerts.reduce((max, alert) => {
            const severityOrder = { 'danger': 3, 'warning': 2, 'info': 1, 'success': 0 };
            return severityOrder[alert.severity] > severityOrder[max] ? alert.severity : max;
        }, 'success');

        switch(highestSeverity) {
            case 'danger': alertLevel = 'Critical'; alertClass = 'alert-high'; break;
            case 'warning': alertLevel = 'Warning'; alertClass = 'alert-medium'; break;
            case 'info': alertLevel = 'Info'; alertClass = 'alert-low'; break;
            case 'success': alertLevel = 'Normal'; alertClass = 'alert-low'; break;
        }
    }

    // Create alerts HTML
    let alertsHtml = '';
    if (cow.alerts && cow.alerts.length > 0) {
        alertsHtml = '<div class="alerts-section">';
        cow.alerts.forEach(alert => {
            alertsHtml += `<div class="alert alert-${alert.severity}">${alert.message}</div>`;
        });
        alertsHtml += '</div>';
    }

    card.innerHTML = `
        <div class="card-header">
            <div class="cow-id">Cow ${cow.cow_id || 'N/A'}</div>
            ${alertsHtml}
        </div>
        <div class="essential-info">
            <div class="info-item">
                <div class="info-label">Health</div>
                <div class="info-value">${cow.health_condition || 'N/A'}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Alert</div>
                <div class="info-value ${alertClass}">${alertLevel}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Milk Yield</div>
                <div class="info-value">${cow.milk_yield_liters || 0} L</div>
            </div>
            <div class="info-item">
                <div class="info-label">Temperature</div>
                <div class="info-value">${cow.temperature_c || 0}°C</div>
            </div>
        </div>
    `;

    card.addEventListener('click', () => {
        showCowModal(cow);
    });

    return card;
}

function getAlertClass(alertLevel) {
    if (!alertLevel) return '';
    const level = alertLevel.toLowerCase();
    if (level.includes('high') || level.includes('critical')) return 'alert-high';
    if (level.includes('medium') || level.includes('warning')) return 'alert-medium';
    return 'alert-low';
}

function showCowModal(cow) {
    // Create alerts HTML for modal
    let modalAlertsHtml = '';
    if (cow.alerts && cow.alerts.length > 0) {
        modalAlertsHtml = '<div class="modal-alerts-section"><h3>Active Alerts</h3>';
        cow.alerts.forEach(alert => {
            modalAlertsHtml += `<div class="alert alert-${alert.severity}">${alert.message}</div>`;
        });
        modalAlertsHtml += '</div>';
    }

    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'modal-overlay';

    modalOverlay.innerHTML = `
        <div class="modal-content">
            <button class="close-button">&times;</button>
            <div class="modal-header">
                <div class="modal-cow-id">Cow ${cow.cow_id || 'N/A'} - Full Details</div>
                ${modalAlertsHtml}
            </div>
            <div class="details-grid">
                <div class="detail-item">
                    <div class="detail-label">Reproductive Stage</div>
                    <div class="detail-value">${cow.reproductive_stage || 'N/A'}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Last AI Date</div>
                    <div class="detail-value">${cow.last_ai_date ? new Date(cow.last_ai_date).toLocaleDateString() : 'N/A'}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Days Since AI</div>
                    <div class="detail-value">${cow.days_since_ai || 'N/A'}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Postpartum Days</div>
                    <div class="detail-value">${cow.postpartum_days || 'N/A'}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Pregnancy Status</div>
                    <div class="detail-value">${cow.pregnancy_status || 'N/A'}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Heart Rate</div>
                    <div class="detail-value">${cow.heart_rate_bpm || 'N/A'} BPM</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Respiration</div>
                    <div class="detail-value">${cow.respiration_bpm || 'N/A'} BPM</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Activity Level</div>
                    <div class="detail-value">${cow.activity_level || 'N/A'}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Estrus Detected</div>
                    <div class="detail-value">${cow.estrus_detected ? 'Yes' : 'No'}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Health Condition</div>
                    <div class="detail-value">${cow.health_condition || 'N/A'}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Alert Level</div>
                    <div class="detail-value">${cow.alert_level || 'N/A'}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Milk Yield</div>
                    <div class="detail-value">${cow.milk_yield_liters || 0} L</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Temperature</div>
                    <div class="detail-value">${cow.temperature_c || 0}°C</div>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modalOverlay);

    const closeButton = modalOverlay.querySelector('.close-button');
    closeButton.addEventListener('click', () => {
        document.body.removeChild(modalOverlay);
    });

    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
            document.body.removeChild(modalOverlay);
        }
    });
}

// Function to show critical alert popup
function showCriticalAlert(cow) {
    // Remove any existing critical alerts
    const existingAlerts = document.querySelectorAll('.critical-alert-overlay');
    existingAlerts.forEach(alert => document.body.removeChild(alert));

    // Create critical alert overlay
    const alertOverlay = document.createElement('div');
    alertOverlay.className = 'critical-alert-overlay';

    alertOverlay.innerHTML = `
        <div class="critical-alert-content">
            <div class="critical-alert-header">
                <div class="alert-icon">🚨</div>
                <h2>CRITICAL CONDITION ALERT</h2>
            </div>
            <div class="critical-alert-body">
                <p><strong>Cow ${cow.cow_id}</strong> is in critical condition and requires immediate attention!</p>
                <div class="critical-details">
                    <div class="detail-row">
                        <span class="detail-label">Temperature:</span>
                        <span class="detail-value critical-temp">${cow.temperature_c}°C</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Heart Rate:</span>
                        <span class="detail-value">${cow.heart_rate_bpm} BPM</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Current Status:</span>
                        <span class="detail-value critical-status">CRITICAL</span>
                    </div>
                </div>
                <p class="urgent-message">⚠️ URGENT: Immediate veterinary treatment required!</p>
            </div>
            <div class="critical-alert-actions">
                <button class="acknowledge-btn">Acknowledge & View Details</button>
                <button class="dismiss-btn">Dismiss</button>
            </div>
        </div>
    `;

    document.body.appendChild(alertOverlay);

    // Add event listeners
    const acknowledgeBtn = alertOverlay.querySelector('.acknowledge-btn');
    const dismissBtn = alertOverlay.querySelector('.dismiss-btn');

    acknowledgeBtn.addEventListener('click', () => {
        document.body.removeChild(alertOverlay);
        showCowModal(cow);
    });

    dismissBtn.addEventListener('click', () => {
        document.body.removeChild(alertOverlay);
    });

    // Auto-dismiss after 10 seconds
    setTimeout(() => {
        if (document.body.contains(alertOverlay)) {
            document.body.removeChild(alertOverlay);
        }
    }, 10000);
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', startAutoRefresh);