# Web TV - Electron IPTV Player

A modern, lightweight IPTV player built with Electron, React, and TypeScript. Designed to play HLS (.m3u8) live streams with ease.

## Features

- **📺 HLS Streaming**: Native support for `.m3u8` live streams using `hls.js`.
- **📋 Playlist Management**:
  - **Multiple Playlists**: Organize channels into separate playlists.
  - **Import**: Add playlists from URLs (supports `#EXTM3U` format).
  - **Persistence**: Playlists and channels are automatically saved and restored.
- **🛡️ Robust Playback**:
  - **Error Handling**: Visual feedback for network errors or unsupported streams.
  - **Timeout Protection**: 
    - 10s timeout for playback start.
    - 15s timeout for playlist imports.
    - Configurable timeouts for HLS manifest/fragment loading.
  - **SSL Compatibility**: Automatically bypasses SSL certificate errors to support a wider range of streams.
- **🎨 Modern UI**:
  - **Frameless Design**: Custom title bar with a sleek, immersive look.
  - **Fullscreen Mode**: App launches in fullscreen mode by default for an immersive experience.
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

1. **Manage Playlists**:
   - In the sidebar, click "+" to add a new playlist.
   - Enter a Name and URL for the playlist (M3U/M3U8).
   - Click "Add" to save.

2. **Browse Channels**:
   - Click on a playlist to view its channels.
   - Click "Back" to return to the playlist list.

3. **Play**:
   - Click on any channel to start playing.
   - If a stream fails to start within 10 seconds, an error message will appear.

## IPTV 直播源获取
https://iptv.hacks.tools/



## License

MIT
