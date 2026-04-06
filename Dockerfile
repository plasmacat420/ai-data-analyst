FROM python:3.11-slim
WORKDIR /app

COPY backend/pyproject.toml .
COPY backend/app/ ./app/
COPY backend/sample_data/ ./sample_data/

RUN pip install --no-cache-dir -e "." \
    && useradd -m appuser \
    && mkdir -p uploads \
    && chown -R appuser /app

USER appuser
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
