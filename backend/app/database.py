from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

def get_database_url():
    url = os.getenv("DATABASE_URL")
    if url:
        return url
    
    user = os.getenv("POSTGRES_USER", "user")
    password = os.getenv("POSTGRES_PASSWORD", "password")
    db_name = os.getenv("POSTGRES_DB", "taptone")
    host = os.getenv("DB_HOST", "db")
    port = os.getenv("DB_PORT", "5432")
    
    return f"postgresql://{user}:{password}@{host}:{port}/{db_name}"

DATABASE_URL = get_database_url()

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
