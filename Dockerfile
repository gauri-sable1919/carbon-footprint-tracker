# Use official Python 3.11 slim image
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy project files
COPY . .

# Create a directory for the SQLite database
RUN mkdir -p /app/instance

# Expose port (Cloud Run uses 8080 by default)
EXPOSE 8080

# Initialize DB and run with gunicorn
CMD ["sh", "-c", "python -c 'from app import app, db, seed_data; \
    app.app_context().push(); \
    db.create_all(); \
    seed_data()' && \
    gunicorn --bind 0.0.0.0:8080 --workers 2 --timeout 120 app:app"]
