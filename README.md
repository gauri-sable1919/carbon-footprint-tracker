# EcoTrack (Carbon Footprint Tracker)

EcoTrack is a web application built with Flask that allows users to calculate, track, and reduce their carbon footprint. 

## Features

- **Carbon Footprint Calculator**: Calculate emissions across multiple categories including transport, energy, food, shopping, and waste.
- **Activity Logging**: Log daily activities to monitor ongoing carbon emissions.
- **Personalized Recommendations**: Receive actionable advice to lower your carbon footprint based on your usage data.
- **Challenges & Badges**: Gamify your eco-friendly journey by joining challenges and earning badges for achieving milestones.
- **Educational Resources & Offsets**: Learn more about climate change and explore opportunities to offset your carbon emissions.

## Technology Stack

- **Backend**: Python, Flask, Flask-SQLAlchemy
- **Database**: SQLite (via SQLAlchemy)
- **Frontend**: HTML, CSS, JavaScript (served via Flask templates and static files)

## Setup and Installation

1. **Clone the repository** (if applicable):
   ```bash
   git clone <repository_url>
   cd "carbon footprint"
   ```

2. **Create a virtual environment** (recommended):
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows, use `venv\Scripts\activate`
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Environment Variables**:
   Create a `.env` file in the root directory and configure necessary variables:
   ```env
   SECRET_KEY=your_super_secret_key
   ```

5. **Run the application**:
   ```bash
   python app.py
   ```
   The application will create a local SQLite database (`ecotrack.db`) automatically and seed initial data.

6. **Access the web app**:
   Open a web browser and navigate to `http://localhost:5000/`.

## License

This project is open-source and available under the MIT License.
