/* ── EcoTrack Frontend Application ─────────────────────────────────────────── */

// ─── State ────────────────────────────────────────────────────────────────────
let currentUser = null;
let demoMode = false;
let trendChart = null;
let categoryChart = null;

// ─── Activity Definitions ─────────────────────────────────────────────────────
const ACTIVITIES = {
    transport: [
        { key: 'car_petrol_km', label: 'Car (Petrol)', unit: 'km', factor: 0.21 },
        { key: 'car_diesel_km', label: 'Car (Diesel)', unit: 'km', factor: 0.17 },
        { key: 'car_electric_km', label: 'Car (Electric)', unit: 'km', factor: 0.05 },
        { key: 'bus_km', label: 'Bus', unit: 'km', factor: 0.089 },
        { key: 'train_km', label: 'Train', unit: 'km', factor: 0.041 },
        { key: 'flight_domestic_km', label: 'Domestic Flight', unit: 'km', factor: 0.255 },
        { key: 'flight_international_km', label: 'International Flight', unit: 'km', factor: 0.195 },
        { key: 'motorcycle_km', label: 'Motorcycle', unit: 'km', factor: 0.114 },
        { key: 'bicycle_km', label: 'Bicycle', unit: 'km', factor: 0.0 },
        { key: 'walking_km', label: 'Walking', unit: 'km', factor: 0.0 },
    ],
    energy: [
        { key: 'electricity_kwh', label: 'Electricity', unit: 'kWh', factor: 0.233 },
        { key: 'natural_gas_kwh', label: 'Natural Gas', unit: 'kWh', factor: 0.203 },
        { key: 'lpg_kg', label: 'LPG', unit: 'kg', factor: 1.51 },
        { key: 'coal_kg', label: 'Coal', unit: 'kg', factor: 2.42 },
    ],
    food: [
        { key: 'meat_meal', label: 'Meat-Based Meal', unit: 'meals', factor: 3.3 },
        { key: 'vegetarian_meal', label: 'Vegetarian Meal', unit: 'meals', factor: 1.0 },
        { key: 'vegan_meal', label: 'Vegan Meal', unit: 'meals', factor: 0.5 },
        { key: 'beef_kg', label: 'Beef', unit: 'kg', factor: 27.0 },
        { key: 'chicken_kg', label: 'Chicken', unit: 'kg', factor: 6.9 },
        { key: 'dairy_kg', label: 'Dairy', unit: 'kg', factor: 3.2 },
    ],
    shopping: [
        { key: 'clothing_item', label: 'Clothing Item', unit: 'items', factor: 10.0 },
        { key: 'electronics_device', label: 'Electronics', unit: 'devices', factor: 70.0 },
        { key: 'furniture_item', label: 'Furniture', unit: 'items', factor: 45.0 },
        { key: 'online_order', label: 'Online Order', unit: 'orders', factor: 0.5 },
    ],
    waste: [
        { key: 'general_waste_kg', label: 'General Waste', unit: 'kg', factor: 0.57 },
        { key: 'recycled_kg', label: 'Recycled', unit: 'kg', factor: -0.2 },
        { key: 'composted_kg', label: 'Composted', unit: 'kg', factor: -0.1 },
    ],
};

const CATEGORY_ICONS = {
    transport: 'fa-car',
    energy: 'fa-bolt',
    food: 'fa-utensils',
    shopping: 'fa-bag-shopping',
    waste: 'fa-recycle',
};

const CATEGORY_COLORS = {
    transport: '#3b82f6',
    energy: '#f59e0b',
    food: '#22d3a5',
    shopping: '#a855f7',
    waste: '#2dd4bf',
};

// ─── Demo Data ────────────────────────────────────────────────────────────────
const DEMO_DASHBOARD = {
    monthly_total: 142.5,
    by_category: { transport: 52.3, energy: 38.7, food: 33.1, shopping: 12.4, waste: 6.0 },
    trend: [
        { date: 'Mon', value: 18.2 },
        { date: 'Tue', value: 22.5 },
        { date: 'Wed', value: 15.8 },
        { date: 'Thu', value: 20.1 },
        { date: 'Fri', value: 25.4 },
        { date: 'Sat', value: 19.7 },
        { date: 'Sun', value: 12.3 },
    ],
    recent: [
        { category: 'transport', activity: 'car_petrol_km', emission_kg: 8.4, date: 'Jun 15' },
        { category: 'food', activity: 'meat_meal', emission_kg: 6.6, date: 'Jun 15' },
        { category: 'energy', activity: 'electricity_kwh', emission_kg: 4.66, date: 'Jun 14' },
        { category: 'shopping', activity: 'online_order', emission_kg: 1.5, date: 'Jun 14' },
        { category: 'waste', activity: 'general_waste_kg', emission_kg: 2.85, date: 'Jun 13' },
    ],
    badges: [
        { name: 'First Step', icon: '🌱', desc: 'Logged your first activity!' },
        { name: 'Eco Warrior', icon: '⚔️', desc: 'Logged 30 activities' },
    ],
    active_challenges: [
        { id: 1, title: 'Meatless Monday', icon: 'fa-carrot', days_left: 3 },
        { id: 2, title: 'Public Transit Pioneer', icon: 'fa-bus', days_left: 5 },
    ],
    points: 320,
    level: 2,
    baseline: 180,
    saved_co2: 37.5,
    trees_equivalent: 1.8,
};

// ─── Init ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    updateLogActivities();
    updateQuickModalActivities();
    checkAuth();
});

