# TapTone Frontend

This is the React-based web dashboard for the TapTone IoT ecosystem, built with Vite and Material UI (MUI).

## Features

- **Music Store:** Browse available songs and perform "mock" purchases.
- **My Collection:** View owned music and select tracks for tag mapping.
- **Tag Management:** Register physical NFC tag IDs and map playlists to them.
- **Secure Auth:** Integrated with the backend's cookie-based session system.
- **Responsive Design:** Polished UI using Material UI components.

## Project Structure

- `src/api/`: Axios client configuration.
- `src/components/`: Reusable UI components like `Navbar`.
- `src/context/`: Authentication state management.
- `src/pages/`: Main application views (Store, Collection, Tags).
- `src/theme/`: Material UI theme customization.

## Running Locally

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Configure Environment:**
   Create a `.env.local` file:
   ```env
   VITE_API_URL=http://localhost:8000
   ```

3. **Start Development Server:**
   ```bash
   npm run dev
   ```
   The dashboard will be available at `http://localhost:5173`.

## Deployment

The frontend is optimized for deployment on **Netlify**. Ensure you include a `public/_redirects` file for SPA routing:
```text
/*    /index.html   200
```
