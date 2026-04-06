# AI Data Analyst

> Ask questions about your data in plain English. Get SQL, charts, and insights instantly — no SQL knowledge needed.

[![Python](https://img.shields.io/badge/Python-3.11-3776AB?logo=python&logoColor=white)](https://python.org)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![LangChain](https://img.shields.io/badge/LangChain-0.2-1C3C3C?logo=chainlink)](https://langchain.com)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![CI](https://github.com/plasmacat420/ai-data-analyst/actions/workflows/ci.yml/badge.svg)](https://github.com/plasmacat420/ai-data-analyst/actions/workflows/ci.yml)
[![Live Demo](https://img.shields.io/badge/Live_Demo-GitHub_Pages-8b5cf6)](https://plasmacat420.github.io/ai-data-analyst/)

Most people have data but can't query it. This project gives everyone a data analyst on demand — powered by GPT-4o, it translates natural language into SQL, runs the query, and visualizes the results instantly.

---

<!-- screenshot: query with bar chart result -->
<!-- screenshot: sample questions panel -->

## How it works

1. **Load your data** — pick a built-in sample dataset or upload any CSV file
2. **Ask in plain English** — type "What were the top 5 products by revenue last month?"
3. **Get SQL + chart + explanation** — the AI writes the query, runs it, and auto-selects the best chart

---

## Features

| Feature | Details |
|---|---|
| **3 built-in datasets** | Sales (500 rows), Employees (100 rows), E-commerce (300 rows) — try instantly, no upload needed |
| **Auto chart selection** | Bar, line, pie, area, scatter — chosen based on your data shape and question intent |
| **Multi-turn conversation** | Ask follow-up questions with full context from previous answers |
| **SQL transparency** | Every generated query is shown with syntax highlighting so you can learn |
| **SELECT-only safety** | INSERT / UPDATE / DROP / ALTER are rejected before execution — your data is never modified |
| **REST API** | Fully usable without the frontend — great for integrations |
| **CSV upload** | Drag-and-drop any CSV up to 10 MB |

---

## Sample Q&A

**Sales dataset**
```
Q: What are the top 5 products by revenue?
→ Bar chart: MacBook Pro ($847k), iPhone 15 ($312k), Smart Watch ($198k)...

Q: Show monthly revenue trend for 2024
→ Line chart: peaks in November ($184k) and December ($201k)

Q: Which region performs best?
→ Bar chart: West ($412k) > North ($389k) > South ($356k) > East ($341k)
```

**Employees dataset**
```
Q: What is the average salary by department?
→ Bar chart: Engineering ($112k), Finance ($87k), Marketing ($67k)...

Q: Who are the top performers?
→ Table: sorted by performance_score DESC
```

**E-commerce dataset**
```
Q: Show order status breakdown
→ Pie chart: Completed 60%, Pending 20%, Refunded 20%

Q: Which city has the most orders?
→ Bar chart: New York (42), Los Angeles (38)...
```

---

## Quick Start

### Docker Compose (recommended)

```bash
git clone https://github.com/plasmacat420/ai-data-analyst
cd ai-data-analyst

cp backend/.env.example backend/.env
# Edit backend/.env and set OPENAI_API_KEY=sk-...

docker compose up
```

Open **http://localhost:5173** — all 3 sample datasets load automatically.

### Manual

```bash
# Backend
cd backend
pip install -e ".[dev]"
cp .env.example .env        # add your OPENAI_API_KEY
uvicorn app.main:app --reload --port 8000

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

---

## API Reference

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Health check |
| `GET` | `/api/datasets` | List loaded datasets |
| `POST` | `/api/datasets/sample/{name}` | Load sample: `sales`, `employees`, `ecommerce` |
| `POST` | `/api/datasets/upload` | Upload CSV (multipart, max 10 MB) |
| `GET` | `/api/datasets/{id}` | Dataset info + preview |
| `DELETE` | `/api/datasets/{id}` | Remove dataset |
| `POST` | `/api/query` | Natural language → SQL → results → chart |

**Example query request:**
```json
POST /api/query
{
  "dataset_id": "abc-123",
  "question": "What are the top 5 products by revenue?",
  "conversation_history": []
}
```

**Example response:**
```json
{
  "question": "What are the top 5 products by revenue?",
  "sql": "SELECT product, SUM(revenue) AS total_revenue FROM data GROUP BY product ORDER BY total_revenue DESC LIMIT 5",
  "explanation": "This query groups all sales by product and sums the revenue for each, returning the top 5 by total revenue.",
  "columns": ["product", "total_revenue"],
  "rows": [["MacBook Pro", 847234.5], ["iPhone 15", 312456.0]],
  "row_count": 5,
  "chart": { "type": "bar", "x_column": "product", "y_column": "total_revenue", "title": "Top 5 Products By Revenue" },
  "execution_time_ms": 312,
  "error": null
}
```

---

## Architecture

```
User question
    │
    ▼
FastAPI /api/query
    │
    ├─► get_schema_string()   ← reads SQLite PRAGMA, builds column descriptions with examples
    │
    ├─► GPT-4o (LangChain)   ← schema + history + question → { sql, explanation }
    │         temperature=0, response_format=json_object
    │
    ├─► SQL validator         ← rejects anything that isn't SELECT
    │
    ├─► aiosqlite             ← executes query against uploads/{dataset_id}.db
    │
    └─► suggest_chart()       ← column types + question keywords → ChartConfig
            │
            ▼
        QueryResponse → Frontend → Recharts
```

**Chart auto-detection logic:**
- `date/time col + number col` → line chart
- `category col + number col` → bar chart (or pie if ≤8 rows and "breakdown" in question)
- `2 number cols` → scatter chart
- question contains "trend"/"over time" → line (override)
- question contains "distribution"/"breakdown" → pie (override)
- single value result → no chart

---

## Development

```bash
# Run tests with coverage
cd backend && pytest -v --cov=app

# Lint + format check
ruff check . && ruff format --check .

# Frontend type check / build
cd frontend && npm run build
```

---

## Deploy

**Backend → Render.com** (free tier): uses `render.yaml` — set `OPENAI_API_KEY` in the dashboard.

**Frontend → GitHub Pages**: push to `main` → GitHub Actions builds and deploys automatically. Set `VITE_API_URL` secret to your Render URL.

---

## License

MIT © 2024 plasmacat420
