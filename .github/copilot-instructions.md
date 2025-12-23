# AI Development Instructions for Web TV

This document provides context and guidelines for AI agents assisting with the development of this project.

## Project Overview
**Web TV** is a desktop application built with Electron, React, and TypeScript. It features two main modes:
1.  **IPTV Player**: Manages multiple M3U playlists and plays HLS (`.m3u8`) streams.
2.  **Web TV**: Browses user-configured websites using an embedded browser view.

## Tech Stack & Constraints
- **Runtime**: Electron (Main process)
- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite 4.x (Note: Kept at v4 for Node 16 compatibility)
- **Video Player**: `hls.js` (HLS), `mpegts.js` (FLV)
- **Web View**: Electron `webview` tag (enabled in main process)
- **State/Persistence**: `electron-store` (v8.1.0 - strictly kept at this version for CommonJS/Node 16 compatibility)
- **Icons**: `lucide-react`

## Architecture

### Directory Structure
- `electron/`: Contains the Main process code (`main.ts`) and Preload scripts (`preload.ts`).
- `src/`: React Renderer process code.
  - `components/`: UI components.
    - `web-tv/`: Contains the Web TV implementation (`index.tsx`).
    - `Player.tsx`, `ChannelList.tsx`, `WebList.tsx`, `TitleBar.tsx`.
  - `utils/`: Helper functions (`m3uParser.ts`).

### Key Components
1.  **`electron/main.ts`**:
    -   Entry point.
    -   **Critical**: Includes `app.on('certificate-error', ...)` to bypass SSL errors.
    -   **Configuration**: Enables `webviewTag: true` in `webPreferences` to support the Web TV feature.
    -   **Window Management**: Configured as `frame: false` for a custom UI. Starts in fullscreen mode (`fullscreen: true`). Handles IPC events for window controls (`minimize`, `maximize`, `close`, `toggle-dev-tools`).
    -   **CORS Handling**: Uses `webSecurity: false` in `webPreferences` to globally disable CORS checks for the renderer process, ensuring maximum compatibility with IPTV streams.
    -   Handles window creation and IPC setup for Playlists, Channels, and Web Sites.

2.  **`src/App.tsx`**:
    -   **Layout**: Manages the main application layout including the sidebar, main content area, and the custom `TitleBar`.
    -   **State**: 
        -   `activeTab`: 'iptv' | 'webtv'
        -   `playlists`: List of managed playlists.
        -   `currentPlaylist`: Currently selected playlist.
        -   `playlistChannels`: Channels within the current playlist.
        -   `webSites`: List of Web TV sites.
    -   **Persistence**: Implements logic to restore the last played channel and playlist on startup using stable IDs (based on URL).
    -   **Behavior**: Supports seamless playback when switching playlists (current channel continues playing until a new one is selected).
    -   **Drawer Logic**: Implements the auto-hiding sidebar (drawer) behavior.

3.  **`src/components/TitleBar.tsx`**:
    -   **Custom UI**: Implements a frameless window title bar with drag regions.
    -   **Controls**: Provides Minimize, Maximize, Close, and Debug (DevTools) buttons.
    -   **Behavior**: Auto-hides (opacity 0) and reveals on hover.

4.  **`src/components/Player.tsx`**:
    -   **Playback Engine**: Wraps `hls.js` for HLS streams and `mpegts.js` for FLV streams.
    -   **UX**: Displays a loading spinner with percentage progress during buffering/loading.
    -   **Error Handling**: Implements custom timeouts, automatic retry for network errors, and error overlays.
    -   **Advanced Logic**: Recursively resolves nested Master Playlists to ensure playback stability.

5.  **`src/components/ChannelList.tsx`**:
    -   Manages the sidebar UI for IPTV.
    -   **Views**: Switches between 'playlists' (list of M3U sources) and 'channels' (channels in selected playlist).
    -   Handles adding/importing playlists and selecting channels.

6.  **`src/components/WebList.tsx`**:
    -   Manages the sidebar UI for Web TV sites.
    -   Allows adding/removing websites (Title + URL).

7.  **`src/components/web-tv/index.tsx`**:
    -   **Web View Wrapper**: Wraps the Electron `webview` tag.
    -   **Lifecycle Management**: Handles muting/unmuting and pausing/playing media via `executeJavaScript` when switching tabs.
    -   **CSS Injection**: Injects CSS to force the video player to fullscreen within the webview if a CSS selector is provided.

8.  **`src/utils/m3uParser.ts`**:
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
-   Persistent data (playlists, web sites) is stored using `electron-store`.
-   Runtime state (current playlist, current channel) is managed via React `useState`.

### 4. IPC Communication
-   Use `contextBridge` in `preload.ts` to expose safe APIs to the renderer.
-   Avoid enabling `nodeIntegration` in the renderer process for security.

### 5. Documentation Maintenance
-   **Update Instructions**: After completing a feature iteration or significant change, always review and update this file (`.github/copilot-instructions.md`) to reflect new architecture decisions, constraints, or patterns.

### 6. Coding Standards
-   **Readability**: Prioritize clear, self-documenting code. Use meaningful variable/function names over comments. Avoid deep nesting by using early returns.
-   **Data Flow**: Maintain clear, unidirectional data flow (Parent -> Child). Explicitly define state ownership (e.g., `App.tsx` owns the playlist state).
-   **Component Architecture**:
    -   **Splitting**: Break down large components into smaller, focused sub-components with single responsibilities.
    -   **Separation**: Keep UI rendering separate from heavy business logic or data transformation.
-   **Semantic Programming**: Use semantic HTML elements (`<button>`, `<section>`, `<li>`) and semantic variable names to improve code understanding and accessibility.

## Common Commands
-   `npm run dev`: Start development server (Vite + Electron).
-   `npm run build`: Build for production (TypeScript compile + Vite build + Electron builder).
