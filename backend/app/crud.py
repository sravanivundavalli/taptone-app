from sqlalchemy.orm import Session
from typing import Optional, List, Any
from . import models, schemas, auth

def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

def create_user(db: Session, user: schemas.UserCreate):
    hashed_password = auth.get_password_hash(user.password)
    db_user = models.User(
        email=user.email,
        hashed_password=hashed_password,
        first_name=user.first_name,
        last_name=user.last_name,
        role="user"
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def get_songs(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Song).offset(skip).limit(limit).all()

def get_song(db: Session, song_id: int):
    return db.query(models.Song).filter(models.Song.id == song_id).first()

def create_song(db: Session, song: schemas.SongCreate):
    db_song = models.Song(**song.model_dump())
    db.add(db_song)
    db.commit()
    db.refresh(db_song)
    return db_song

def add_song_to_collection(db: Session, user_id: int, song_id: int):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    song = db.query(models.Song).filter(models.Song.id == song_id).first()
    if user and song:
        if song not in user.collection:
            user.collection.append(song)
            db.commit()
    return user

def get_user_collection(db: Session, user_id: int):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    return user.collection if user else []

def get_nfc_tags(db: Session, user_id: int):
    return db.query(models.NFCTag).filter(models.NFCTag.user_id == user_id).all()

def create_nfc_tag(db: Session, tag: schemas.NFCTagCreate, user_id: int):
    db_tag = models.NFCTag(tag_id=tag.tag_id, name=tag.name, user_id=user_id)
    db.add(db_tag)
    db.commit()
    db.refresh(db_tag)
    return db_tag

def update_nfc_tag(db: Session, tag_id: str, name: str, user_id: int):
    db_tag = db.query(models.NFCTag).filter(models.NFCTag.tag_id == tag_id, models.NFCTag.user_id == user_id).first()
    if db_tag:
        db_tag.name = name # type: ignore
        db.commit()
        db.refresh(db_tag)
    return db_tag

def update_tag_playlist(db: Session, tag_id: str, playlist_id: int | None, user_id: int):
    db_tag = db.query(models.NFCTag).filter(models.NFCTag.tag_id == tag_id, models.NFCTag.user_id == user_id).first()
    if not db_tag:
        return None
    
    db_tag.playlist_id = playlist_id # type: ignore
    db.commit()
    db.refresh(db_tag)
    return db_tag

def get_tag_playlist(db: Session, tag_id: str):
    db_tag = db.query(models.NFCTag).filter(models.NFCTag.tag_id == tag_id).first()
    if db_tag and db_tag.playlist:
        return db_tag.playlist
    return None

# Playlist operations
def get_playlists(db: Session, user_id: int):
    return db.query(models.Playlist).filter(models.Playlist.user_id == user_id).all()

def create_playlist(db: Session, playlist: schemas.PlaylistCreate, user_id: int):
    db_playlist = models.Playlist(name=playlist.name, user_id=user_id)
    db.add(db_playlist)
    db.commit()
    db.refresh(db_playlist)
    return db_playlist

def update_playlist(db: Session, playlist_id: int, playlist: schemas.PlaylistUpdate, user_id: int):
    db_playlist = db.query(models.Playlist).filter(models.Playlist.id == playlist_id, models.Playlist.user_id == user_id).first()
    if not db_playlist:
        return None
    db_playlist.name = playlist.name # type: ignore
    db.commit()
    db.refresh(db_playlist)
    return db_playlist

def update_playlist_songs(db: Session, playlist_id: int, song_ids: list[int], user_id: int):
    db_playlist = db.query(models.Playlist).filter(models.Playlist.id == playlist_id, models.Playlist.user_id == user_id).first()
    if not db_playlist:
        return None
    
    songs = db.query(models.Song).filter(models.Song.id.in_(song_ids)).all()
    db_playlist.songs = songs
    db.commit()
    db_playlist_refreshed = db.query(models.Playlist).filter(models.Playlist.id == playlist_id).first()
    return db_playlist_refreshed

def delete_nfc_tag(db: Session, tag_id: str, user_id: int):
    db_tag = db.query(models.NFCTag).filter(models.NFCTag.tag_id == tag_id, models.NFCTag.user_id == user_id).first()
    if db_tag:
        db.delete(db_tag)
        db.commit()
        return True
    return False

def delete_playlist(db: Session, playlist_id: int, user_id: int):
    db_playlist = db.query(models.Playlist).filter(models.Playlist.id == playlist_id, models.Playlist.user_id == user_id).first()
    if db_playlist:
        db.delete(db_playlist)
        db.commit()
        return True
    return False

# Device Operations
def get_device(db: Session, device_id: str):
    return db.query(models.Device).filter(models.Device.id == device_id).first()

def get_user_devices(db: Session, user_id: int):
    return db.query(models.Device).filter(models.Device.account_id == user_id).all()

def create_device(db: Session, device_id: str, name: Optional[str] = None):
    db_device = models.Device(id=device_id, name=name)
    db.add(db_device)
    db.commit()
    db.refresh(db_device)
    return db_device

def update_device_heartbeat(db: Session, device_id: str):
    import time
    db_device = get_device(db, device_id)
    if db_device:
        db_device.last_seen = float(time.time()) # type: ignore
        db.commit()
    return db_device

def delete_device(db: Session, device_id: str, user_id: int):
    db_device = db.query(models.Device).filter(models.Device.id == device_id, models.Device.account_id == user_id).first()
    if db_device:
        db.delete(db_device)
        db.commit()
        return True
    return False

# Command Operations
def create_command(db: Session, device_id: str, command_type: str, payload: Optional[str] = None):
    import time
    db_command = models.Command(
        device_id=device_id,
        command_type=command_type,
        payload=payload,
        status="pending",
        created_at=float(time.time())
    )
    db.add(db_command)
    db.commit()
    db.refresh(db_command)
    return db_command

def get_pending_commands(db: Session, device_id: str):
    return db.query(models.Command).filter(
        models.Command.device_id == device_id,
        models.Command.status == "pending"
    ).order_by(models.Command.created_at.asc()).all()

def ack_command(db: Session, command_id: int):
    db_command = db.query(models.Command).filter(models.Command.id == command_id).first()
    if db_command:
        db_command.status = "acked" # type: ignore
        db.commit()
    return db_command

# Claim Code Operations
def create_claim_code(db: Session, device_id: str):
    import random
    import string
    import time
    # Generate 6-digit code
    code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
    
    # Delete existing codes for this device
    db.query(models.ClaimCode).filter(models.ClaimCode.device_id == device_id).delete()
    
    db_claim = models.ClaimCode(
        code=code,
        device_id=device_id,
        expires_at=float(time.time() + 600) # 10 minutes
    )
    db.add(db_claim)
    db.commit()
    db.refresh(db_claim)
    return db_claim

def verify_claim_code(db: Session, code: str, user_id: int):
    import time
    db_claim = db.query(models.ClaimCode).filter(
        models.ClaimCode.code == code,
        models.ClaimCode.expires_at > float(time.time())
    ).first()
    
    if db_claim:
        db_device = get_device(db, str(db_claim.device_id))
        if db_device:
            db_device.account_id = int(user_id) # type: ignore
            db.delete(db_claim)
            db.commit()
            return db_device
    return None