function setupEventListeners() {
    // Auth
    document.getElementById('btn-login').addEventListener('click', handleLogin);
    document.getElementById('btn-register').addEventListener('click', handleRegister);
    document.getElementById('btn-demo').addEventListener('click', enterDemoMode);
    document.getElementById('btn-logout').addEventListener('click', handleLogout);
    document.getElementById('go-register').addEventListener('click', (e) => { e.preventDefault(); toggleAuthForms('register'); });
    document.getElementById('go-login').addEventListener('click', (e) => { e.preventDefault(); toggleAuthForms('login'); });

    // Enter key on auth inputs
    document.getElementById('login-password').addEventListener('keydown', (e) => { if (e.key === 'Enter') handleLogin(); });
    document.getElementById('reg-password').addEventListener('keydown', (e) => { if (e.key === 'Enter') handleRegister(); });

    // Nav
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            switchTab(item.dataset.tab);
        });
    });

    // Sidebar toggle
    document.getElementById('sidebar-toggle').addEventListener('click', () => {
        document.getElementById('sidebar').classList.toggle('open');
    });

    // Close sidebar on main click (mobile)
    document.querySelector('.main-content').addEventListener('click', () => {
        document.getElementById('sidebar').classList.remove('open');
    });

    // Calculator
    document.getElementById('btn-calculate').addEventListener('click', runCalculator);

    // Logger
    document.getElementById('btn-log-activity').addEventListener('click', logActivity);
    document.getElementById('log-quantity').addEventListener('input', updateLogPreview);

    // Quick Modal
    document.getElementById('btn-log-quick').addEventListener('click', () => toggleModal('quick-modal', true));
    document.getElementById('close-quick-modal').addEventListener('click', () => toggleModal('quick-modal', false));
    document.getElementById('btn-qm-log').addEventListener('click', quickLogActivity);

    // Challenge filter
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            filterChallenges(btn.dataset.filter);
        });
    });
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
async function checkAuth() {
    try {
        const res = await fetch('/api/me');
        const data = await res.json();
        if (data.logged_in) {
            currentUser = data.user;
            enterApp();
        }
    } catch (e) {
        // Not logged in - stay on auth screen
    }
}

function toggleAuthForms(which) {
    const login = document.getElementById('login-form');
    const register = document.getElementById('register-form');
    if (which === 'register') {
        login.classList.add('hidden');
        register.classList.remove('hidden');
    } else {
        register.classList.add('hidden');
        login.classList.remove('hidden');
    }
}

async function handleLogin() {
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const errEl = document.getElementById('login-error');
    errEl.classList.add('hidden');

    if (!email || !password) { errEl.textContent = 'Please fill in all fields.'; errEl.classList.remove('hidden'); return; }

    try {
        const res = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (data.success) {
            currentUser = data.user;
            enterApp();
        } else {
            errEl.textContent = data.message || 'Invalid credentials.';
            errEl.classList.remove('hidden');
        }
    } catch (e) {
        errEl.textContent = 'Server error. Please try again.';
        errEl.classList.remove('hidden');
    }
}

async function handleRegister() {
    const name = document.getElementById('reg-name').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;
    const errEl = document.getElementById('reg-error');
    errEl.classList.add('hidden');

    if (!name || !email || !password) { errEl.textContent = 'Please fill in all fields.'; errEl.classList.remove('hidden'); return; }
    if (password.length < 4) { errEl.textContent = 'Password must be at least 4 characters.'; errEl.classList.remove('hidden'); return; }

    try {
        const res = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });
        const data = await res.json();
        if (data.success) {
            currentUser = data.user;
            enterApp();
        } else {
            errEl.textContent = data.message || 'Registration failed.';
            errEl.classList.remove('hidden');
        }
    } catch (e) {
        errEl.textContent = 'Server error. Please try again.';
        errEl.classList.remove('hidden');
    }
}

function enterDemoMode() {
    demoMode = true;
    currentUser = { id: 0, name: 'Demo User', email: 'demo@ecotrack.io', points: 320, level: 2 };
    enterApp();
}

async function handleLogout() {
    if (!demoMode) {
        try { await fetch('/api/logout', { method: 'POST' }); } catch (e) {}
    }
    demoMode = false;
    currentUser = null;
    document.getElementById('app').classList.add('hidden');
    document.getElementById('auth-overlay').classList.remove('hidden');
    // Clear auth fields
    document.getElementById('login-email').value = '';
    document.getElementById('login-password').value = '';
    document.getElementById('reg-name').value = '';
    document.getElementById('reg-email').value = '';
    document.getElementById('reg-password').value = '';
}

function enterApp() {
    document.getElementById('auth-overlay').classList.add('hidden');
    document.getElementById('app').classList.remove('hidden');
    updateSidebar();
    switchTab('dashboard');
}

function updateSidebar() {
    if (!currentUser) return;
    const initial = currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'E';
    document.getElementById('sidebar-avatar').textContent = initial;
    document.getElementById('sidebar-name').textContent = currentUser.name;
    document.getElementById('sidebar-level').textContent = `Level ${currentUser.level}`;
    document.getElementById('sidebar-points').textContent = currentUser.points;
    // Points bar: fill based on progress within current level (200 pts per level)
    const ptsInLevel = currentUser.points % 200;
    document.getElementById('sidebar-points-bar').style.width = `${(ptsInLevel / 200) * 100}%`;
}

// ─── Tab Navigation ───────────────────────────────────────────────────────────
const TAB_TITLES = {
    dashboard: ['Dashboard', 'Your sustainability command center'],
    calculator: ['Carbon Calculator', 'Estimate your monthly footprint'],
    logger: ['Action Logger', 'Track daily activities'],
    challenges: ['Challenges', 'Build sustainable habits'],
    offsets: ['Offset Carbon', 'Support green projects'],
    education: ['Learn', 'Climate education hub'],
    trees: ['Trees & CO₂', 'Discover the carbon absorption power of different trees'],
};

