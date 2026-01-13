import os
import time
import json
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

init_db()

app = FastAPI(title="TapTone API")

# CORS configuration
origins_str = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,https://taptone-pi.vundavalli.me")
origins = [origin.strip() for origin in origins_str.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
        secure=False 
    )
    return {"message": "Logged in successfully", "user": schemas.User.model_validate(db_user)}

@app.post("/auth/logout")
def logout(response: Response):
    response.delete_cookie("session")
    return {"message": "Logged out successfully"}

@app.get("/auth/me", response_model=schemas.User)
def read_users_me(current_user: models.User = Depends(dependencies.get_current_user)):
    return current_user

# Device Management Endpoints
@app.post("/api/v1/devices/register", response_model=schemas.Device)
def register_device(device_id: str, name: Optional[str] = None, db: Session = Depends(get_db)):
    db_device = crud.get_device(db, device_id)
    if not db_device:
        db_device = crud.create_device(db, device_id, name if name else "")
    return db_device

@app.get("/api/v1/devices/me", response_model=schemas.Device)
def get_current_device(device_id: str, db: Session = Depends(get_db)):
    db_device = crud.get_device(db, device_id)
    if not db_device:
        raise HTTPException(status_code=404, detail="Device not found")
    return db_device

@app.post("/api/v1/devices/heartbeat")
def device_heartbeat(device_id: str, db: Session = Depends(get_db)):
    crud.update_device_heartbeat(db, device_id)
    return {"status": "ok"}

@app.post("/api/v1/devices/claim-request", response_model=schemas.ClaimCode)
def request_claim_code(device_id: str, db: Session = Depends(get_db)):
    return crud.create_claim_code(db, device_id)

@app.post("/api/v1/devices/claim-verify")
def verify_claim(code: str, current_user: models.User = Depends(dependencies.get_current_user), db: Session = Depends(get_db)):
    db_device = crud.verify_claim_code(db, code, current_user.id) # type: ignore
    if not db_device:
        raise HTTPException(status_code=400, detail="Invalid or expired claim code")
    return {"message": "Device claimed successfully", "device": schemas.Device.model_validate(db_device)}

@app.get("/api/v1/my-devices", response_model=List[schemas.Device])
def get_my_devices(current_user: models.User = Depends(dependencies.get_current_user), db: Session = Depends(get_db)):
    return crud.get_user_devices(db, current_user.id) # type: ignore

@app.delete("/api/v1/devices/{device_id}")
def remove_device(device_id: str, current_user: models.User = Depends(dependencies.get_current_user), db: Session = Depends(get_db)):
    success = crud.delete_device(db, device_id, current_user.id) # type: ignore
    if not success:
        raise HTTPException(status_code=404, detail="Device not found")
    return {"message": "Device removed"}

# Event Ingestion (from Arduinos)
@app.post("/api/v1/events/nfc")
def event_nfc(tag_uid: str, account_id: int, db: Session = Depends(get_db)):
    tag = db.query(models.NFCTag).filter(models.NFCTag.tag_id == tag_uid, models.NFCTag.user_id == account_id).first()
    if not tag or tag.playlist_id is None:
        return {"status": "ignored", "reason": "tag_not_linked"}
    
    devices = crud.get_user_devices(db, account_id)
    for device in devices:
        payload = json.dumps({"playlist_id": tag.playlist_id})
        crud.create_command(db, str(device.id), "LOAD_PLAYLIST", payload)
    
    return {"status": "success", "commands_queued": len(devices)}

@app.post("/api/v1/events/button")
def event_button(control: str, account_id: int, db: Session = Depends(get_db)):
    cmd_map = {"prev": "PREV", "play_pause": "PLAY_PAUSE", "next": "NEXT"}
    cmd_type = cmd_map.get(control)
    if not cmd_type:
        raise HTTPException(status_code=400, detail="Invalid control type")
    
    devices = crud.get_user_devices(db, account_id)
    for device in devices:
        crud.create_command(db, str(device.id), cmd_type)
        
    return {"status": "success", "commands_queued": len(devices)}

@app.post("/api/v1/events/encoder")
def event_encoder(delta: int, account_id: int, db: Session = Depends(get_db)):
    devices = crud.get_user_devices(db, account_id)
    for device in devices:
        payload = json.dumps({"delta": delta})
        crud.create_command(db, str(device.id), "VOLUME_DELTA", payload)
        
    return {"status": "success", "commands_queued": len(devices)}

# Kiosk Polling & Ack
@app.get("/api/v1/devices/{device_id}/commands", response_model=List[schemas.Command])
def get_commands(device_id: str, db: Session = Depends(get_db)):
    return crud.get_pending_commands(db, device_id)

@app.post("/api/v1/devices/commands/{command_id}/ack")
def ack_command(command_id: int, db: Session = Depends(get_db)):
    crud.ack_command(db, command_id)
    return {"status": "ok"}

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
    
    if not image_url:
        import hashlib
        seed_str = f"{artist}-{title}".lower()
        seed_hash = hashlib.md5(seed_str.encode()).hexdigest()[:6]
        image_url = f"https://picsum.photos/seed/{seed_hash}/400/400"

    db_song = models.Song(
        title=title, artist=artist, genre=genre, price=price,
        image_url=image_url, file_path=file.filename
    )
    db.add(db_song)
    db.commit()
    db.refresh(db_song)
    return db_song

@app.get("/my-collection", response_model=List[schemas.Song])
def read_my_collection(current_user: models.User = Depends(dependencies.get_current_user), db: Session = Depends(get_db)):
    return crud.get_user_collection(db, user_id=current_user.id) # type: ignore

@app.get("/tags", response_model=List[schemas.NFCTag])
def read_my_tags(current_user: models.User = Depends(dependencies.get_current_user), db: Session = Depends(get_db)):
    return crud.get_nfc_tags(db, user_id=current_user.id) # type: ignore

@app.post("/tags", response_model=schemas.NFCTag)
def register_tag(tag: schemas.NFCTagCreate, current_user: models.User = Depends(dependencies.get_current_user), db: Session = Depends(get_db)):
    tags_count = db.query(models.NFCTag).filter(models.NFCTag.tag_id == tag.tag_id).count()
    if tags_count > 0:
        existing_tag = db.query(models.NFCTag).filter(models.NFCTag.tag_id == tag.tag_id).first()
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

@app.get("/hardware/sync/{tag_id}")
def sync_hardware(tag_id: str, db: Session = Depends(get_db)):
    playlist = crud.get_tag_playlist(db, tag_id=tag_id)
    if playlist is None:
        raise HTTPException(status_code=404, detail="Tag not registered or no playlist linked")
    return {
        "playlist_name": playlist.name,
        "songs": [
            {
                "id": song.id, "title": song.title, "artist": song.artist,
                "genre": song.genre, "url": f"/stream/{song.id}"
            }
            for song in playlist.songs
        ]
    }

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
    if range_header:
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
            range_stream(), status_code=206,
            headers={
                "Content-Range": f"bytes {start}-{end}/{file_size}",
                "Accept-Ranges": "bytes", "Content-Length": str(chunk_size),
                "Content-Type": "audio/mpeg",
            },
        )
    return FileResponse(path, media_type="audio/mpeg")
