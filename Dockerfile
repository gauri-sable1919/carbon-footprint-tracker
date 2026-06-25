# Use official Python 3.11 slim image
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PORT=8080

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy project files
COPY . .

# Create entrypoint script
RUN echo '#!/bin/sh\npython -c "from app import app, db, seed_data; app.app_context().push(); db.create_all(); seed_data()"\nexec gunicorn --bind 0.0.0.0:$PORT --workers 2 --timeout 120 app:app' > /app/start.sh
RUN chmod +x /app/start.sh

# Expose port
EXPOSE 8080

CMD ["/app/start.sh"]
