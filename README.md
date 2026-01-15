# TapTone: IoT Music Control Plane

TapTone is a modern, distributed IoT music ecosystem designed for physical interaction. It bridges the gap between digital streaming and tactile hardware through NFC-triggered playlists, a custom Raspberry Pi Kiosk, and a centralized cloud backend.

## 🚀 System Architecture

- **Backend**: FastAPI (Python) running on OCI (Oracle Cloud Infrastructure). Handles music streaming, recommendation logic, and IoT event processing.
- **Main Web App**: React (Vite) + Material UI. Used for music purchases, playlist management, and device registration.
- **Kiosk App**: React (Vite) optimized for the 480x320 Adafruit PiTFT. Runs on Raspberry Pi 3 using Wayland/Labwc.
- **Hardware Integration**: Supports NFC/RFID tag readers, physical buttons, and rotary encoders for volume.

---

## ✨ Key Features (Currently Live)

### 1. Smart Discovery & Infinite Radio
- **Genre-Based Recommendations**: When a playlist ends, the system automatically finds 5 similar songs from your personal collection.
- **Infinite Mode**: Keeps discovering new music indefinitely until your collection is exhausted.
- **Visual Cues**: Discovery tracks are marked with a `✨` icon in the Kiosk queue.
- **Quick Save**: Dedicated `+` and `+ ADD ALL` buttons on the Kiosk to save discovered tracks to a synced "Discoveries" playlist.

### 2. IoT Device Management
- **Seamless Registration**: New Kiosk devices generate a 6-digit claim code. Enter this on the website to link the hardware to your account.
- **Heartbeat & Status**: Real-time monitoring of device connectivity and current playback state.
- **Remote Control**: Play/Pause, Skip, and Volume can be controlled via the website or physical hardware events.

### 3. Physical Interaction (NFC)
- **Tag Binding**: Link any NFC/RFID tag to a specific playlist via the web dashboard.
- **Tap-to-Play**: Tapping a physical tag on the reader instantly loads and plays the associated playlist on all linked devices.

### 4. Cross-Platform Sync
- **Centralized Library**: Your music collection and playlists (including "Discoveries") are synced in real-time between the Kiosk and the Main Website.

---

## 🛠 Tech Stack

- **Frontend**: React 18, Vite, Material UI (MUI), Axios.
- **Backend**: FastAPI, SQLAlchemy (SQLite/PostgreSQL), Pydantic.
- **Deployment**: OCI (Backend), Netlify (Frontends), Wayland/Labwc (Raspberry Pi OS Trixie).
- **Communication**: REST API with long-polling/heartbeat for IoT commands.

---

## 🏃 Getting Started

### Backend Setup
1. Navigate to `/backend`.
2. Install dependencies: `pip install -r requirements.txt`.
3. Set environment variables (or use `.env`):
   - `DATABASE_URL`: Your DB connection string.
4. Run: `uvicorn app.main:app --reload`.

### Frontend Setup (Main & Kiosk)
1. Navigate to `/frontend` or `/frontend-kiosk`.
2. Install dependencies: `npm install`.
3. Create `.env` file:
   - `VITE_API_URL`: URL of your running backend.
4. Run: `npm run dev` or build: `npm run build`.

### Kiosk Deployment (Raspberry Pi 3)
To run on the PiTFT (480x320) with Wayland:
```bash
chromium-browser --app=https://taptone-kiosk.netlify.app \
--ozone-platform=wayland --disable-gpu \
--window-size=480,320 --window-position=0,0
```

---

## 📂 Project Structure

- `/backend`: FastAPI source code and music storage logic.
- `/frontend`: Main user dashboard and store.
- `/frontend-kiosk`: Specialized UI for the 480x320 touch screen.
- `/infra`: Deployment configurations (Nginx, Docker).
