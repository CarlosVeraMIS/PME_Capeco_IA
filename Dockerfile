# CAPECO Data Lake API Server
# Multi-stage Dockerfile for optimal image size

FROM python:3.10-slim AS builder

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Build wheels directly from packages
RUN pip wheel --no-cache-dir --no-deps --wheel-dir /app/wheels \
    fastapi==0.104.1 uvicorn==0.24.0 pandas==2.1.3 pyarrow==14.0.0 redis==5.0.0 pydantic==2.4.2


# Final stage
FROM python:3.10-slim

# Install runtime dependencies only
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy wheels from builder
COPY --from=builder /app/wheels /wheels

# Install wheels
RUN pip install --no-cache /wheels/*

# Copy application code
COPY . .

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Expose port
EXPOSE 8000

# Run with gunicorn in production (or uvicorn for dev)
# For development:
CMD ["python", "-m", "uvicorn", "api_server:app", "--host", "0.0.0.0", "--port", "8000", "--access-log"]

# For production (uncomment for use with gunicorn):
# RUN pip install gunicorn
# CMD ["gunicorn", "-w", "4", "-k", "uvicorn.workers.UvicornWorker", "-b", "0.0.0.0:8000", "api_server:app"]