function switchTab(tab) {
    // Update nav active states
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    const navItem = document.querySelector(`.nav-item[data-tab="${tab}"]`);
    if (navItem) navItem.classList.add('active');

    // Show/hide tab content
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    const tabEl = document.getElementById(`tab-${tab}`);
    if (tabEl) tabEl.classList.add('active');

    // Update topbar title
    const [title, subtitle] = TAB_TITLES[tab] || ['EcoTrack', ''];
    document.getElementById('page-title').textContent = title;
    document.getElementById('page-subtitle').textContent = subtitle;

    // Load tab data
    if (tab === 'dashboard') loadDashboard();
    else if (tab === 'challenges') loadChallenges();
    else if (tab === 'offsets') loadOffsets();
    else if (tab === 'education') loadEducation();
    else if (tab === 'logger') loadLogger();
    else if (tab === 'trees') loadTrees();

    // Close sidebar on mobile
    document.getElementById('sidebar').classList.remove('open');
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
async function loadDashboard() {
    let data;
    if (demoMode) {
        data = DEMO_DASHBOARD;
    } else {
        try {
            const res = await fetch('/api/dashboard');
            data = await res.json();
            if (data.error) { showEmptyDashboard(); return; }
        } catch (e) { showEmptyDashboard(); return; }
    }

    // Update stats
    document.getElementById('stat-monthly').innerHTML = `${data.monthly_total} <small>kg CO₂</small>`;
    document.getElementById('stat-saved').innerHTML = `${data.saved_co2} <small>kg CO₂</small>`;
    document.getElementById('stat-trees').innerHTML = `${data.trees_equivalent} <small>trees</small>`;
    document.getElementById('stat-points').innerHTML = `${data.points} <small>pts</small>`;

    // Update topbar CO2
    document.getElementById('topbar-co2-value').textContent = `${data.monthly_total} kg`;

    // Update sidebar
    currentUser.points = data.points;
    currentUser.level = data.level;
    updateSidebar();

    // Render trend chart
    renderTrendChart(data.trend);

    // Render category chart
    renderCategoryChart(data.by_category, data.monthly_total);

    // Recent activity
    renderRecentActivity(data.recent);

    // Badges
    renderBadges(data.badges);

    // Active challenges strip
    renderActiveChallengesStrip(data.active_challenges);
}

function showEmptyDashboard() {
    document.getElementById('stat-monthly').innerHTML = `0 <small>kg CO₂</small>`;
    document.getElementById('stat-saved').innerHTML = `0 <small>kg CO₂</small>`;
    document.getElementById('stat-trees').innerHTML = `0 <small>trees</small>`;
    document.getElementById('stat-points').innerHTML = `0 <small>pts</small>`;
    document.getElementById('topbar-co2-value').textContent = `0 kg`;
}

function renderTrendChart(trend) {
    const ctx = document.getElementById('trend-chart');
    if (trendChart) trendChart.destroy();

    trendChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: trend.map(d => d.date),
            datasets: [{
                label: 'CO₂ (kg)',
                data: trend.map(d => d.value),
                borderColor: '#22d3a5',
                backgroundColor: 'rgba(34,211,165,0.08)',
                borderWidth: 2.5,
                fill: true,
                tension: 0.4,
                pointRadius: 5,
                pointBackgroundColor: '#22d3a5',
                pointBorderColor: '#111827',
                pointBorderWidth: 2,
                pointHoverRadius: 7,
            }],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#1a2332',
                    titleColor: '#f1f5f9',
                    bodyColor: '#94a3b8',
                    borderColor: 'rgba(34,211,165,0.3)',
                    borderWidth: 1,
                    padding: 12,
                    cornerRadius: 10,
                    displayColors: false,
                    callbacks: { label: (c) => `${c.raw} kg CO₂` }
                }
            },
            scales: {
                x: {
                    ticks: { color: '#475569', font: { family: 'Outfit', size: 11 } },
                    grid: { display: false },
                    border: { display: false },
                },
                y: {
                    ticks: { color: '#475569', font: { family: 'Outfit', size: 11 }, callback: (v) => `${v}` },
                    grid: { color: 'rgba(255,255,255,0.04)' },
                    border: { display: false },
                    beginAtZero: true,
                }
            },
        }
    });
}

function renderCategoryChart(byCategory, total) {
    const ctx = document.getElementById('category-chart');
    if (categoryChart) categoryChart.destroy();

    const labels = Object.keys(byCategory);
    const values = Object.values(byCategory);
    const colors = labels.map(l => CATEGORY_COLORS[l] || '#888');

    document.getElementById('donut-total').textContent = total;

    categoryChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels.map(l => l.charAt(0).toUpperCase() + l.slice(1)),
            datasets: [{
                data: values,
                backgroundColor: colors,
                borderColor: '#111827',
                borderWidth: 3,
                hoverOffset: 8,
            }],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '68%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: '#94a3b8', padding: 12, font: { family: 'Outfit', size: 11 }, usePointStyle: true, pointStyle: 'circle' },
                },
                tooltip: {
                    backgroundColor: '#1a2332',
                    titleColor: '#f1f5f9',
                    bodyColor: '#94a3b8',
                    borderColor: 'rgba(34,211,165,0.3)',
                    borderWidth: 1,
                    padding: 12,
                    cornerRadius: 10,
                    callbacks: { label: (c) => ` ${c.label}: ${c.raw} kg CO₂` }
                }
            }
        }
    });
}

