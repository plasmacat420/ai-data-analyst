import json
import time
from pathlib import Path

from loguru import logger
from openai import AsyncOpenAI

from app.config import settings
from app.database import execute_query
from app.models import ChartConfig, QueryResponse
from app.services.chart import suggest_chart
from app.services.dataset import get_schema_string

SYSTEM_PROMPT = """You are an expert data analyst. You have access to a SQLite database with the schema provided.

Rules:
- Write SELECT queries only. Never INSERT, UPDATE, DELETE, DROP, or ALTER.
- Always use the table name 'data'
- Keep queries efficient — use LIMIT when appropriate
- For aggregations, always include meaningful column aliases
- Return ONLY a JSON object with this exact structure:
{
  "sql": "SELECT ...",
  "explanation": "This query finds the top 5 products by total revenue..."
}
- No markdown, no code blocks, just the raw JSON
"""


def build_prompt(schema: str, question: str, history: list[dict]) -> list[dict]:
    """Build the full message list with schema, history, and question."""
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]

    # Add schema as first user message context
    schema_msg = f"Database schema:\n\n{schema}"
    messages.append({"role": "user", "content": schema_msg})
    messages.append(
        {
            "role": "assistant",
            "content": '{"sql": "SELECT 1", "explanation": "Schema loaded. Ready for your questions."}',
        }
    )

    # Inject conversation history (up to last 6 exchanges)
    for msg in history[-12:]:
        if msg.get("role") in ("user", "assistant") and msg.get("content"):
            messages.append({"role": msg["role"], "content": str(msg["content"])})

    messages.append({"role": "user", "content": question})
    return messages


def _validate_sql(sql: str) -> bool:
    """Return True if SQL is a safe SELECT-only query."""
    stripped = sql.strip().upper()
    if not stripped.startswith("SELECT"):
        return False
    dangerous = ["INSERT", "UPDATE", "DELETE", "DROP", "ALTER", "CREATE", "TRUNCATE", "REPLACE"]
    for keyword in dangerous:
        if keyword in stripped:
            return False
    return True


async def run_analysis(
    dataset_id: str,
    question: str,
    conversation_history: list[dict],
) -> QueryResponse:
    """Run natural language → SQL → results → chart pipeline."""
    start = time.monotonic()

    schema = await get_schema_string(dataset_id)
    messages = build_prompt(schema, question, conversation_history)

    client = AsyncOpenAI(
        api_key=settings.GROQ_API_KEY,
        base_url="https://api.groq.com/openai/v1",
    )

    try:
        response = await client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            temperature=0,
            max_tokens=1024,
            response_format={"type": "json_object"},
        )
    except Exception as e:
        logger.error(f"Groq API error: {e}")
        elapsed = int((time.monotonic() - start) * 1000)
        return QueryResponse(
            question=question,
            sql="",
            explanation="",
            columns=[],
            rows=[],
            row_count=0,
            chart=ChartConfig(type="none"),
            execution_time_ms=elapsed,
            error=f"AI service error: {str(e)}",
        )

    raw = response.choices[0].message.content or "{}"

    try:
        parsed = json.loads(raw)
        sql = parsed.get("sql", "").strip()
        explanation = parsed.get("explanation", "")
    except json.JSONDecodeError:
        elapsed = int((time.monotonic() - start) * 1000)
        return QueryResponse(
            question=question,
            sql="",
            explanation="",
            columns=[],
            rows=[],
            row_count=0,
            chart=ChartConfig(type="none"),
            execution_time_ms=elapsed,
            error="Failed to parse AI response as JSON",
        )

    if not _validate_sql(sql):
        elapsed = int((time.monotonic() - start) * 1000)
        return QueryResponse(
            question=question,
            sql=sql,
            explanation=explanation,
            columns=[],
            rows=[],
            row_count=0,
            chart=ChartConfig(type="none"),
            execution_time_ms=elapsed,
            error="Only SELECT queries are permitted",
        )

    db_path = Path(settings.UPLOAD_DIR) / f"{dataset_id}.db"

    try:
        columns, rows = await execute_query(db_path, sql)
    except Exception as e:
        logger.error(f"SQL execution error: {e}")
        elapsed = int((time.monotonic() - start) * 1000)
        return QueryResponse(
            question=question,
            sql=sql,
            explanation=explanation,
            columns=[],
            rows=[],
            row_count=0,
            chart=ChartConfig(type="none"),
            execution_time_ms=elapsed,
            error=f"SQL execution error: {str(e)}",
        )

    # Limit rows returned to frontend
    limited_rows = rows[: settings.MAX_RESULT_ROWS]
    chart = suggest_chart(columns, limited_rows, sql, question)

    elapsed = int((time.monotonic() - start) * 1000)
    return QueryResponse(
        question=question,
        sql=sql,
        explanation=explanation,
        columns=columns,
        rows=limited_rows,
        row_count=len(rows),
        chart=chart,
        execution_time_ms=elapsed,
        error=None,
    )
