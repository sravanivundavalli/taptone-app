from sqlalchemy import Column, Integer, String, ForeignKey, Table, Boolean, Float
from sqlalchemy.orm import relationship
from .database import Base

# Association table for User-Song (Purchases)
user_songs = Table(
    "user_songs",
    Base.metadata,
    Column("user_id", Integer, ForeignKey("users.id"), primary_key=True),
    Column("song_id", Integer, ForeignKey("songs.id"), primary_key=True),
)

# Association table for Playlist-Song
playlist_songs = Table(
    "playlist_songs",
    Base.metadata,
    Column("playlist_id", Integer, ForeignKey("playlists.id"), primary_key=True),
    Column("song_id", Integer, ForeignKey("songs.id"), primary_key=True),
)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    first_name = Column(String)
    last_name = Column(String)
    role = Column(String, default="user") # "user" or "admin"
    
    collection = relationship("Song", secondary=user_songs, back_populates="owners")
    nfc_tags = relationship("NFCTag", back_populates="user")
    playlists = relationship("Playlist", back_populates="user")
    devices = relationship("Device", back_populates="user")

class Song(Base):
    __tablename__ = "songs"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    artist = Column(String, index=True)
    genre = Column(String, index=True)
    price = Column(Float, default=0.99)
    image_url = Column(String, nullable=True)
    file_path = Column(String)
    
    owners = relationship("User", secondary=user_songs, back_populates="collection")
    playlists = relationship("Playlist", secondary=playlist_songs, back_populates="songs")

class Playlist(Base):
    __tablename__ = "playlists"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    
    user = relationship("User", back_populates="playlists")
    songs = relationship("Song", secondary=playlist_songs, back_populates="playlists")
    nfc_tags = relationship("NFCTag", back_populates="playlist")

class NFCTag(Base):
    __tablename__ = "nfc_tags"

    id = Column(Integer, primary_key=True, index=True)
    tag_id = Column(String, unique=True, index=True) # Physical NFC UID
    name = Column(String, nullable=True) # User-defined name
    user_id = Column(Integer, ForeignKey("users.id"))
    playlist_id = Column(Integer, ForeignKey("playlists.id"), nullable=True)
    
    user = relationship("User", back_populates="nfc_tags")
    playlist = relationship("Playlist", back_populates="nfc_tags")

class Device(Base):
    __tablename__ = "devices"

    id = Column(String, primary_key=True, index=True) # UUID or generated ID
    name = Column(String, nullable=True)
    account_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    is_active = Column(Boolean, default=True)
    last_seen = Column(Float, nullable=True) # Timestamp

    user = relationship("User", back_populates="devices")
    commands = relationship("Command", back_populates="device", cascade="all, delete-orphan")

class Command(Base):
    __tablename__ = "commands"

    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(String, ForeignKey("devices.id"))
    command_type = Column(String) # LOAD_PLAYLIST, PLAY, PAUSE, NEXT, PREV, SET_VOLUME
    payload = Column(String, nullable=True) # JSON string
    status = Column(String, default="pending") # pending, acked
    created_at = Column(Float)

    device = relationship("Device", back_populates="commands")

class ClaimCode(Base):
    __tablename__ = "claim_codes"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True, index=True)
    device_id = Column(String, ForeignKey("devices.id"))
    expires_at = Column(Float)
