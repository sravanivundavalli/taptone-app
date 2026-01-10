import os
import hashlib
import logging
from sqlalchemy.orm import Session
from . import models, auth

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def get_image_url(artist, title):
    seed_str = f"{artist}-{title}".lower()
    seed_hash = hashlib.md5(seed_str.encode()).hexdigest()[:6]
    return f"https://picsum.photos/seed/{seed_hash}/400/400"

def auto_seed_data(db: Session):
    logger.info("Starting auto-seeding process...")
    # 1. Ensure Admin User Exists
    admin_email = "admin@taptone.me"
    db_admin = db.query(models.User).filter(models.User.email == admin_email).first()
    if not db_admin:
        logger.info(f"Creating admin user: {admin_email}")
        db_admin = models.User(
            email=admin_email,
            hashed_password=auth.get_password_hash("admin123"),
            first_name="Admin",
            last_name="TapTone",
            role="admin"
        )
        db.add(db_admin)
        db.commit()
        db.refresh(db_admin)
        logger.info("Auto-seeded admin user.")
    else:
        logger.info("Admin user already exists.")
    
    # 2. Sync Music Storage with DB only if the library is empty
    song_count = db.query(models.Song).count()
    if song_count > 0:
        logger.info(f"Library already contains {song_count} songs. Skipping music seeding.")
        return

    storage_dir = os.path.join(os.getcwd(), "music_storage")
    logger.info(f"Checking music storage directory: {storage_dir}")
    logger.info(f"Directory exists: {os.path.exists(storage_dir)}")
    if os.path.exists(storage_dir):
        logger.info(f"Directory contents: {os.listdir(storage_dir)}")
        files = [f for f in os.listdir(storage_dir) if f.endswith(".mp3")]
        logger.info(f"Found {len(files)} MP3 files in storage.")
        for file in files:
            # Format: <artist> - <title> - <genre>.mp3
            name_part = file.replace(".mp3", "")
            parts = name_part.split(" - ")
            
            if len(parts) >= 3:
                artist, title, genre = parts[0], parts[1], parts[2]
            else:
                logger.warning(f"Skipping file with invalid format: {file}")
                continue 
            
            # Check if song exists
            db_song = db.query(models.Song).filter(models.Song.title == title, models.Song.artist == artist).first()
            if not db_song:
                db_song = models.Song(
                    title=title,
                    artist=artist,
                    genre=genre,
                    price=0.99,
                    file_path=file,
                    image_url=get_image_url(artist, title)
                )
                db.add(db_song)
                logger.info(f"Auto-seeded song: {title} by {artist}")
    else:
        logger.error(f"Music storage directory NOT FOUND: {storage_dir}")
    
    db.commit()
    logger.info("Auto-seeding complete.")
