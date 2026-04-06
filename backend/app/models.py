from pydantic import BaseModel


class DatasetInfo(BaseModel):
    id: str
    name: str
    filename: str
    rows: int
    columns: list[str]
    dtypes: dict[str, str]
    preview: list[dict]
    uploaded_at: str
    size_bytes: int


class QueryRequest(BaseModel):
    dataset_id: str
    question: str
    conversation_history: list[dict] = []


class ChartConfig(BaseModel):
    type: str  # bar | line | pie | area | scatter | none
    x_column: str | None = None
    y_column: str | None = None
    title: str = ""
    color: str = "#7C3AED"


class QueryResponse(BaseModel):
    question: str
    sql: str
    explanation: str
    columns: list[str]
    rows: list[list]
    row_count: int
    chart: ChartConfig
    execution_time_ms: int
    error: str | None = None
