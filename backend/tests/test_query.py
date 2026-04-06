import json
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.services.chart import suggest_chart


def _mock_openai_response(sql: str, explanation: str = "Test explanation"):
    """Build a mock OpenAI chat completion response."""
    mock_msg = MagicMock()
    mock_msg.content = json.dumps({"sql": sql, "explanation": explanation})
    mock_choice = MagicMock()
    mock_choice.message = mock_msg
    mock_response = MagicMock()
    mock_response.choices = [mock_choice]
    return mock_response


@pytest.fixture()
def loaded_sales(client):
    res = client.post("/api/datasets/sample/sales")
    assert res.status_code == 200
    return res.json()["id"]


@patch("app.services.analyst.AsyncOpenAI")
def test_query_top_products(mock_openai_cls, client, loaded_sales):
    sql = (
        "SELECT product, SUM(revenue) AS total_revenue "
        "FROM data GROUP BY product ORDER BY total_revenue DESC LIMIT 5"
    )
    mock_client = AsyncMock()
    mock_openai_cls.return_value = mock_client
    mock_client.chat.completions.create = AsyncMock(
        return_value=_mock_openai_response(sql, "Top 5 products by revenue")
    )

    response = client.post(
        "/api/query",
        json={
            "dataset_id": loaded_sales,
            "question": "What are the top 5 products by revenue?",
            "conversation_history": [],
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["sql"] == sql
    assert len(data["columns"]) == 2
    assert "product" in data["columns"]
    assert data["row_count"] <= 5
    assert data["error"] is None


@patch("app.services.analyst.AsyncOpenAI")
def test_query_rejects_insert(mock_openai_cls, client, loaded_sales):
    mock_client = AsyncMock()
    mock_openai_cls.return_value = mock_client
    mock_client.chat.completions.create = AsyncMock(
        return_value=_mock_openai_response(
            "INSERT INTO data (product) VALUES ('hack')", "Injected SQL"
        )
    )

    response = client.post(
        "/api/query",
        json={
            "dataset_id": loaded_sales,
            "question": "Insert a row",
            "conversation_history": [],
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["error"] is not None
    assert "SELECT" in data["error"] or "permitted" in data["error"]


@patch("app.services.analyst.AsyncOpenAI")
def test_query_rejects_drop(mock_openai_cls, client, loaded_sales):
    mock_client = AsyncMock()
    mock_openai_cls.return_value = mock_client
    mock_client.chat.completions.create = AsyncMock(
        return_value=_mock_openai_response("DROP TABLE data", "Dangerous SQL")
    )

    response = client.post(
        "/api/query",
        json={
            "dataset_id": loaded_sales,
            "question": "Drop the table",
            "conversation_history": [],
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["error"] is not None


def test_chart_suggestion_bar():
    columns = ["product", "total_revenue"]
    rows = [["Widget A", 12345.0], ["Widget B", 9876.0], ["Widget C", 7654.0]]
    chart = suggest_chart(columns, rows, "SELECT product, SUM(revenue) FROM data", "top products")
    assert chart.type == "bar"
    assert chart.x_column == "product"
    assert chart.y_column == "total_revenue"


def test_chart_suggestion_line():
    columns = ["order_date", "daily_revenue"]
    rows = [["2024-01-01", 500.0], ["2024-01-02", 620.0], ["2024-01-03", 480.0]]
    chart = suggest_chart(
        columns, rows, "SELECT order_date, SUM(amount) FROM data", "revenue trend over time"
    )
    assert chart.type == "line"
    assert chart.x_column == "order_date"


def test_chart_suggestion_pie():
    columns = ["category", "total"]
    rows = [["Electronics", 5000], ["Clothing", 3000], ["Food", 1500]]
    chart = suggest_chart(
        columns,
        rows,
        "SELECT category, SUM(revenue) FROM data GROUP BY category",
        "revenue breakdown by category",
    )
    assert chart.type == "pie"


def test_chart_suggestion_none_single_value():
    columns = ["total_revenue"]
    rows = [[98765.43]]
    chart = suggest_chart(columns, rows, "SELECT SUM(revenue) FROM data", "total revenue")
    assert chart.type == "none"


def test_chart_suggestion_scatter():
    columns = ["salary", "performance_score"]
    rows = [[75000, 4.2], [55000, 3.1], [120000, 4.8]]
    chart = suggest_chart(
        columns,
        rows,
        "SELECT salary, performance_score FROM data",
        "correlation between salary and performance",
    )
    assert chart.type == "scatter"


def test_query_nonexistent_dataset(client):
    response = client.post(
        "/api/query",
        json={
            "dataset_id": "does-not-exist",
            "question": "What is the total revenue?",
            "conversation_history": [],
        },
    )
    assert response.status_code == 404
