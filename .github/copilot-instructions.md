# AI Development Instructions for Web TV

This document provides context and guidelines for AI agents assisting with the development of this project.

## Project Overview
**Web TV** is a desktop IPTV player application built with Electron, React, and TypeScript. It focuses on playing HLS (`.m3u8`) streams and managing M3U playlists.

## Tech Stack & Constraints
- **Runtime**: Electron (Main process)
- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite 4.x (Note: Kept at v4 for Node 16 compatibility)
- **Video Player**: `hls.js`
- **State/Persistence**: `electron-store` (v8.1.0 - strictly kept at this version for CommonJS/Node 16 compatibility)
- **Icons**: `lucide-react`

## Architecture

### Directory Structure
- `electron/`: Contains the Main process code (`main.ts`) and Preload scripts (`preload.ts`).
- `src/`: React Renderer process code.
  - `components/`: UI components (`Player.tsx`, `ChannelList.tsx`).
  - `utils/`: Helper functions (`m3uParser.ts`).

### Key Components
1.  **`electron/main.ts`**:
    -   Entry point.
    -   **Critical**: Includes `app.on('certificate-error', ...)` to bypass SSL errors for streams with invalid certificates.
    -   Handles window creation and IPC setup.

2.  **`src/components/Player.tsx`**:
    -   Wraps `hls.js`.
    -   **Error Handling**: Implements custom timeouts (10s start timeout) and error overlays.
    -   **Configuration**: Uses specific `hls.js` config for timeouts (`manifestLoadingTimeOut`, etc.).

3.  **`src/components/ChannelList.tsx`**:
    -   Manages the sidebar UI.
    -   Handles M3U playlist imports via `fetch`.
    -   **Timeout**: Implements a 15s timeout for playlist fetching using `AbortController`.

4.  **`src/utils/m3uParser.ts`**:
    -   Parses raw M3U text content.
    -   Extracts `#EXTINF` metadata (tvg-name, tvg-logo, group-title).

## Development Guidelines

### 1. Node.js Compatibility
The project is designed to be compatible with **Node.js v16**.
-   **Do not upgrade** `vite` to v5+ or `electron-store` to v9+ without explicit instruction, as they require newer Node versions or ESM-only environments that conflict with the current Electron setup.

### 2. Error Handling Pattern
-   **Network Requests**: Always implement timeouts (using `AbortController` or library specific configs).
-   **Playback**: Always assume streams might fail. Provide visual feedback to the user (e.g., the error overlay in `Player.tsx`).
-   **SSL**: The app is configured to be permissive with SSL errors to maximize stream compatibility.

### 3. State Management
-   Persistent data (channels) is stored using `electron-store`.
-   Runtime state (current channel, UI toggle) is managed via React `useState`.

### 4. IPC Communication
-   Use `contextBridge` in `preload.ts` to expose safe APIs to the renderer.
-   Avoid enabling `nodeIntegration` in the renderer process for security.

### 5. Documentation Maintenance
-   **Update Instructions**: After completing a feature iteration or significant change, always review and update this file (`.github/copilot-instructions.md`) to reflect new architecture decisions, constraints, or patterns.

## Common Commands
-   `npm run dev`: Start development server (Vite + Electron).
-   `npm run build`: Build for production (TypeScript compile + Vite build + Electron builder).