function renderRecentActivity(recent) {
    const container = document.getElementById('recent-activity');
    if (!recent || recent.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="fa-solid fa-seedling"></i><p>No activity yet. Start logging!</p></div>';
        return;
    }
    container.innerHTML = recent.map(r => {
        const icon = CATEGORY_ICONS[r.category] || 'fa-circle';
        const label = formatActivityName(r.activity);
        return `
            <div class="activity-item">
                <div class="activity-icon cat-${r.category}"><i class="fa-solid ${icon}"></i></div>
                <div class="activity-text">
                    <div class="activity-name">${label}</div>
                    <div class="activity-date">${r.date}</div>
                </div>
                <div class="activity-co2">${r.emission_kg} kg</div>
            </div>`;
    }).join('');
}

function renderBadges(badges) {
    const container = document.getElementById('badges-grid');
    if (!badges || badges.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="fa-solid fa-award"></i><p>Complete actions to earn badges!</p></div>';
        return;
    }
    container.innerHTML = badges.map(b => `
        <div class="badge-card" title="${b.desc}">
            <div class="badge-emoji">${b.icon}</div>
            <div class="badge-name">${b.name}</div>
        </div>
    `).join('');
}

function renderActiveChallengesStrip(challenges) {
    const strip = document.getElementById('active-challenges-strip');
    const list = document.getElementById('active-challenges-list');
    if (!challenges || challenges.length === 0) {
        strip.classList.add('hidden');
        return;
    }
    strip.classList.remove('hidden');
    list.innerHTML = challenges.map(c => `
        <div class="strip-item">
            <i class="fa-solid ${c.icon}"></i>
            <span>${c.title}</span>
            <span style="color:var(--text-muted); margin-left:0.5rem;">${c.days_left}d left</span>
        </div>
    `).join('');
}

// ─── Calculator ───────────────────────────────────────────────────────────────
function calcNextStep(step) {
    // Hide all steps
    document.querySelectorAll('.calc-step').forEach(s => s.classList.add('hidden'));
    document.getElementById(`calc-step-${step}`).classList.remove('hidden');

    // Update progress indicators
    document.querySelectorAll('.progress-step').forEach(ps => {
        const s = parseInt(ps.dataset.step);
        ps.classList.remove('active', 'done');
        if (s === step) ps.classList.add('active');
        else if (s < step) ps.classList.add('done');
    });
}

