from pydantic import BaseModel
from typing import List, Optional

class SongBase(BaseModel):
    title: str
    artist: str
    genre: str
    price: float = 0.99
    image_url: Optional[str] = None

class SongCreate(SongBase):
    file_path: str

class Song(SongBase):
    id: int
    
    class Config:
        from_attributes = True

class UserBase(BaseModel):
    email: str
    first_name: str
    last_name: str

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    role: str
    
    class Config:
        from_attributes = True

class PlaylistBase(BaseModel):
    name: str

class PlaylistCreate(PlaylistBase):
    pass

class PlaylistUpdate(BaseModel):
    name: str

class Playlist(PlaylistBase):
    id: int
    user_id: int
    songs: List[Song] = []

    class Config:
        from_attributes = True

class NFCTagBase(BaseModel):
    tag_id: str
    name: Optional[str] = None

class NFCTagCreate(NFCTagBase):
    pass

class NFCTag(NFCTagBase):
    id: int
    user_id: int
    playlist_id: Optional[int] = None
    playlist: Optional[Playlist] = None

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class DeviceBase(BaseModel):
    id: str
    name: Optional[str] = None

class Device(DeviceBase):
    account_id: Optional[int] = None
    is_active: bool
    last_seen: Optional[float] = None

    class Config:
        from_attributes = True

class CommandBase(BaseModel):
    command_type: str
    payload: Optional[str] = None

class Command(CommandBase):
    id: int
    device_id: str
    status: str
    created_at: float

    class Config:
        from_attributes = True

class ClaimCode(BaseModel):
    code: str
    device_id: str
    expires_at: float
