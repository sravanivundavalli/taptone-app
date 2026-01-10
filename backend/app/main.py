import os
import time
from datetime import timedelta
from fastapi import FastAPI, Depends, HTTPException, status, Response, Request, UploadFile, File, Form
import shutil
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy.exc import OperationalError
from typing import List, Any, Optional
import aiofiles
import logging

from sqlalchemy import text
from . import models, schemas, crud, auth, database, dependencies, seed
from .database import engine, get_db, SessionLocal

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create tables and auto-seed with retry logic for DB readiness
def init_db():
    retries = 5
    while retries > 0:
        try:
            logger.info("Attempting to connect to database and initialize...")
            models.Base.metadata.create_all(bind=engine)
            
            db = SessionLocal()
            try:
                seed.auto_seed_data(db)
            finally:
                db.close()
            
            logger.info("Database initialization and seeding successful.")
            break
        except OperationalError as e:
            retries -= 1
            logger.error(f"Database connection failed. Retrying in 5 seconds... ({retries} retries left)")
            time.sleep(5)
    
    if retries == 0:
        logger.critical("Could not connect to database after multiple retries. Exiting.")
        # We don't exit here to allow FastAPI to start, but many endpoints will fail.

init_db()

app = FastAPI(title="TapTone API")

# Health check endpoint
@app.get("/health")
def health_check(db: Session = Depends(get_db)):
    try:
        # Check DB connection
        db.execute(text("SELECT 1"))
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        return {"status": "unhealthy", "database": str(e)}, 503

# CORS configuration
origins = [
    "http://localhost:5173",  # Vite dev
    "http://localhost",       # Nginx production (docker-compose)
    "http://localhost:80",    # Nginx production explicit
    "https://taptone.vundavalli.me",
    "https://taptone.netlify.app",
]

# Allow any origin in development if needed, but better to be explicit
# You could also use os.getenv("ALLOWED_ORIGINS").split(",") 

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Use absolute path based on CWD to avoid issues with __file__ in some environments,
# but allow it to be relative to where the server is started.
MUSIC_STORAGE_PATH = os.path.join(os.getcwd(), "music_storage")