async function runCalculator() {
    const payload = {
        transport: {
            car_km: parseVal('c-car-km'),
            fuel_type: document.getElementById('c-fuel-type').value,
            bus_km: parseVal('c-bus-km'),
            train_km: parseVal('c-train-km'),
            flight_domestic_km: parseVal('c-flight-dom') / 12,
            flight_international_km: parseVal('c-flight-int') / 12,
        },
        energy: {
            electricity_kwh: parseVal('c-elec-kwh'),
            natural_gas_kwh: parseVal('c-gas-kwh'),
        },
        food: {
            meat_meals: parseVal('c-meat-meals') * 4.33,
            vegetarian_meals: parseVal('c-veg-meals') * 4.33,
            vegan_meals: parseVal('c-vegan-meals') * 4.33,
        },
        shopping: {
            clothing_items: parseVal('c-clothing'),
            electronics: parseVal('c-electronics'),
            online_orders: parseVal('c-orders'),
        },
        waste: {
            general_kg: parseVal('c-waste-gen') * 4.33,
            recycled_kg: parseVal('c-waste-rec') * 4.33,
            composted_kg: parseVal('c-waste-comp') * 4.33,
        },
        save_baseline: document.getElementById('c-save-baseline').checked,
    };

    let result;
    if (demoMode) {
        // Simulate calculation locally
        result = simulateCalculation(payload);
    } else {
        try {
            const res = await fetch('/api/calculate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            result = await res.json();
        } catch (e) {
            result = simulateCalculation(payload);
        }
    }

    renderCalcResult(result);
}

function simulateCalculation(p) {
    const fuelFactors = { petrol: 0.21, diesel: 0.17, electric: 0.05 };
    const transport = (p.transport.car_km * (fuelFactors[p.transport.fuel_type] || 0.21)) +
        (p.transport.bus_km * 0.089) + (p.transport.train_km * 0.041) +
        (p.transport.flight_domestic_km * 0.255) + (p.transport.flight_international_km * 0.195);
    const energy = (p.energy.electricity_kwh * 0.233) + (p.energy.natural_gas_kwh * 0.203);
    const food = (p.food.meat_meals * 3.3) + (p.food.vegetarian_meals * 1.0) + (p.food.vegan_meals * 0.5);
    const shopping = (p.shopping.clothing_items * 10) + (p.shopping.electronics * 70) + (p.shopping.online_orders * 0.5);
    const waste = Math.max(0, (p.waste.general_kg * 0.57) + (p.waste.recycled_kg * -0.2) + (p.waste.composted_kg * -0.1));

    const breakdown = { transport: r2(transport), energy: r2(energy), food: r2(food), shopping: r2(shopping), waste: r2(waste) };
    const total = r2(transport + energy + food + shopping + waste);
    const recommendations = [];
    if (transport > 50) recommendations.push({ icon: 'fa-bus', title: 'Switch to Public Transit', impact: 'High', desc: 'Cut transport emissions by up to 60%.', color: 'blue' });
    if (food > 30) recommendations.push({ icon: 'fa-carrot', title: 'Reduce Meat Consumption', impact: 'High', desc: 'A plant-rich diet is a top climate action.', color: 'green' });
    if (energy > 40) recommendations.push({ icon: 'fa-solar-panel', title: 'Switch to Green Energy', impact: 'High', desc: 'Renewables cut household emissions drastically.', color: 'yellow' });
    if (shopping > 20) recommendations.push({ icon: 'fa-shirt', title: 'Buy Less, Choose Well', impact: 'Medium', desc: 'Repair and buy second-hand.', color: 'purple' });
    if (waste > 10) recommendations.push({ icon: 'fa-recycle', title: 'Compost & Recycle', impact: 'Medium', desc: 'Reduce methane from landfill.', color: 'teal' });
    if (recommendations.length === 0) recommendations.push({ icon: 'fa-star', title: 'Great Job!', impact: 'Low', desc: 'Your footprint is impressively low!', color: 'green' });

    return { total_kg: total, breakdown, annual_kg: r2(total * 12), recommendations };
}

function renderCalcResult(result) {
    // Hide steps, show result
    document.querySelectorAll('.calc-step').forEach(s => s.classList.add('hidden'));
    document.getElementById('calc-result').classList.remove('hidden');

    // Result ring animation
    const total = result.total_kg;
    document.getElementById('result-total').textContent = total;
    document.getElementById('result-annual').textContent = `${result.annual_kg} kg`;
    document.getElementById('result-annual-text').innerHTML = `Annually: <strong>${result.annual_kg} kg CO₂</strong>`;

    // Animate arc (max at ~500 kg/mo)
    const pct = Math.min(total / 500, 1);
    const offset = 339.3 * (1 - pct);
    setTimeout(() => {
        document.getElementById('result-arc').style.strokeDashoffset = offset;
    }, 100);

    // Rating
    const ratingEl = document.getElementById('result-rating');
    if (total < 100) {
        ratingEl.className = 'result-rating rating-low';
        ratingEl.innerHTML = '<i class="fa-solid fa-check-circle"></i> Low Footprint — Great job!';
    } else if (total < 250) {
        ratingEl.className = 'result-rating rating-medium';
        ratingEl.innerHTML = '<i class="fa-solid fa-exclamation-circle"></i> Moderate — Room for improvement';
    } else {
        ratingEl.className = 'result-rating rating-high';
        ratingEl.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> High Footprint — Action needed!';
    }

    // Breakdown bars
    const bd = result.breakdown;
    const maxVal = Math.max(...Object.values(bd), 1);
    const barColors = { transport: '#3b82f6', energy: '#f59e0b', food: '#22d3a5', shopping: '#a855f7', waste: '#2dd4bf' };
    document.getElementById('result-bars').innerHTML = Object.entries(bd).map(([cat, val]) => {
        const pctBar = (val / maxVal) * 100;
        return `
            <div class="result-bar-row">
                <div class="bar-label">${cat}</div>
                <div class="bar-track"><div class="bar-fill" style="width:${pctBar}%;background:${barColors[cat] || '#888'}"></div></div>
                <div class="bar-value">${val} kg</div>
            </div>`;
    }).join('');

    // Recommendations
    document.getElementById('result-recs').innerHTML = result.recommendations.map(rec => `
        <div class="rec-card">
            <div class="rec-icon"><i class="fa-solid ${rec.icon}" style="color:${CATEGORY_COLORS[rec.color] || 'var(--green)'}"></i></div>
            <div class="rec-title">${rec.title}</div>
            <span class="rec-impact impact-${rec.impact}">${rec.impact} Impact</span>
            <div class="rec-desc">${rec.desc}</div>
        </div>
    `).join('');

    showToast(`Footprint calculated: ${total} kg CO₂/month`);
}

// ─── Logger ───────────────────────────────────────────────────────────────────
function updateLogActivities() {
    const cat = document.getElementById('log-category').value;
    const sel = document.getElementById('log-activity');
    const unitEl = document.getElementById('log-unit');
    sel.innerHTML = '';
    (ACTIVITIES[cat] || []).forEach(a => {
        const opt = document.createElement('option');
        opt.value = a.key;
        opt.textContent = a.label;
        opt.dataset.unit = a.unit;
        opt.dataset.factor = a.factor;
        sel.appendChild(opt);
    });
    if (ACTIVITIES[cat] && ACTIVITIES[cat].length > 0) {
        unitEl.value = ACTIVITIES[cat][0].unit;
    }
    sel.addEventListener('change', () => {
        const selected = sel.options[sel.selectedIndex];
        if (selected) unitEl.value = selected.dataset.unit || '';
        updateLogPreview();
    });
    updateLogPreview();
}

function updateLogPreview() {
    const cat = document.getElementById('log-category').value;
    const sel = document.getElementById('log-activity');
    const qty = parseFloat(document.getElementById('log-quantity').value) || 0;
    const selected = sel.options[sel.selectedIndex];
    const factor = selected ? parseFloat(selected.dataset.factor) : 0;
    const co2 = r2(qty * factor);
    const preview = document.getElementById('logger-preview');

    if (qty > 0) {
        const icon = co2 <= 0 ? 'fa-leaf' : 'fa-cloud';
        const color = co2 <= 0 ? 'var(--green)' : 'var(--text-secondary)';
        preview.innerHTML = `<i class="fa-solid ${icon}" style="color:${color}"></i><span style="color:${color}">Estimated: <strong>${Math.abs(co2)} kg CO₂</strong>${co2 < 0 ? ' saved!' : ''}</span>`;
    } else {
        preview.innerHTML = '<i class="fa-solid fa-cloud"></i><span>Enter quantity to see estimated CO₂</span>';
    }
}

async function logActivity() {
    const category = document.getElementById('log-category').value;
    const sel = document.getElementById('log-activity');
    const activity_key = sel.value;
    const quantity = parseFloat(document.getElementById('log-quantity').value) || 0;
    const unit = document.getElementById('log-unit').value;

    if (quantity <= 0) { showToast('Please enter a valid quantity.'); return; }

    if (demoMode) {
        const selected = sel.options[sel.selectedIndex];
        const factor = parseFloat(selected.dataset.factor) || 0;
        const co2 = r2(quantity * factor);
        currentUser.points += 10;
        updateSidebar();
        showToast(`Logged: ${co2} kg CO₂ (+10 pts)`);
        document.getElementById('log-quantity').value = '';
        updateLogPreview();
        return;
    }

    try {
        const res = await fetch('/api/log', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ category, activity_key, quantity, unit }),
        });
        const data = await res.json();
        if (data.success) {
            currentUser.points = data.points;
            currentUser.level = data.level;
            updateSidebar();
            showToast(`Logged: ${data.emission_kg} kg CO₂ (+10 pts)`);
            document.getElementById('log-quantity').value = '';
            updateLogPreview();
            loadLogger();
        } else {
            showToast(data.message || 'Failed to log activity.');
        }
    } catch (e) {
        showToast('Server error. Try again.');
    }
}

