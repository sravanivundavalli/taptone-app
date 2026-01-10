# TapTone Backend

This is the FastAPI backend for the TapTone IoT ecosystem. It manages user collections, music metadata, NFC tag mappings, and audio streaming.

## Features

- **Session-based Auth:** HTTP-Only cookie authentication for the web dashboard with "Remember Me" support (up to 30 days).
- **Music Management:** Library management with automated metadata extraction and deterministic album art.
- **NFC Tag Sync:** Hardware-bound API for the Raspberry Pi player.
- **Audio Streaming:** Support for partial content (Range requests) for VLC playback.
- **Database:** SQLAlchemy with support for PostgreSQL (production) and SQLite (local dev).

## Project Structure

- `app/`: Core application logic (models, schemas, crud, api).
- `music_storage/`: Local directory where `.mp3` files are stored.
- `scripts/`: Utility scripts, including `seed_db.py` for initial setup.
- `Dockerfile`: Multi-stage build for production deployment.

## Running Locally

1. **Setup Virtual Environment:**
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```

2. **Configure Environment:**
   Create a `.env` file in the root or backend directory. For local development with SQLite, use:
   ```env
   DATABASE_URL=sqlite:///./taptone.db
   SECRET_KEY=your-secret-key-here
   ```
   For PostgreSQL (e.g., in production/docker), you can use individual variables:
   ```env
   POSTGRES_USER=user
   POSTGRES_PASSWORD=password
   POSTGRES_DB=taptone
   DB_HOST=localhost
   DB_PORT=5432
   ```

3. **Startup & Auto-Seeding:**
   The backend automatically seeds the admin user and the default music library from `music_storage/` on startup. Just start the server:
   ```bash
   uvicorn app.main:app --reload
   ```



4. **Start the Server:**
   ```bash
   uvicorn app.main:app --reload
   ```
   The API will be available at `http://localhost:8000`.
   Explore the interactive docs at `http://localhost:8000/docs`.

## Docker Usage

```bash
docker build -t taptone-backend .
docker run -p 8000:8000 taptone-backend
```
