from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger

from app.config import settings
from app.routers import datasets as datasets_router
from app.routers import query as query_router
from app.routers.datasets import load_sample


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    upload_dir = Path(settings.UPLOAD_DIR)
    upload_dir.mkdir(parents=True, exist_ok=True)
    logger.info(f"Upload dir ready: {upload_dir.resolve()}")

    # Pre-load all 3 sample datasets
    for name in ("sales", "employees", "ecommerce"):
        try:
            info = await load_sample(name)
            logger.info(f"Pre-loaded sample '{name}': {info.rows} rows → {info.id}")
        except Exception as e:
            logger.warning(f"Could not pre-load sample '{name}': {e}")

    yield
    # Shutdown — nothing to clean up


app = FastAPI(
    title="AI Data Analyst",
    description="Ask questions about your data in plain English. Get SQL, charts, and insights instantly.",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(datasets_router.router)
app.include_router(query_router.router)


@app.get("/health")
async def health() -> dict:
    return {"status": "ok", "version": "0.1.0"}
