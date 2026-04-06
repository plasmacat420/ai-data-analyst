import re

from app.models import ChartConfig

DATE_PATTERNS = re.compile(r"date|time|month|year|week|day|period", re.IGNORECASE)
CATEGORY_PATTERNS = re.compile(
    r"name|category|type|status|region|department|product|city|label", re.IGNORECASE
)
NUMBER_PATTERNS = re.compile(
    r"int|float|real|numeric|double|decimal|count|sum|avg|total|revenue|salary|amount|score",
    re.IGNORECASE,
)


def _is_date_col(col: str) -> bool:
    return bool(DATE_PATTERNS.search(col))


def _is_category_col(col: str) -> bool:
    return bool(CATEGORY_PATTERNS.search(col))


def _is_number_col(col: str, values: list) -> bool:
    if NUMBER_PATTERNS.search(col):
        return True
    if values:
        try:
            float(values[0])
            return True
        except (TypeError, ValueError):
            return False
    return False


def suggest_chart(columns: list[str], rows: list[list], sql: str, question: str) -> ChartConfig:
    """Auto-detect the best chart type from data shape and question intent."""
    if not rows or not columns:
        return ChartConfig(type="none", title="No data to chart")

    # Single value result — no chart
    if len(rows) == 1 and len(columns) == 1:
        return ChartConfig(type="none", title="Single value result")

    q_lower = question.lower()

    # Identify column roles
    date_cols = [c for c in columns if _is_date_col(c)]
    cat_cols = [c for c in columns if _is_category_col(c) and not _is_date_col(c)]
    num_cols = [
        columns[i]
        for i, c in enumerate(columns)
        if _is_number_col(c, [row[i] for row in rows[:3] if i < len(row)])
    ]

    # Question intent overrides
    if any(w in q_lower for w in ["trend", "over time", "by month", "by year", "by week"]):
        x_col = date_cols[0] if date_cols else columns[0]
        y_col = num_cols[0] if num_cols else (columns[1] if len(columns) > 1 else columns[0])
        return ChartConfig(
            type="line",
            x_column=x_col,
            y_column=y_col,
            title=_make_title(question),
        )

    if any(w in q_lower for w in ["distribution", "breakdown", "share", "proportion", "percent"]):
        x_col = cat_cols[0] if cat_cols else columns[0]
        y_col = num_cols[0] if num_cols else (columns[1] if len(columns) > 1 else columns[0])
        if len(rows) <= 8:
            return ChartConfig(
                type="pie",
                x_column=x_col,
                y_column=y_col,
                title=_make_title(question),
            )

    # Data shape rules
    if len(columns) >= 2:
        # date + number → line
        if date_cols and num_cols:
            return ChartConfig(
                type="line",
                x_column=date_cols[0],
                y_column=num_cols[0],
                title=_make_title(question),
            )

        # category + number, small set → bar or pie
        if cat_cols and num_cols:
            x_col = cat_cols[0]
            y_col = num_cols[0]
            if len(rows) <= 8 and any(w in q_lower for w in ["distribution", "share", "breakdown"]):
                return ChartConfig(
                    type="pie", x_column=x_col, y_column=y_col, title=_make_title(question)
                )
            return ChartConfig(
                type="bar", x_column=x_col, y_column=y_col, title=_make_title(question)
            )

        # 2 numeric cols → scatter
        numeric_count = len(num_cols)
        if numeric_count >= 2:
            return ChartConfig(
                type="scatter",
                x_column=num_cols[0],
                y_column=num_cols[1],
                title=_make_title(question),
            )

        # fallback: first col as x, second as y
        return ChartConfig(
            type="bar",
            x_column=columns[0],
            y_column=columns[1],
            title=_make_title(question),
        )

    return ChartConfig(type="none", title="")


def _make_title(question: str) -> str:
    """Convert question to a clean chart title."""
    title = question.strip().rstrip("?").title()
    return title[:60] + "..." if len(title) > 60 else title
