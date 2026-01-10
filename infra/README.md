# TapTone Infrastructure

This directory contains configuration for deploying the TapTone ecosystem using Docker, Dockge, and Nginx Proxy Manager (NPM).

## Components

- **Docker Compose:** Orchestrates the FastAPI backend and PostgreSQL database.
- **Nginx Proxy Manager:** Handles SSL termination (via Let's Encrypt) and acts as a reverse proxy for the backend and frontend.
- **Dockge:** A reactive self-hosted manager for Docker Compose stacks.

## Deployment on OCI (ARM-based VM)

The TapTone Docker images are published with multi-arch support (`amd64` and `arm64`), making them compatible with OCI's Ampere A1 Compute instances.

1. **Prerequisites:**
   - A VM on OCI (Ubuntu/Oracle Linux).
   - Docker and Docker Compose installed.
   - Ports `80`, `443`, and `8000` open in the OCI Security List.

2. **Step-by-Step Deployment:**
   - SSH into your VM.
   - Clone the repository.
   - Configure the `.env` file based on `.env.example`.
   - Run the stack:
     ```bash
     docker compose up -d
     ```

3. **Domain & SSL (Nginx Proxy Manager):**
   - NPM is recommended for managing SSL certificates.
   - Point `api.taptone.yourdomain.com` to port `8000`.
   - Point `taptone.yourdomain.com` to the frontend container (port `80`).

4. **CORS Configuration:**
   If the frontend and backend are on different domains, ensure NPM adds the following headers:
   ```nginx
   add_header 'Access-Control-Allow-Origin' 'https://taptone.yourdomain.com' always;
   add_header 'Access-Control-Allow-Credentials' 'true' always;
   ```

## Production Docker Compose

Refer to the `docker-compose.yml` in the project root for the production-ready service definitions.
