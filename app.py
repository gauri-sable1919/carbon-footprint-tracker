import os
import json
from datetime import datetime, timedelta
from flask import Flask, render_template, request, jsonify, session
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'ecotrack-super-secret-key-2025')
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///ecotrack.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# ─── Models ────────────────────────────────────────────────────────────────────

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(150), unique=True, nullable=False)
    password_hash = db.Column(db.String(256))
    total_points = db.Column(db.Integer, default=0)
    level = db.Column(db.Integer, default=1)
    baseline_footprint = db.Column(db.Float, default=0.0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    logs = db.relationship('EmissionLog', backref='user', lazy=True)
    challenges = db.relationship('UserChallenge', backref='user', lazy=True)
    badges = db.relationship('UserBadge', backref='user', lazy=True)

class EmissionLog(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    category = db.Column(db.String(50), nullable=False)  # transport, energy, food, shopping, waste
    activity = db.Column(db.String(200))
    emission_value = db.Column(db.Float, nullable=False)  # kg CO2
    date_logged = db.Column(db.DateTime, default=datetime.utcnow)
    metadata_json = db.Column(db.Text, default='{}')

class Challenge(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    category = db.Column(db.String(50))
    point_reward = db.Column(db.Integer, default=50)
    duration_days = db.Column(db.Integer, default=7)
    difficulty = db.Column(db.String(20), default='easy')  # easy, medium, hard
    icon = db.Column(db.String(100), default='fa-leaf')

class UserChallenge(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    challenge_id = db.Column(db.Integer, db.ForeignKey('challenge.id'), nullable=False)
    status = db.Column(db.String(20), default='active')  # active, completed, failed
    start_date = db.Column(db.DateTime, default=datetime.utcnow)
    completion_date = db.Column(db.DateTime)
    challenge = db.relationship('Challenge')

class Badge(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    icon = db.Column(db.String(100))
    criteria_type = db.Column(db.String(50))
    criteria_value = db.Column(db.Float)

class UserBadge(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    badge_id = db.Column(db.Integer, db.ForeignKey('badge.id'), nullable=False)
    date_awarded = db.Column(db.DateTime, default=datetime.utcnow)
    badge = db.relationship('Badge')

# ─── Emission Factors (kg CO2 per unit) ───────────────────────────────────────

EMISSION_FACTORS = {
    'transport': {
        'car_petrol_km': 0.21,
        'car_diesel_km': 0.17,
        'car_electric_km': 0.05,
        'bus_km': 0.089,
        'train_km': 0.041,
        'flight_domestic_km': 0.255,
        'flight_international_km': 0.195,
        'motorcycle_km': 0.114,
        'bicycle_km': 0.0,
        'walking_km': 0.0,
    },
    'energy': {
        'electricity_kwh': 0.233,
        'natural_gas_kwh': 0.203,
        'lpg_kg': 1.51,
        'coal_kg': 2.42,
    },
    'food': {
        'beef_kg': 27.0,
        'lamb_kg': 39.2,
        'pork_kg': 12.1,
        'chicken_kg': 6.9,
        'fish_kg': 6.1,
        'dairy_kg': 3.2,
        'eggs_kg': 4.8,
        'vegetables_kg': 2.0,
        'fruits_kg': 1.1,
        'grains_kg': 1.4,
        'vegan_meal': 0.5,
        'vegetarian_meal': 1.0,
        'meat_meal': 3.3,
    },
    'shopping': {
        'clothing_item': 10.0,
        'electronics_device': 70.0,
        'furniture_item': 45.0,
        'plastic_bag': 0.03,
        'online_order': 0.5,
    },
    'waste': {
        'general_waste_kg': 0.57,
        'recycled_kg': -0.2,
        'composted_kg': -0.1,
    }
}

# ─── Seed Data ─────────────────────────────────────────────────────────────────

def seed_data():
    """Seed challenges and badges if not present."""
    if Challenge.query.count() == 0:
        challenges = [
            Challenge(title='Meatless Monday', description='Skip meat every Monday for a week', category='food', point_reward=100, duration_days=7, difficulty='easy', icon='fa-carrot'),
            Challenge(title='Public Transit Pioneer', description='Use public transit instead of a car for 5 days', category='transport', point_reward=150, duration_days=7, difficulty='medium', icon='fa-bus'),
            Challenge(title='Energy Saver', description='Reduce your electricity usage by 20% this week', category='energy', point_reward=120, duration_days=7, difficulty='medium', icon='fa-bolt'),
            Challenge(title='Zero Waste Warrior', description='Produce no landfill waste for 3 consecutive days', category='waste', point_reward=200, duration_days=3, difficulty='hard', icon='fa-recycle'),
            Challenge(title='Bike Commuter', description='Cycle to work or school every day for 5 days', category='transport', point_reward=180, duration_days=5, difficulty='medium', icon='fa-bicycle'),
            Challenge(title='Veggie Champion', description='Eat a fully plant-based diet for one week', category='food', point_reward=250, duration_days=7, difficulty='hard', icon='fa-seedling'),
            Challenge(title='Cold Water Wash', description='Wash all laundry in cold water for 2 weeks', category='energy', point_reward=80, duration_days=14, difficulty='easy', icon='fa-water'),
            Challenge(title='Shop Local', description='Buy from local/sustainable shops this week', category='shopping', point_reward=100, duration_days=7, difficulty='easy', icon='fa-store'),
        ]
        db.session.add_all(challenges)

    if Badge.query.count() == 0:
        badges = [
            Badge(name='First Step', description='Logged your first activity!', icon='🌱', criteria_type='logs_count', criteria_value=1),
            Badge(name='Eco Warrior', description='Logged 30 activities', icon='⚔️', criteria_type='logs_count', criteria_value=30),
            Badge(name='Carbon Cutter', description='Saved 100 kg CO2 vs. baseline', icon='✂️', criteria_type='saved_co2', criteria_value=100),
            Badge(name='Green Champion', description='Completed 5 challenges', icon='🏆', criteria_type='challenges_completed', criteria_value=5),
            Badge(name='Climate Hero', description='Reached 1000 points', icon='🦸', criteria_type='points', criteria_value=1000),
            Badge(name='Net Zero Star', description='Saved 500 kg CO2 vs. baseline', icon='⭐', criteria_type='saved_co2', criteria_value=500),
            Badge(name='Community Leader', description='Completed 10 challenges', icon='👑', criteria_type='challenges_completed', criteria_value=10),
        ]
        db.session.add_all(badges)

    db.session.commit()

# ─── Routes ────────────────────────────────────────────────────────────────────

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'success': False, 'message': 'Email already registered'}), 400
    user = User(
        name=data['name'],
        email=data['email'],
        password_hash=generate_password_hash(data['password'])
    )
    db.session.add(user)
    db.session.commit()
    session['user_id'] = user.id
    return jsonify({'success': True, 'user': {'id': user.id, 'name': user.name, 'email': user.email, 'points': user.total_points, 'level': user.level}})

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    user = User.query.filter_by(email=data['email']).first()
    if not user or not check_password_hash(user.password_hash, data['password']):
        return jsonify({'success': False, 'message': 'Invalid credentials'}), 401
    session['user_id'] = user.id
    return jsonify({'success': True, 'user': {'id': user.id, 'name': user.name, 'email': user.email, 'points': user.total_points, 'level': user.level}})

@app.route('/api/logout', methods=['POST'])
def logout():
    session.pop('user_id', None)
    return jsonify({'success': True})

@app.route('/api/me')
def me():
    uid = session.get('user_id')
    if not uid:
        return jsonify({'logged_in': False}), 401
    user = User.query.get(uid)
    if not user:
        return jsonify({'logged_in': False}), 401
    return jsonify({'logged_in': True, 'user': {'id': user.id, 'name': user.name, 'email': user.email, 'points': user.total_points, 'level': user.level, 'baseline': user.baseline_footprint}})

@app.route('/api/calculate', methods=['POST'])
def calculate():
    """Calculate carbon footprint from multi-category inputs."""
    data = request.get_json()
    total = 0.0
    breakdown = {}

    # Transport
    t = data.get('transport', {})
    transport_co2 = (
        t.get('car_km', 0) * EMISSION_FACTORS['transport'].get(f"car_{t.get('fuel_type','petrol')}_km", 0.21) +
        t.get('bus_km', 0) * EMISSION_FACTORS['transport']['bus_km'] +
        t.get('train_km', 0) * EMISSION_FACTORS['transport']['train_km'] +
        t.get('flight_domestic_km', 0) * EMISSION_FACTORS['transport']['flight_domestic_km'] +
        t.get('flight_international_km', 0) * EMISSION_FACTORS['transport']['flight_international_km']
    )
    breakdown['transport'] = round(transport_co2, 2)
    total += transport_co2

    # Energy
    e = data.get('energy', {})
    energy_co2 = (
        e.get('electricity_kwh', 0) * EMISSION_FACTORS['energy']['electricity_kwh'] +
        e.get('natural_gas_kwh', 0) * EMISSION_FACTORS['energy']['natural_gas_kwh']
    )
    breakdown['energy'] = round(energy_co2, 2)
    total += energy_co2

    # Food
    f = data.get('food', {})
    food_co2 = (
        f.get('meat_meals', 0) * EMISSION_FACTORS['food']['meat_meal'] +
        f.get('vegetarian_meals', 0) * EMISSION_FACTORS['food']['vegetarian_meal'] +
        f.get('vegan_meals', 0) * EMISSION_FACTORS['food']['vegan_meal']
    )
    breakdown['food'] = round(food_co2, 2)
    total += food_co2

    # Shopping
    s = data.get('shopping', {})
    shopping_co2 = (
        s.get('clothing_items', 0) * EMISSION_FACTORS['shopping']['clothing_item'] +
        s.get('electronics', 0) * EMISSION_FACTORS['shopping']['electronics_device'] +
        s.get('online_orders', 0) * EMISSION_FACTORS['shopping']['online_order']
    )
    breakdown['shopping'] = round(shopping_co2, 2)
    total += shopping_co2

    # Waste
    w = data.get('waste', {})
    waste_co2 = (
        w.get('general_kg', 0) * EMISSION_FACTORS['waste']['general_waste_kg'] +
        w.get('recycled_kg', 0) * EMISSION_FACTORS['waste']['recycled_kg'] +
        w.get('composted_kg', 0) * EMISSION_FACTORS['waste']['composted_kg']
    )
    breakdown['waste'] = round(max(waste_co2, 0), 2)
    total += waste_co2

    total = round(max(total, 0), 2)

    # Save baseline for logged-in user
    uid = session.get('user_id')
    if uid and data.get('save_baseline'):
        user = User.query.get(uid)
        if user:
            user.baseline_footprint = total
            db.session.commit()

    # Recommendations
    recommendations = generate_recommendations(breakdown)

    return jsonify({'total_kg': total, 'breakdown': breakdown, 'recommendations': recommendations, 'annual_kg': round(total * 12, 2)})

def generate_recommendations(breakdown):
    recs = []
    if breakdown.get('transport', 0) > 50:
        recs.append({'icon': 'fa-bus', 'title': 'Switch to Public Transit', 'impact': 'High', 'desc': 'Using public transport instead of a personal car can cut your transport emissions by up to 60%.', 'color': 'blue'})
    if breakdown.get('food', 0) > 30:
        recs.append({'icon': 'fa-carrot', 'title': 'Reduce Meat Consumption', 'impact': 'High', 'desc': 'Shifting to a plant-rich diet is one of the most impactful personal climate actions available.', 'color': 'green'})
    if breakdown.get('energy', 0) > 40:
        recs.append({'icon': 'fa-solar-panel', 'title': 'Switch to Green Energy', 'impact': 'High', 'desc': 'Choosing a renewable energy tariff or installing solar panels can drastically cut household emissions.', 'color': 'yellow'})
    if breakdown.get('shopping', 0) > 20:
        recs.append({'icon': 'fa-shirt', 'title': 'Buy Less, Choose Well', 'impact': 'Medium', 'desc': 'Opt for second-hand clothing and repair electronics rather than buying new.', 'color': 'purple'})
    if breakdown.get('waste', 0) > 10:
        recs.append({'icon': 'fa-recycle', 'title': 'Compost & Recycle More', 'impact': 'Medium', 'desc': 'Composting food scraps and recycling can significantly reduce landfill methane emissions.', 'color': 'teal'})
    if not recs:
        recs.append({'icon': 'fa-star', 'title': 'Great Job!', 'impact': 'Low', 'desc': 'Your footprint is already quite low. Keep it up and consider sharing your habits with others!', 'color': 'green'})
    return recs

@app.route('/api/log', methods=['POST'])
def log_activity():
    uid = session.get('user_id')
    if not uid:
        return jsonify({'success': False, 'message': 'Not authenticated'}), 401
    data = request.get_json()
    category = data.get('category')
    activity_key = data.get('activity_key')
    quantity = float(data.get('quantity', 1))

    factors = EMISSION_FACTORS.get(category, {})
    factor = factors.get(activity_key, 0)
    emission_value = round(factor * quantity, 3)

    log = EmissionLog(
        user_id=uid,
        category=category,
        activity=activity_key,
        emission_value=emission_value,
        metadata_json=json.dumps({'quantity': quantity, 'unit': data.get('unit', '')})
    )
    db.session.add(log)

    # Award points (10 pts per log)
    user = User.query.get(uid)
    user.total_points += 10
    user.level = max(1, user.total_points // 200 + 1)

    db.session.commit()
    _check_and_award_badges(user)

    return jsonify({'success': True, 'emission_kg': emission_value, 'points': user.total_points, 'level': user.level})

def _check_and_award_badges(user):
    existing_badge_ids = {ub.badge_id for ub in user.badges}
    all_badges = Badge.query.all()
    logs_count = len(user.logs)
    challenges_completed = sum(1 for uc in user.challenges if uc.status == 'completed')

    for badge in all_badges:
        if badge.id in existing_badge_ids:
            continue
        awarded = False
        if badge.criteria_type == 'logs_count' and logs_count >= badge.criteria_value:
            awarded = True
        elif badge.criteria_type == 'points' and user.total_points >= badge.criteria_value:
            awarded = True
        elif badge.criteria_type == 'challenges_completed' and challenges_completed >= badge.criteria_value:
            awarded = True
        if awarded:
            ub = UserBadge(user_id=user.id, badge_id=badge.id)
            db.session.add(ub)
    db.session.commit()

@app.route('/api/dashboard')
def dashboard():
    uid = session.get('user_id')
    if not uid:
        return jsonify({'error': 'Not authenticated'}), 401

    user = User.query.get(uid)
    now = datetime.utcnow()
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    # Monthly logs
    monthly_logs = EmissionLog.query.filter(
        EmissionLog.user_id == uid,
        EmissionLog.date_logged >= month_start
    ).all()

    monthly_total = round(sum(l.emission_value for l in monthly_logs), 2)
    by_category = {}
    for log in monthly_logs:
        by_category[log.category] = round(by_category.get(log.category, 0) + log.emission_value, 2)

    # Last 7 days trend
    trend = []
    for i in range(6, -1, -1):
        day = now - timedelta(days=i)
        day_start = day.replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day.replace(hour=23, minute=59, second=59, microsecond=999999)
        day_logs = EmissionLog.query.filter(
            EmissionLog.user_id == uid,
            EmissionLog.date_logged >= day_start,
            EmissionLog.date_logged <= day_end
        ).all()
        trend.append({'date': day.strftime('%a'), 'value': round(sum(l.emission_value for l in day_logs), 2)})

    # Recent logs (last 5)
    recent = EmissionLog.query.filter_by(user_id=uid).order_by(EmissionLog.date_logged.desc()).limit(5).all()
    recent_list = [{'category': l.category, 'activity': l.activity, 'emission_kg': l.emission_value, 'date': l.date_logged.strftime('%b %d')} for l in recent]

    # Badges
    badges = [{'name': ub.badge.name, 'icon': ub.badge.icon, 'desc': ub.badge.description} for ub in user.badges]

    # Active challenges
    active_challenges = UserChallenge.query.filter_by(user_id=uid, status='active').all()
    challenge_list = [{'id': uc.id, 'title': uc.challenge.title, 'icon': uc.challenge.icon, 'days_left': max(0, uc.challenge.duration_days - (now - uc.start_date).days)} for uc in active_challenges]

    saved_co2 = round(max(0, user.baseline_footprint - monthly_total), 2)

    return jsonify({
        'monthly_total': monthly_total,
        'by_category': by_category,
        'trend': trend,
        'recent': recent_list,
        'badges': badges,
        'active_challenges': challenge_list,
        'points': user.total_points,
        'level': user.level,
        'baseline': user.baseline_footprint,
        'saved_co2': saved_co2,
        'trees_equivalent': round(saved_co2 / 21, 1)
    })

@app.route('/api/challenges')
def get_challenges():
    uid = session.get('user_id')
    all_challs = Challenge.query.all()
    active_ids = set()
    completed_ids = set()
    if uid:
        for uc in UserChallenge.query.filter_by(user_id=uid).all():
            if uc.status == 'active': active_ids.add(uc.challenge_id)
            elif uc.status == 'completed': completed_ids.add(uc.challenge_id)

    result = []
    for c in all_challs:
        status = 'available'
        if c.id in active_ids: status = 'active'
        elif c.id in completed_ids: status = 'completed'
        result.append({'id': c.id, 'title': c.title, 'description': c.description, 'category': c.category, 'points': c.point_reward, 'duration': c.duration_days, 'difficulty': c.difficulty, 'icon': c.icon, 'status': status})
    return jsonify(result)

@app.route('/api/challenges/join', methods=['POST'])
def join_challenge():
    uid = session.get('user_id')
    if not uid:
        return jsonify({'success': False, 'message': 'Not authenticated'}), 401
    challenge_id = request.get_json().get('challenge_id')
    existing = UserChallenge.query.filter_by(user_id=uid, challenge_id=challenge_id, status='active').first()
    if existing:
        return jsonify({'success': False, 'message': 'Already joined'})
    uc = UserChallenge(user_id=uid, challenge_id=challenge_id, status='active')
    db.session.add(uc)
    db.session.commit()
    return jsonify({'success': True})

@app.route('/api/challenges/complete', methods=['POST'])
def complete_challenge():
    uid = session.get('user_id')
    if not uid:
        return jsonify({'success': False, 'message': 'Not authenticated'}), 401
    uc_id = request.get_json().get('user_challenge_id')
    uc = UserChallenge.query.filter_by(id=uc_id, user_id=uid).first()
    if not uc:
        return jsonify({'success': False, 'message': 'Not found'})
    uc.status = 'completed'
    uc.completion_date = datetime.utcnow()
    user = User.query.get(uid)
    user.total_points += uc.challenge.point_reward
    user.level = max(1, user.total_points // 200 + 1)
    db.session.commit()
    _check_and_award_badges(user)
    return jsonify({'success': True, 'points_earned': uc.challenge.point_reward, 'total_points': user.total_points})

@app.route('/api/offsets')
def get_offsets():
    offsets = [
        {'id': 1, 'name': 'Reforestation Project', 'location': 'Amazon, Brazil', 'price_per_tonne': 12, 'icon': '🌳', 'description': 'Plant trees in deforested areas of the Amazon rainforest, restoring biodiversity and absorbing CO2.'},
        {'id': 2, 'name': 'Wind Energy Farm', 'location': 'Rajasthan, India', 'price_per_tonne': 8, 'icon': '💨', 'description': 'Support the development of wind turbines providing clean energy to rural communities.'},
        {'id': 3, 'name': 'Solar Cooking Stoves', 'location': 'Kenya, Africa', 'price_per_tonne': 10, 'icon': '☀️', 'description': 'Provide solar cookers to families, replacing wood burning and reducing deforestation.'},
        {'id': 4, 'name': 'Ocean Plastic Removal', 'location': 'Pacific Ocean', 'price_per_tonne': 15, 'icon': '🌊', 'description': 'Fund marine cleanup vessels that remove plastic waste and protect ocean carbon sinks.'},
        {'id': 5, 'name': 'Mangrove Restoration', 'location': 'Bangladesh', 'price_per_tonne': 9, 'icon': '🌿', 'description': 'Restore coastal mangrove forests — some of the most efficient carbon-capturing ecosystems on Earth.'},
    ]
    return jsonify(offsets)

@app.route('/api/education')
def get_education():
    articles = [
        {'id': 1, 'title': 'What is a Carbon Footprint?', 'category': 'Basics', 'read_time': '3 min', 'icon': '📘', 'summary': 'A carbon footprint is the total greenhouse gas emissions caused by an individual, event, organization, or product.'},
        {'id': 2, 'title': 'The Impact of Diet on Climate', 'category': 'Food', 'read_time': '5 min', 'icon': '🥗', 'summary': 'Food production accounts for ~26% of global GHG emissions. Small dietary shifts can have massive impacts.'},
        {'id': 3, 'title': 'Electric Vehicles Explained', 'category': 'Transport', 'read_time': '4 min', 'icon': '🚗', 'summary': 'EVs produce zero tailpipe emissions, and as the grid gets greener, their lifecycle footprint drops further.'},
        {'id': 4, 'title': 'Renewable Energy at Home', 'category': 'Energy', 'read_time': '6 min', 'icon': '⚡', 'summary': 'Solar panels, heat pumps, and green energy tariffs can transform your home into a low-carbon hub.'},
        {'id': 5, 'title': 'The Circular Economy', 'category': 'Shopping', 'read_time': '4 min', 'icon': '🔄', 'summary': 'Designing out waste and keeping products in use is the foundation of a sustainable economy.'},
        {'id': 6, 'title': 'Carbon Offsets: Do They Work?', 'category': 'Offsets', 'read_time': '5 min', 'icon': '🌍', 'summary': 'When used responsibly alongside real reductions, carbon offsets can play a valuable role in climate action.'},
    ]
    return jsonify(articles)

@app.route('/api/trees')
def get_trees():
    trees = [
        {'id': 1, 'name': 'Mangrove', 'co2_per_year': '12.3 kg', 'percentage_comparison': 'Highest absorption', 'description': 'Mangroves absorb up to 4 times more carbon than other tropical forests.', 'icon': '🌿'},
        {'id': 2, 'name': 'Bamboo', 'co2_per_year': '300 kg (per clump)', 'percentage_comparison': 'Very High', 'description': 'Bamboo grows rapidly and can sequester large amounts of carbon quickly.', 'icon': '🎋'},
        {'id': 3, 'name': 'Oak', 'co2_per_year': '21 kg', 'percentage_comparison': 'High', 'description': 'Oaks have a large canopy and dense wood, making them excellent long-term carbon sinks.', 'icon': '🌳'},
        {'id': 4, 'name': 'Pine', 'co2_per_year': '15 kg', 'percentage_comparison': 'Medium', 'description': 'Conifers like pine grow quickly and can absorb decent amounts of CO2.', 'icon': '🌲'},
        {'id': 5, 'name': 'Neem', 'co2_per_year': '20 kg', 'percentage_comparison': 'High', 'description': 'A fast-growing tree native to the Indian subcontinent, excellent for urban planting.', 'icon': '🍃'},
        {'id': 6, 'name': 'Mahogany', 'co2_per_year': '20 kg', 'percentage_comparison': 'High', 'description': 'Large tropical tree with dense wood, effective at carbon sequestration.', 'icon': '🌱'}
    ]
    return jsonify(trees)

# ─── App Entry Point ───────────────────────────────────────────────────────────

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        seed_data()
    app.run(debug=True, port=5000)
