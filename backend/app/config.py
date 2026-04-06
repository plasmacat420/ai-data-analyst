from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    GROQ_API_KEY: str = ""
    UPLOAD_DIR: str = "./uploads"
    MAX_ROWS_IN_CONTEXT: int = 50
    MAX_RESULT_ROWS: int = 500
    CORS_ORIGINS: list[str] = ["http://localhost:5173", "https://plasmacat420.github.io"]

    class Config:
        env_file = ".env"


settings = Settings()
