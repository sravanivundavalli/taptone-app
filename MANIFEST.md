# TapTone - Project Manifest

## 1. Project Overview

TapTone is an IoT music ecosystem designed to bridge digital music collections with physical, tactile interactions. Users purchase and manage music via a React web dashboard and map collections to physical NFC tags. A custom-built Raspberry Pi player reads these tags, syncs metadata and audio from a self-hosted FastAPI backend, and outputs audio via a **3.5mm AUX jack**.

---

## 2. System Architecture

### A. Infrastructure (Cloud)

* **Deployment:** OCI (Oracle Cloud Infrastructure) VM managed via **Dockge**.
* **Reverse Proxy:** **Nginx Proxy Manager (NPM)** handles SSL termination and routing.
* **Backend:** FastAPI (Python 3.10+).
* **Database:** PostgreSQL.
* **Networking:** The API is accessible at `taptone-api.vundavalli.me`.

### B. Hardware (Player)

* **Controller:** Raspberry Pi 3 Model B v1.2.
* **Audio:** External speakers via 3.5mm AUX port.
* **Display:** Adafruit 3.5" TFT Touchscreen (Occupies 40-pin header; uses SPI0/CE0).
* **NFC Reader:** RC522 (Wired to 26-pin pass-through header; uses **SPI0/CE1** to avoid screen conflict).
* **Input:** Grove Rotary Encoder (Digital GPIO) for volume/navigation.

---

## 3. Technical Requirements

### Backend (FastAPI)

* **Authentication:** - **Web:** Simplified Session-based Auth using **HTTP-Only Cookies**.
* **Hardware:** Hardware-bound Auth using the **NFC Tag UID** as the lookup key.


* **Storage:** Local filesystem volume (Docker mounted) for `.mp3` storage.
* **Database Logic:**
* Must support a **One-to-Many** relationship between an NFC Tag and Songs (a playlist).
* Must handle user collections (purchased songs).


* **Streaming:** Endpoints must support partial content (range requests) for VLC streaming.

### Frontend (React)

* **Framework:** React with Material UI (MUI).
* **Key Views:** Store (browse/mock-buy), My Collection, and Tag Management (assigning songs to specific Tag UIDs).
* **API Client:** Configured for Credentials (to support HTTP-Only cookies).

#### Key Functionalities
1.  **Authentication & RBAC:**
    *   Signup/Login using Email/Password.
    *   User attributes: First Name, Last Name, Email, Role (User/Admin).
    *   Admin role allows access to the Music Management Dashboard.
2.  **Music Store:**
    *   Browse by Genre (Pop, Rock, Jazz, Electronic, Classical, Hip Hop, Disco).
    *   Search by Song Title or Artist.
    *   Preview playback using a global HTML5 Audio Player.
    *   "Mock" purchase system: Adding song IDs to a user's collection.
3.  **My Collection:**
    *   View all purchased songs.
    *   Multi-select songs to prepare for NFC linking.
4.  **NFC Management:**
    *   Register NFC Tag IDs (acting as unique API keys for the player).
    *   Map a specific NFC Tag ID to a list of Song IDs from the user's collection.
5.  **Hardware API:**
    *   An endpoint that takes a `tagId` and returns a JSON array of song metadata and audio URLs. Doesn't need session cookie for this api.

### Hardware (Python)

* **UI:** Kivy framework for a touch-friendly interface.
* **Audio:** `python-vlc` for media playback.
* **Integration:** A background thread for NFC polling and an interrupt-based listener for the Rotary Encoder.

---

## 4. Project Structure (One-Level)

```text
taptone/
├── backend/                # FastAPI, Postgres Models, & Storage logic
├── frontend/               # React (Vite) Dashboard
├── hardware/               # Pi logic (Kivy, VLC, RC522, Encoder)
├── infra/                  # Dockge Compose & NPM Configuration
└── README.md               # Project Manifest

```

---

## 5. Nginx Proxy Manager (NPM) Configuration

To ensure the React frontend can communicate with the FastAPI backend, the following Custom Nginx Configuration must be added to the proxy host in NPM:

```nginx
# CORS & Header Configuration
add_header 'Access-Control-Allow-Origin' 'https://taptone.vundavalli.me' always;
add_header 'Access-Control-Allow-Credentials' 'true' always;
add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
add_header 'Access-Control-Allow-Headers' 'DNT,X-CustomHeader,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Authorization' always;

if ($request_method = 'OPTIONS') {
    return 204;
}

```

---

## 6. Implementation Prompts for Gemini-CLI

### Step 1: Backend

> "Based on the TapTone README, implement the FastAPI backend. Include the SQLAlchemy models for User, Song, NFCTag, and TagPlaylist (One-to-Many). Implement Cookie-based Auth for users and Tag-UID-based sync for the hardware. Include a Dockerfile."

### Step 2: Frontend

> "Based on the TapTone README, implement the React frontend using MUI. Create a dashboard that allows users to browse songs, 'buy' them into their collection, and map a list of purchased songs to a specific NFC Tag UID."

### Step 3: Hardware

> "Based on the TapTone README, implement the Raspberry Pi Python application. Use `mfrc522` for the NFC reader on SPI0/CE1, `gpiozero` for the Rotary Encoder, and `python-vlc` for music playback via the AUX jack. Include a Kivy-based UI for song display."

---

**Would you like me to generate the specific `docker-compose.yml` optimized for a Dockge stack next?**