# Kiosk Decoupling Plan: TapTone Music IoT

This document outlines the architectural shift to a "Control Plane" model, where physical hardware (Arduino + sensors) is decoupled from the display (Raspberry Pi Kiosk) via a centralized backend.

## 1. Goals
- Solve GPIO contention on Raspberry Pi by moving tactile controls to Arduinos.
- Enable remote control of the kiosk via any web interface.
- Provide a simplified, touch-optimized UI for the 3.5" screen.
- Implement a secure, headless "Claim Code" registration flow.

## 2. Components

### A. Backend (The Control Plane)
- **Device Management**: Track registered kiosks and their connection status.
- **Command Queue**: Store events from Arduinos (NFC scan, button press, volume change) as commands for the kiosk.
- **Event Ingestion**: Public endpoints for Arduinos to report physical interactions.
- **CORS**: Updated to allow `taptone-pi.vundavalli.me`.

### B. Kiosk Frontend (`frontend-kiosk`)
- **Vite + React + MUI**: Mirroring existing tech stack.
- **Polling Engine**: Fetches and acknowledges commands from the backend every 1 second.
- **Audio Engine**: HTML5 Audio for playback (replaces VLC-based player).
- **Claim Code Flow**: Displays a code on first boot; user "claims" it from the main app.

### C. Main Frontend (Remote Control & Admin)
- **Device Manager**: New page to list, rename, and revoke kiosks.
- **Pairing UI**: Form to enter the 6-digit claim code.

## 3. Data Models

### Device
- `id`: UUID
- `device_id`: Friendly ID or generated string
- `name`: User-defined name
- `account_id`: Link to User
- `status`: online/offline
- `last_seen`: Timestamp

### Command
- `id`: Integer
- `device_id`: UUID
- `command_type`: `LOAD_PLAYLIST`, `PLAY`, `PAUSE`, `NEXT`, `PREV`, `SET_VOLUME`
- `payload`: JSON (e.g., `{ "playlist_id": 1 }` or `{ "volume": 0.8 }`)
- `status`: `pending`, `acked`

### ClaimCode
- `code`: 6-digit string
- `device_id`: UUID
- `expires_at`: Timestamp

## 4. Implementation Steps

1. **Backend Foundation**:
   - Update `models.py` with Device, Command, and ClaimCode tables.
   - Update `schemas.py` and `crud.py`.
   - Update `main.py` with Event and Device endpoints.
2. **Kiosk Scaffolding**:
   - Create `frontend-kiosk` folder and init Vite project.
   - Implement Registration screen and Polling logic.
3. **Main App Integration**:
   - Add Device Management page to the main dashboard.
4. **Documentation**:
   - Create `README_KIOSK.md` with setup instructions.
5. **Testing**:
   - Use `curl` to simulate Arduino events and verify Kiosk reaction.
