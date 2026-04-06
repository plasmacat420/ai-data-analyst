from fastapi import APIRouter, HTTPException
from loguru import logger

from app.models import QueryRequest, QueryResponse
from app.routers.datasets import get_datasets
from app.services.analyst import run_analysis

router = APIRouter(prefix="/api/query", tags=["query"])


@router.post("", response_model=QueryResponse)
async def query(request: QueryRequest) -> QueryResponse:
    """Natural language → SQL → results → chart."""
    datasets = get_datasets()
    if request.dataset_id not in datasets:
        raise HTTPException(status_code=404, detail="Dataset not found")

    if not request.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty")

    logger.info(f"Query on {request.dataset_id}: {request.question[:80]}")

    return await run_analysis(
        dataset_id=request.dataset_id,
        question=request.question,
        conversation_history=request.conversation_history,
    )
