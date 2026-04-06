FROM python:3.11-slim AS builder
WORKDIR /app
COPY backend/pyproject.toml .
RUN pip install --no-cache-dir -e "."

FROM python:3.11-slim
WORKDIR /app
COPY --from=builder /usr/local/lib/python3.11 /usr/local/lib/python3.11
COPY --from=builder /usr/local/bin /usr/local/bin
COPY backend/app/ ./app/
COPY backend/sample_data/ ./sample_data/
RUN useradd -m appuser && mkdir -p uploads && chown -R appuser /app
USER appuser
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
