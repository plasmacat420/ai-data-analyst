import shutil
import uuid
from pathlib import Path

from fastapi import APIRouter, HTTPException, UploadFile
from loguru import logger

from app.config import settings
from app.models import DatasetInfo
from app.services.dataset import ingest_csv

router = APIRouter(prefix="/api/datasets", tags=["datasets"])

# In-memory registry keyed by dataset_id
_datasets: dict[str, DatasetInfo] = {}

SAMPLE_NAMES = {"sales", "employees", "ecommerce"}


def get_datasets() -> dict[str, DatasetInfo]:
    return _datasets


@router.post("/upload", response_model=DatasetInfo)
async def upload_csv(file: UploadFile) -> DatasetInfo:
    """Upload a CSV file (max 10 MB) and ingest it."""
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are accepted")

    content = await file.read()
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="File exceeds 10 MB limit")

    dataset_id = str(uuid.uuid4())
    upload_dir = Path(settings.UPLOAD_DIR)
    upload_dir.mkdir(parents=True, exist_ok=True)

    tmp_path = upload_dir / f"{dataset_id}_raw.csv"
    tmp_path.write_bytes(content)

    try:
        info = await ingest_csv(tmp_path, dataset_id, file.filename)
    finally:
        tmp_path.unlink(missing_ok=True)

    _datasets[dataset_id] = info
    logger.info(f"Uploaded dataset {dataset_id}: {file.filename} ({info.rows} rows)")
    return info


@router.post("/sample/{name}", response_model=DatasetInfo)
async def load_sample(name: str) -> DatasetInfo:
    """Load one of the built-in sample datasets instantly."""
    if name not in SAMPLE_NAMES:
        raise HTTPException(
            status_code=404,
            detail=f"Unknown sample. Choose from: {', '.join(sorted(SAMPLE_NAMES))}",
        )

    # Check if already loaded
    for ds in _datasets.values():
        if ds.filename == f"{name}.csv":
            return ds

    sample_path = Path(__file__).parent.parent.parent / "sample_data" / f"{name}.csv"
    if not sample_path.exists():
        raise HTTPException(status_code=500, detail=f"Sample data file not found: {name}.csv")

    dataset_id = str(uuid.uuid4())
    upload_dir = Path(settings.UPLOAD_DIR)
    upload_dir.mkdir(parents=True, exist_ok=True)

    dest = upload_dir / f"{dataset_id}_raw.csv"
    shutil.copy(sample_path, dest)

    try:
        info = await ingest_csv(dest, dataset_id, f"{name}.csv")
    finally:
        dest.unlink(missing_ok=True)

    _datasets[dataset_id] = info
    logger.info(f"Loaded sample dataset '{name}' as {dataset_id}")
    return info


@router.get("", response_model=list[DatasetInfo])
async def list_datasets() -> list[DatasetInfo]:
    """List all currently loaded datasets."""
    return list(_datasets.values())


@router.get("/{dataset_id}", response_model=DatasetInfo)
async def get_dataset(dataset_id: str) -> DatasetInfo:
    """Return full DatasetInfo including preview."""
    if dataset_id not in _datasets:
        raise HTTPException(status_code=404, detail="Dataset not found")
    return _datasets[dataset_id]


@router.delete("/{dataset_id}")
async def delete_dataset(dataset_id: str) -> dict:
    """Remove dataset from memory and delete its SQLite file."""
    if dataset_id not in _datasets:
        raise HTTPException(status_code=404, detail="Dataset not found")

    db_path = Path(settings.UPLOAD_DIR) / f"{dataset_id}.db"
    db_path.unlink(missing_ok=True)
    del _datasets[dataset_id]
    logger.info(f"Deleted dataset {dataset_id}")
    return {"deleted": dataset_id}
