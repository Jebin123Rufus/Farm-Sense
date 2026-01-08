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

function createCowCard(cow) {
    const card = document.createElement('div');
    card.className = 'cow-card';

    const alertClass = getAlertClass(cow.alert_level);

    card.innerHTML = `
        <div class="card-header">
            <div class="cow-id">Cow ${cow.cow_id || 'N/A'}</div>
        </div>
        <div class="essential-info">
            <div class="info-item">
                <div class="info-label">Health</div>
                <div class="info-value">${cow.health_condition || 'N/A'}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Alert</div>
                <div class="info-value ${alertClass}">${cow.alert_level || 'N/A'}</div>
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
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'modal-overlay';

    modalOverlay.innerHTML = `
        <div class="modal-content">
            <button class="close-button">&times;</button>
            <div class="modal-header">
                <div class="modal-cow-id">Cow ${cow.cow_id || 'N/A'} - Full Details</div>
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

// Load cows data when page loads
loadCows();

// Refresh data every 30 seconds
setInterval(loadCows, 30000);