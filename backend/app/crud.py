from sqlalchemy.orm import Session
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
    db.refresh(db_playlist)
    return db_playlist

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
