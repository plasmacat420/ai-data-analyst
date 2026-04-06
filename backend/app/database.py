from pathlib import Path

import aiosqlite


async def execute_query(db_path: Path, sql: str) -> tuple[list[str], list[list]]:
    """Execute a SELECT query and return (columns, rows)."""
    async with aiosqlite.connect(db_path) as db:
        db.row_factory = None
        async with db.execute(sql) as cursor:
            columns = [desc[0] for desc in cursor.description] if cursor.description else []
            rows = await cursor.fetchall()
            return columns, [list(row) for row in rows]
