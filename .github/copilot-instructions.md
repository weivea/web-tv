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

2.  **`src/App.tsx`**:
    -   **Layout**: Manages the main application layout including the video player and sidebar.
    -   **Drawer Logic**: Implements the auto-hiding sidebar (drawer) behavior. The sidebar appears on mouse movement and hides after 5 seconds of inactivity.

3.  **`src/components/Player.tsx`**:
    -   Wraps `hls.js`.
    -   **Error Handling**: Implements custom timeouts (10s start timeout) and error overlays.
    -   **Configuration**: Uses specific `hls.js` config for timeouts (`manifestLoadingTimeOut`, etc.).

4.  **`src/components/ChannelList.tsx`**:
    -   Manages the sidebar UI content.
    -   **Styling**: Designed to be semi-transparent and overlay the video player.
    -   Handles M3U playlist imports via `fetch`.
    -   **Timeout**: Implements a 15s timeout for playlist fetching using `AbortController`.

5.  **`src/utils/m3uParser.ts`**:
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

### 6. Coding Standards
-   **Readability**: Prioritize clear, self-documenting code. Use meaningful variable/function names over comments. Avoid deep nesting by using early returns.
-   **Data Flow**: Maintain clear, unidirectional data flow (Parent -> Child). Explicitly define state ownership (e.g., `App.tsx` owns the channel list state).
-   **Component Architecture**:
    -   **Splitting**: Break down large components into smaller, focused sub-components with single responsibilities.
    -   **Separation**: Keep UI rendering separate from heavy business logic or data transformation.
-   **Semantic Programming**: Use semantic HTML elements (`<button>`, `<section>`, `<li>`) and semantic variable names to improve code understanding and accessibility.

## Common Commands
-   `npm run dev`: Start development server (Vite + Electron).
-   `npm run build`: Build for production (TypeScript compile + Vite build + Electron builder).
