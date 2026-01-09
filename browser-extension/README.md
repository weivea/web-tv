# Web TV Helper Extension

This Chrome Extension replaces the Web TV functionality of the original Electron app.

## Setup

1.  Make sure you have Node.js installed.
2.  Open a terminal in this folder (`browser-extension`).
3.  Install dependencies:
    ```bash
    npm install
    ```
4.  Build the extension:
    ```bash
    npm run build
    ```

## Installation in Chrome

1.  Open Chrome and navigate to `chrome://extensions`.
2.  Enable **Developer mode** (top right toggle).
3.  Click **Load unpacked**.
4.  Select the `dist` folder generated inside `browser-extension` after building.

## Usage

1.  Click the extension icon in the toolbar.
2.  Add your Web TV sites (Name, URL Pattern, CSS Selector).
    *   **URL Pattern**: Part of the URL to match (e.g., `youtube.com/watch`).
    *   **CSS Selector**: The element to maximize (e.g., `video`, `.player-container`).
3.  Navigate to the site in Chrome. The extension will automatically maximize the video element and attempt autoplay.
