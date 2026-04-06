from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.config import settings


@pytest.fixture(autouse=True)
def tmp_upload_dir(tmp_path, monkeypatch):
    """Redirect uploads to a temp directory for each test."""
    monkeypatch.setattr(settings, "UPLOAD_DIR", str(tmp_path))
    yield tmp_path
    # cleanup handled by pytest tmp_path


@pytest.fixture()
def client(tmp_upload_dir):
    """FastAPI test client with fresh dataset registry."""
    # Clear dataset registry between tests
    from app.routers.datasets import _datasets

    _datasets.clear()

    from app.main import app

    with TestClient(app, raise_server_exceptions=True) as c:
        yield c
    _datasets.clear()


@pytest.fixture()
def sales_csv_path() -> Path:
    """Return path to the real sample sales CSV."""
    return Path(__file__).parent.parent / "sample_data" / "sales.csv"
