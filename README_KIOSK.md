# TapTone Kiosk Setup & Testing

This document explains how to set up a Raspberry Pi (or any browser-enabled device) as a TapTone Kiosk and how to test the control plane.

## 1. Kiosk Setup

### Prerequisites
- Raspberry Pi with a 480x320 display (optional, but optimized for it).
- Node.js and npm installed.

### Installation
1. Navigate to the kiosk directory:
   ```bash
   cd frontend-kiosk
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the kiosk app:
   ```bash
   npm run dev
   ```

### First Boot (Claiming)
1. On first boot, the Kiosk will generate a unique `device_id` and display a **6-digit Claim Code**.
2. Log in to the main TapTone web app.
3. Go to the **Devices** tab.
4. Enter the 6-digit code shown on the Kiosk.
5. The Kiosk will automatically refresh and enter the Player view.

## 2. Testing the Control Plane

Since the hardware (Arduinos) is decoupled, you can simulate hardware events using `curl`.

### Simulate NFC Tag Scan
When a physical tag is scanned, the hardware sends a request to the backend. To simulate this:
```bash
curl -X POST "http://localhost:8000/api/v1/events/nfc?tag_uid=TAG_ID_HERE&account_id=1"
```
*Note: The `tag_uid` must be registered in the "Tags" section of the main app and linked to a playlist.*

### Simulate Button Press
To simulate "Next Track":
```bash
curl -X POST "http://localhost:8000/api/v1/events/button?control=next&account_id=1"
```

Available controls: `prev`, `play_pause`, `next`.

### Simulate Volume Encoder
To increase volume:
```bash
curl -X POST "http://localhost:8000/api/v1/events/encoder?delta=5&account_id=1"
```

## 3. How it Works
1. **Events**: Hardware sends HTTP POSTs to the backend.
2. **Commands**: The backend looks up all devices owned by the `account_id` and queues a `Command` for each.
3. **Polling**: The Kiosk polls `/api/v1/devices/{device_id}/commands` every 1.5 seconds.
4. **Execution**: The Kiosk receives the command, performs the action (e.g., loads a playlist), and then "Acks" (acknowledges) the command so it isn't received again.
