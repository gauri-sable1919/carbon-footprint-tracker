"""Startup script - initializes DB and runs the app."""
from app import app, db, seed_data

with app.app_context():
    db.create_all()
    seed_data()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080)
