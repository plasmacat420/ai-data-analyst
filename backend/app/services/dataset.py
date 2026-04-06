import asyncio
from datetime import datetime, timezone
from pathlib import Path

import aiosqlite
import pandas as pd

from app.config import settings
from app.models import DatasetInfo


async def ingest_csv(file_path: Path, dataset_id: str, filename: str) -> DatasetInfo:
    """Load CSV, save as SQLite, return DatasetInfo."""
    try:
        df = pd.read_csv(file_path, encoding="utf-8")
    except UnicodeDecodeError:
        df = pd.read_csv(file_path, encoding="latin-1")

    # Normalize column names
    df.columns = [col.strip().lower().replace(" ", "_") for col in df.columns]

    db_path = Path(settings.UPLOAD_DIR) / f"{dataset_id}.db"

    # Write to SQLite in thread pool to avoid blocking
    def _write_sqlite():
        import sqlite3

        conn = sqlite3.connect(db_path)
        df.to_sql("data", conn, if_exists="replace", index=False)
        conn.close()

    await asyncio.get_event_loop().run_in_executor(None, _write_sqlite)

    dtypes = {col: str(df[col].dtype) for col in df.columns}
    preview = df.head(5).where(pd.notnull(df.head(5)), None).to_dict(orient="records")

    return DatasetInfo(
        id=dataset_id,
        name=filename.replace(".csv", "").replace("_", " ").title(),
        filename=filename,
        rows=len(df),
        columns=list(df.columns),
        dtypes=dtypes,
        preview=preview,
        uploaded_at=datetime.now(timezone.utc).isoformat(),
        size_bytes=file_path.stat().st_size,
    )


async def get_schema_string(dataset_id: str) -> str:
    """Return a clean schema string for the LLM with example values."""
    db_path = Path(settings.UPLOAD_DIR) / f"{dataset_id}.db"

    async with aiosqlite.connect(db_path) as db:
        # Get total row count
        async with db.execute("SELECT COUNT(*) FROM data") as cursor:
            row = await cursor.fetchone()
            row_count = row[0] if row else 0

        # Get column info
        async with db.execute("PRAGMA table_info(data)") as cursor:
            cols_info = await cursor.fetchall()

        lines = ["Table: data", "Columns:"]
        for col_info in cols_info:
            col_name = col_info[1]
            col_type = col_info[2]

            # Get sample values
            async with db.execute(
                f'SELECT DISTINCT "{col_name}" FROM data WHERE "{col_name}" IS NOT NULL LIMIT 3'
            ) as cursor:
                samples = await cursor.fetchall()
            sample_vals = ", ".join(str(s[0]) for s in samples)
            lines.append(f"  - {col_name} ({col_type}) — example values: {sample_vals}")

        lines.append(f"Rows: {row_count}")
        return "\n".join(lines)