async function loadLogger() {
    if (demoMode) return;
    try {
        const res = await fetch('/api/dashboard');
        const data = await res.json();
        if (data.recent && data.recent.length > 0) {
            renderFullActivityLog(data.recent);
            document.getElementById('log-count-badge').textContent = `${data.recent.length} entries`;
        }
    } catch (e) { /* ignore */ }
}

function renderFullActivityLog(logs) {
    const container = document.getElementById('full-activity-log');
    if (!logs || logs.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="fa-solid fa-seedling"></i><p>No logs yet. Start tracking above!</p></div>';
        return;
    }
    container.innerHTML = logs.map(r => {
        const icon = CATEGORY_ICONS[r.category] || 'fa-circle';
        const label = formatActivityName(r.activity);
        return `
            <div class="activity-item">
                <div class="activity-icon cat-${r.category}"><i class="fa-solid ${icon}"></i></div>
                <div class="activity-text">
                    <div class="activity-name">${label}</div>
                    <div class="activity-date">${r.date}</div>
                </div>
                <div class="activity-co2">${r.emission_kg} kg</div>
            </div>`;
    }).join('');
}

// ─── Quick Modal Logger ───────────────────────────────────────────────────────
function updateQuickModalActivities() {
    const cat = document.getElementById('qm-category').value;
    const sel = document.getElementById('qm-activity');
    sel.innerHTML = '';
    (ACTIVITIES[cat] || []).forEach(a => {
        const opt = document.createElement('option');
        opt.value = a.key;
        opt.textContent = a.label;
        opt.dataset.factor = a.factor;
        sel.appendChild(opt);
    });
}

async function quickLogActivity() {
    const category = document.getElementById('qm-category').value;
    const activity_key = document.getElementById('qm-activity').value;
    const quantity = parseFloat(document.getElementById('qm-quantity').value) || 0;
    if (quantity <= 0) { showToast('Enter a valid quantity.'); return; }

    if (demoMode) {
        currentUser.points += 10;
        updateSidebar();
        showToast('Activity logged! (+10 pts)');
        toggleModal('quick-modal', false);
        document.getElementById('qm-quantity').value = '';
        return;
    }

    try {
        const res = await fetch('/api/log', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ category, activity_key, quantity }),
        });
        const data = await res.json();
        if (data.success) {
            currentUser.points = data.points;
            currentUser.level = data.level;
            updateSidebar();
            showToast(`Logged: ${data.emission_kg} kg CO₂ (+10 pts)`);
            toggleModal('quick-modal', false);
            document.getElementById('qm-quantity').value = '';
            loadDashboard();
        }
    } catch (e) {
        showToast('Server error.');
    }
}

// ─── Challenges ───────────────────────────────────────────────────────────────
let allChallenges = [];

async function loadChallenges() {
    if (demoMode) {
        allChallenges = [
            { id: 1, title: 'Meatless Monday', description: 'Skip meat every Monday for a week', category: 'food', points: 100, duration: 7, difficulty: 'easy', icon: 'fa-carrot', status: 'active' },
            { id: 2, title: 'Public Transit Pioneer', description: 'Use public transit instead of a car for 5 days', category: 'transport', points: 150, duration: 7, difficulty: 'medium', icon: 'fa-bus', status: 'active' },
            { id: 3, title: 'Energy Saver', description: 'Reduce your electricity usage by 20% this week', category: 'energy', points: 120, duration: 7, difficulty: 'medium', icon: 'fa-bolt', status: 'available' },
            { id: 4, title: 'Zero Waste Warrior', description: 'Produce no landfill waste for 3 consecutive days', category: 'waste', points: 200, duration: 3, difficulty: 'hard', icon: 'fa-recycle', status: 'available' },
            { id: 5, title: 'Bike Commuter', description: 'Cycle to work or school every day for 5 days', category: 'transport', points: 180, duration: 5, difficulty: 'medium', icon: 'fa-bicycle', status: 'available' },
            { id: 6, title: 'Veggie Champion', description: 'Eat a fully plant-based diet for one week', category: 'food', points: 250, duration: 7, difficulty: 'hard', icon: 'fa-seedling', status: 'completed' },
            { id: 7, title: 'Cold Water Wash', description: 'Wash all laundry in cold water for 2 weeks', category: 'energy', points: 80, duration: 14, difficulty: 'easy', icon: 'fa-water', status: 'available' },
            { id: 8, title: 'Shop Local', description: 'Buy from local/sustainable shops this week', category: 'shopping', points: 100, duration: 7, difficulty: 'easy', icon: 'fa-store', status: 'available' },
        ];
    } else {
        try {
            const res = await fetch('/api/challenges');
            allChallenges = await res.json();
        } catch (e) {
            allChallenges = [];
        }
    }
    renderChallenges(allChallenges);
}