# Auth Endpoints
@app.post("/auth/signup", response_model=schemas.User)
def signup(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    return crud.create_user(db=db, user=user)

@app.post("/auth/login")
def login(response: Response, user: schemas.UserCreate, remember_me: bool = False, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_email(db, email=user.email)
    if not db_user or not auth.verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    
    expires_minutes = auth.ACCESS_TOKEN_EXPIRE_MINUTES_LONG if remember_me else auth.ACCESS_TOKEN_EXPIRE_MINUTES
    access_token_expires = timedelta(minutes=expires_minutes)
    access_token = auth.create_access_token(
        data={"sub": db_user.email}, expires_delta=access_token_expires
    )
    
    response.set_cookie(
        key="session", 
        value=access_token, 
        httponly=True, 
        max_age=expires_minutes * 60, 
        samesite="lax",
        secure=False # Set to True in production with HTTPS
    )
    return {"message": "Logged in successfully", "user": schemas.User.model_validate(db_user)}

@app.post("/auth/logout")
def logout(response: Response):
    response.delete_cookie("session")
    return {"message": "Logged out successfully"}

@app.get("/auth/me", response_model=schemas.User)
def read_users_me(current_user: models.User = Depends(dependencies.get_current_user)):
    return current_user

# Music Store Endpoints
@app.get("/songs", response_model=List[schemas.Song])
def read_songs(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_songs(db, skip=skip, limit=limit)

@app.post("/songs/{song_id}/purchase")
def purchase_song(song_id: int, current_user: models.User = Depends(dependencies.get_current_user), db: Session = Depends(get_db)):
    crud.add_song_to_collection(db, user_id=current_user.id, song_id=song_id) # type: ignore
    return {"message": "Song added to collection"}

@app.put("/songs/{song_id}")
def update_song(song_id: int, song_update: schemas.SongBase, db: Session = Depends(get_db)):
    db_song = crud.get_song(db, song_id=song_id)
    if not db_song:
        raise HTTPException(status_code=404, detail="Song not found")
    
    # Update attributes
    for key, value in song_update.model_dump().items():
        setattr(db_song, key, value)
    
    db.commit()
    db.refresh(db_song)
    return db_song

@app.delete("/songs/{song_id}")
def delete_song(song_id: int, db: Session = Depends(get_db)):
    song = crud.get_song(db, song_id=song_id)
    if not song:
        raise HTTPException(status_code=404, detail="Song not found")
    
    # Delete file
    file_path = os.path.join(MUSIC_STORAGE_PATH, str(song.file_path))
    if os.path.exists(file_path):
        os.remove(file_path)
        
    db.delete(song)
    db.commit()
    return {"message": "Song deleted"}

@app.post("/songs/upload")
async def upload_song(
    title: str = Form(...),
    artist: str = Form(...),
    genre: str = Form(...),
    price: float = Form(0.99),
    image_url: Optional[str] = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    if file.filename is None:
        raise HTTPException(status_code=400, detail="File name missing")
    file_location = os.path.join(MUSIC_STORAGE_PATH, file.filename)
    with open(file_location, "wb+") as file_object:
        shutil.copyfileobj(file.file, file_object)
    
    # If no image_url provided, generate one
    if not image_url:
        import hashlib
        seed_str = f"{artist}-{title}".lower()
        seed_hash = hashlib.md5(seed_str.encode()).hexdigest()[:6]
        image_url = f"https://picsum.photos/seed/{seed_hash}/400/400"

    db_song = models.Song(
        title=title,
        artist=artist,
        genre=genre,
        price=price,
        image_url=image_url,
        file_path=file.filename
    )
    db.add(db_song)
    db.commit()
    db.refresh(db_song)
    return db_song

# User Collection
@app.get("/my-collection", response_model=List[schemas.Song])
def read_my_collection(current_user: models.User = Depends(dependencies.get_current_user), db: Session = Depends(get_db)):
    return crud.get_user_collection(db, user_id=current_user.id) # type: ignore

# NFC Tag Management
@app.get("/tags", response_model=List[schemas.NFCTag])
def read_my_tags(current_user: models.User = Depends(dependencies.get_current_user), db: Session = Depends(get_db)):
    return crud.get_nfc_tags(db, user_id=current_user.id) # type: ignore

@app.post("/tags", response_model=schemas.NFCTag)
def register_tag(tag: schemas.NFCTagCreate, current_user: models.User = Depends(dependencies.get_current_user), db: Session = Depends(get_db)):
    # Check if tag is already registered globally
    # Using explicit query to check for uniqueness
    tags_count = db.query(models.NFCTag).filter(models.NFCTag.tag_id == tag.tag_id).count()
    if tags_count > 0:
        # Get the specific tag to see who owns it
        existing_tag = db.query(models.NFCTag).filter(models.NFCTag.tag_id == tag.tag_id).first()
        
        # We need to access attributes directly to avoid type-check ambiguity in some environments
        is_owner = getattr(existing_tag, "user_id", None) == current_user.id
        
        if is_owner:
            raise HTTPException(status_code=400, detail="You have already registered this tag")
        else:
            raise HTTPException(status_code=400, detail="This tag is already registered by another user")
    
    return crud.create_nfc_tag(db, tag=tag, user_id=current_user.id) # type: ignore

@app.patch("/tags/{tag_id}")
def update_tag_info(tag_id: str, name: str, current_user: models.User = Depends(dependencies.get_current_user), db: Session = Depends(get_db)):
    updated_tag = crud.update_nfc_tag(db, tag_id=tag_id, name=name, user_id=current_user.id) # type: ignore
    if not updated_tag:
        raise HTTPException(status_code=404, detail="Tag not found")
    return updated_tag

@app.put("/tags/{tag_id}/playlist")
def update_tag_playlist_link(tag_id: str, payload: dict, current_user: models.User = Depends(dependencies.get_current_user), db: Session = Depends(get_db)):
    playlist_id = payload.get("playlist_id")
    updated_tag = crud.update_tag_playlist(db, tag_id=tag_id, playlist_id=playlist_id, user_id=current_user.id) # type: ignore
    if not updated_tag:
        raise HTTPException(status_code=404, detail="Tag not found or not owned by user")
    return {"message": "Playlist linked to tag"}

@app.delete("/tags/{tag_id}")
def delete_tag(tag_id: str, current_user: models.User = Depends(dependencies.get_current_user), db: Session = Depends(get_db)):
    success = crud.delete_nfc_tag(db, tag_id=tag_id, user_id=current_user.id) # type: ignore
    if not success:
        raise HTTPException(status_code=404, detail="Tag not found or not owned by user")
    return {"message": "Tag deleted successfully"}

# Playlist Endpoints
@app.get("/playlists", response_model=List[schemas.Playlist])
def read_my_playlists(current_user: models.User = Depends(dependencies.get_current_user), db: Session = Depends(get_db)):
    return crud.get_playlists(db, user_id=current_user.id) # type: ignore

@app.post("/playlists", response_model=schemas.Playlist)
def create_playlist(playlist: schemas.PlaylistCreate, current_user: models.User = Depends(dependencies.get_current_user), db: Session = Depends(get_db)):
    return crud.create_playlist(db, playlist=playlist, user_id=current_user.id) # type: ignore

@app.put("/playlists/{playlist_id}", response_model=schemas.Playlist)
def update_playlist_name(playlist_id: int, playlist: schemas.PlaylistUpdate, current_user: models.User = Depends(dependencies.get_current_user), db: Session = Depends(get_db)):
    updated = crud.update_playlist(db, playlist_id=playlist_id, playlist=playlist, user_id=current_user.id) # type: ignore
    if not updated:
        raise HTTPException(status_code=404, detail="Playlist not found")
    return updated

@app.put("/playlists/{playlist_id}/songs")
def update_songs_in_playlist(playlist_id: int, song_ids: List[int], current_user: models.User = Depends(dependencies.get_current_user), db: Session = Depends(get_db)):
    updated = crud.update_playlist_songs(db, playlist_id=playlist_id, song_ids=song_ids, user_id=current_user.id) # type: ignore
    if not updated:
        raise HTTPException(status_code=404, detail="Playlist not found")
    return {"message": "Playlist songs updated"}

@app.delete("/playlists/{playlist_id}")
def delete_user_playlist(playlist_id: int, current_user: models.User = Depends(dependencies.get_current_user), db: Session = Depends(get_db)):
    success = crud.delete_playlist(db, playlist_id=playlist_id, user_id=current_user.id) # type: ignore
    if not success:
        raise HTTPException(status_code=404, detail="Playlist not found")
    return {"message": "Playlist deleted"}

# Hardware API (Stateless)
@app.get("/hardware/sync/{tag_id}")
def sync_hardware(tag_id: str, db: Session = Depends(get_db)):
    playlist = crud.get_tag_playlist(db, tag_id=tag_id)
    if playlist is None:
        raise HTTPException(status_code=404, detail="Tag not registered or no playlist linked")
    
    # Return playlist metadata and song list
    return {
        "playlist_name": playlist.name,
        "songs": [
            {
                "id": song.id,
                "title": song.title,
                "artist": song.artist,
                "genre": song.genre,
                "url": f"/stream/{song.id}"
            }
            for song in playlist.songs
        ]
    }

# Streaming with Range Support
@app.get("/stream/{song_id}")
async def stream_song(song_id: int, request: Request, db: Session = Depends(get_db)):
    song = crud.get_song(db, song_id=song_id)
    if not song:
        raise HTTPException(status_code=404, detail="Song not found")
    
    path = os.path.join(MUSIC_STORAGE_PATH, str(song.file_path))
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Audio file missing")

    file_size = os.path.getsize(path)
    range_header = request.headers.get("range")
    
    # Handle Proxy Headers (X-Forwarded-For etc) if behind Nginx
    # FastApi/Starlette handles this mostly, but good to keep in mind
    
    if range_header:
        # Example: bytes=0-1024
        byte_range = range_header.replace("bytes=", "").split("-")
        start = int(byte_range[0])
        end = int(byte_range[1]) if byte_range[1] else file_size - 1
        
        if start >= file_size:
            raise HTTPException(status_code=416, detail="Requested range not satisfiable")
            
        chunk_size = (end - start) + 1
        
        async def range_stream():
            async with aiofiles.open(path, mode="rb") as f:
                await f.seek(start)
                content = await f.read(chunk_size)
                yield content

        return StreamingResponse(
            range_stream(),
            status_code=206,
            headers={
                "Content-Range": f"bytes {start}-{end}/{file_size}",
                "Accept-Ranges": "bytes",
                "Content-Length": str(chunk_size),
                "Content-Type": "audio/mpeg",
            },
        )
    
    return FileResponse(path, media_type="audio/mpeg")
