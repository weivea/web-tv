# Web TV - Electron IPTV Player

A modern, lightweight IPTV player built with Electron, React, and TypeScript. Designed to play HLS (.m3u8) live streams with ease.

## Features

- **📺 HLS Streaming**: Native support for `.m3u8` live streams using `hls.js`.
- **📋 Playlist Management**:
  - **Add Single Channel**: Manually add channels by Name and URL.
  - **Bulk Import**: Import entire M3U playlists from URLs (supports `#EXTM3U` format).
  - **Persistence**: Your channel list is automatically saved and restored (using `electron-store`).
- **🛡️ Robust Playback**:
  - **Error Handling**: Visual feedback for network errors or unsupported streams.
  - **Timeout Protection**: 
    - 10s timeout for playback start.
    - 15s timeout for playlist imports.
    - Configurable timeouts for HLS manifest/fragment loading.
  - **SSL Compatibility**: Automatically bypasses SSL certificate errors to support a wider range of streams.
- **🎨 Modern UI**:
  - **Frameless Design**: Custom title bar with a sleek, immersive look.
  - **Auto-Hide Controls**: Title bar and window controls automatically fade out when not in use to maximize viewing area.
  - **Web TV Mode**: Integrated browser view for navigating web-based streaming sites.
- **⚡ Modern Tech Stack**: Built with Vite for lightning-fast development and build performance.

## Tech Stack

- **Core**: [Electron](https://www.electronjs.org/)
- **Frontend**: [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Player**: [hls.js](https://github.com/video-dev/hls.js)
- **Icons**: [lucide-react](https://lucide.dev/)
- **Storage**: [electron-store](https://github.com/sindresorhus/electron-store)

## Getting Started

### Prerequisites

- Node.js (v16 or higher recommended)
- npm

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd web-tv
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Development

Start the application in development mode with hot-reload:

```bash
npm run dev
```

### Build

Build the application for production:

```bash
npm run build
```

## Usage

1. **Add a Channel**:
   - Enter a Name and an `.m3u8` URL in the sidebar inputs.
   - Click "Add / Import URL".

2. **Import a Playlist**:
   - Paste a URL pointing to an `.m3u` or `.m3u8` playlist file (e.g., from GitHub).
   - Click "Add / Import URL".
   - The app will automatically parse and add all valid channels.

3. **Play**:
   - Click on any channel in the list to start playing.
   - If a stream fails to start within 10 seconds, an error message will appear.

## License

MIT