function filterChallenges(cat) {
    if (cat === 'all') renderChallenges(allChallenges);
    else renderChallenges(allChallenges.filter(c => c.category === cat));
}

function renderChallenges(list) {
    const container = document.getElementById('challenges-grid');
    if (!list || list.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="fa-solid fa-trophy"></i><p>No challenges found.</p></div>';
        return;
    }
    container.innerHTML = list.map(c => {
        let btnHtml = '';
        if (c.status === 'completed') {
            btnHtml = `<button class="btn-challenge btn-done"><i class="fa-solid fa-check"></i> Completed</button>`;
        } else if (c.status === 'active') {
            btnHtml = `<button class="btn-challenge btn-complete" onclick="completeChallenge(${c.id})"><i class="fa-solid fa-flag-checkered"></i> Mark Complete</button>`;
        } else {
            btnHtml = `<button class="btn-challenge btn-join" onclick="joinChallenge(${c.id})"><i class="fa-solid fa-play"></i> Join Challenge</button>`;
        }

        return `
            <div class="challenge-card status-${c.status}" data-category="${c.category}">
                <div class="challenge-top">
                    <div class="challenge-icon-wrap"><i class="fa-solid ${c.icon}"></i></div>
                    <div class="challenge-badges">
                        <span class="diff-badge diff-${c.difficulty}">${c.difficulty}</span>
                    </div>
                </div>
                <div class="challenge-title">${c.title}</div>
                <div class="challenge-desc">${c.description}</div>
                <div class="challenge-meta">
                    <span><i class="fa-solid fa-clock"></i> ${c.duration} days</span>
                    <span><i class="fa-solid fa-star"></i> ${c.points} pts</span>
                </div>
                ${btnHtml}
            </div>`;
    }).join('');
}

async function joinChallenge(id) {
    if (demoMode) {
        const c = allChallenges.find(ch => ch.id === id);
        if (c) { c.status = 'active'; renderChallenges(getFilteredChallenges()); showToast(`Joined: ${c.title}!`); }
        return;
    }
    try {
        const res = await fetch('/api/challenges/join', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ challenge_id: id }),
        });
        const data = await res.json();
        if (data.success) { showToast('Challenge joined!'); loadChallenges(); }
        else showToast(data.message || 'Could not join.');
    } catch (e) { showToast('Server error.'); }
}

async function completeChallenge(id) {
    if (demoMode) {
        const c = allChallenges.find(ch => ch.id === id);
        if (c) {
            c.status = 'completed';
            currentUser.points += c.points;
            updateSidebar();
            renderChallenges(getFilteredChallenges());
            showToast(`Completed: ${c.title}! +${c.points} pts`);
        }
        return;
    }
    try {
        const res = await fetch('/api/challenges/complete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_challenge_id: id }),
        });
        const data = await res.json();
        if (data.success) {
            currentUser.points = data.total_points;
            updateSidebar();
            showToast(`Challenge completed! +${data.points_earned} pts`);
            loadChallenges();
        }
    } catch (e) { showToast('Server error.'); }
}

function getFilteredChallenges() {
    const activeFilter = document.querySelector('.filter-btn.active');
    const cat = activeFilter ? activeFilter.dataset.filter : 'all';
    return cat === 'all' ? allChallenges : allChallenges.filter(c => c.category === cat);
}

// ─── Offsets ──────────────────────────────────────────────────────────────────
async function loadOffsets() {
    let offsets;
    if (demoMode) {
        offsets = [
            { id: 1, name: 'Reforestation Project', location: 'Amazon, Brazil', price_per_tonne: 12, icon: '🌳', description: 'Plant trees in deforested areas of the Amazon rainforest, restoring biodiversity and absorbing CO₂.' },
            { id: 2, name: 'Wind Energy Farm', location: 'Rajasthan, India', price_per_tonne: 8, icon: '💨', description: 'Support the development of wind turbines providing clean energy to rural communities.' },
            { id: 3, name: 'Solar Cooking Stoves', location: 'Kenya, Africa', price_per_tonne: 10, icon: '☀️', description: 'Provide solar cookers to families, replacing wood burning and reducing deforestation.' },
            { id: 4, name: 'Ocean Plastic Removal', location: 'Pacific Ocean', price_per_tonne: 15, icon: '🌊', description: 'Fund marine cleanup vessels that remove plastic waste and protect ocean carbon sinks.' },
            { id: 5, name: 'Mangrove Restoration', location: 'Bangladesh', price_per_tonne: 9, icon: '🌿', description: 'Restore coastal mangrove forests — some of the most efficient carbon-capturing ecosystems.' },
        ];
    } else {
        try {
            const res = await fetch('/api/offsets');
            offsets = await res.json();
        } catch (e) { offsets = []; }
    }

    const container = document.getElementById('offsets-grid');
    container.innerHTML = offsets.map(o => `
        <div class="offset-card">
            <div class="offset-top">
                <div class="offset-emoji">${o.icon}</div>
                <div>
                    <div class="offset-title">${o.name}</div>
                    <div class="offset-location"><i class="fa-solid fa-location-dot"></i> ${o.location}</div>
                </div>
            </div>
            <div class="offset-desc">${o.description}</div>
            <div class="offset-footer">
                <div class="offset-price">$${o.price_per_tonne} <small>/ tonne CO₂</small></div>
                <button class="btn-offset" onclick="showToast('Offset project selected! (Demo)')"><i class="fa-solid fa-heart"></i> Support</button>
            </div>
        </div>
    `).join('');
}

// ─── Education ────────────────────────────────────────────────────────────────
async function loadEducation() {
    let articles;
    if (demoMode) {
        articles = [
            { id: 1, title: 'What is a Carbon Footprint?', category: 'Basics', read_time: '3 min', icon: '📘', summary: 'A carbon footprint is the total greenhouse gas emissions caused by an individual, event, organization, or product.' },
            { id: 2, title: 'The Impact of Diet on Climate', category: 'Food', read_time: '5 min', icon: '🥗', summary: 'Food production accounts for ~26% of global GHG emissions. Small dietary shifts can have massive impacts.' },
            { id: 3, title: 'Electric Vehicles Explained', category: 'Transport', read_time: '4 min', icon: '🚗', summary: 'EVs produce zero tailpipe emissions, and as the grid gets greener, their lifecycle footprint drops further.' },
            { id: 4, title: 'Renewable Energy at Home', category: 'Energy', read_time: '6 min', icon: '⚡', summary: 'Solar panels, heat pumps, and green energy tariffs can transform your home into a low-carbon hub.' },
            { id: 5, title: 'The Circular Economy', category: 'Shopping', read_time: '4 min', icon: '🔄', summary: 'Designing out waste and keeping products in use is the foundation of a sustainable economy.' },
            { id: 6, title: 'Carbon Offsets: Do They Work?', category: 'Offsets', read_time: '5 min', icon: '🌍', summary: 'When used responsibly alongside real reductions, carbon offsets can play a valuable role in climate action.' },
        ];
    } else {
        try {
            const res = await fetch('/api/education');
            articles = await res.json();
        } catch (e) { articles = []; }
    }

    const container = document.getElementById('education-grid');
    container.innerHTML = articles.map(a => `
        <div class="edu-card" onclick="showToast('Full article coming soon!')">
            <div class="edu-top">
                <div class="edu-emoji">${a.icon}</div>
                <div class="edu-meta"><span class="edu-cat">${a.category}</span> · ${a.read_time} read</div>
            </div>
            <div class="edu-title">${a.title}</div>
            <div class="edu-summary">${a.summary}</div>
            <span class="edu-read">Read More →</span>
        </div>
    `).join('');
}

// ─── Utilities ────────────────────────────────────────────────────────────────
function parseVal(id) {
    return parseFloat(document.getElementById(id).value) || 0;
}

function r2(n) {
    return Math.round(n * 100) / 100;
}

function formatActivityName(key) {
    if (!key) return 'Unknown';
    return key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()).replace(/Km$/, '(km)').replace(/Kwh$/, '(kWh)').replace(/Kg$/, '(kg)');
}

function showToast(message) {
    const toast = document.getElementById('toast');
    document.getElementById('toast-message').textContent = message;
    toast.classList.remove('hidden');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => { toast.classList.add('hidden'); }, 3000);
}

function toggleModal(id, show) {
    const modal = document.getElementById(id);
    if (show) modal.classList.remove('hidden');
    else modal.classList.add('hidden');
}

// Close modal on overlay click
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay')) {
        e.target.classList.add('hidden');
    }
});

// ─── Trees ────────────────────────────────────────────────────────────────────
async function loadTrees() {
    let trees;
    if (demoMode) {
        trees = [
            { id: 1, name: 'Mangrove', co2_per_year: '12.3 kg', percentage_comparison: 'Highest', description: 'Mangroves absorb up to 4 times more carbon than other tropical forests.', icon: '🌿' },
            { id: 2, name: 'Bamboo', co2_per_year: '300 kg (clump)', percentage_comparison: 'Very High', description: 'Bamboo grows rapidly and can sequester large amounts of carbon quickly.', icon: '🎋' },
            { id: 3, name: 'Oak', co2_per_year: '21 kg', percentage_comparison: 'High', description: 'Oaks have a large canopy and dense wood, making them excellent long-term carbon sinks.', icon: '🌳' },
            { id: 4, name: 'Pine', co2_per_year: '15 kg', percentage_comparison: 'Medium', description: 'Conifers like pine grow quickly and can absorb decent amounts of CO₂.', icon: '🌲' },
            { id: 5, name: 'Neem', co2_per_year: '20 kg', percentage_comparison: 'High', description: 'A fast-growing tree native to the Indian subcontinent, excellent for urban planting.', icon: '🍃' },
            { id: 6, name: 'Mahogany', co2_per_year: '20 kg', percentage_comparison: 'High', description: 'Large tropical tree with dense wood, effective at carbon sequestration.', icon: '🌱' }
        ];
    } else {
        try {
            const res = await fetch('/api/trees');
            trees = await res.json();
        } catch (e) { trees = []; }
    }

    const container = document.getElementById('trees-grid');
    if (!trees || trees.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="fa-solid fa-tree"></i><p>No tree data available.</p></div>';
        return;
    }
    
    container.innerHTML = trees.map(t => `
        <div class="tree-card">
            <div class="tree-top">
                <div class="tree-emoji">${t.icon}</div>
                <div class="tree-title">${t.name}</div>
            </div>
            <div class="tree-stats">
                <div class="tree-stat-item"><span>CO₂ Absorption / Year:</span> <span class="tree-stat-value">${t.co2_per_year}</span></div>
                <div class="tree-stat-item"><span>Effectiveness:</span> <span class="tree-stat-value">${t.percentage_comparison}</span></div>
            </div>
            <div class="tree-desc">${t.description}</div>
        </div>
    `).join('');
}
