# Web TV Chrome Extension Implementation Plan

## 1. Overview
The goal is to migrate the **Web TV** functionality from the current Electron application (where it runs in an embedded `webview`) to a standalone **Chrome Extension**.

-   **Current State**: Electron manages Web TV sites and renders them in a `<webview>` tag with injected CSS/JS for fullscreen and autoplay.
-   **Future State**:
    -   **Web TV Logic**: Handled by a Chrome Extension (`browser-extension/`).
    -   **Execution**: Web TV sites open in standard Chrome tabs.
    -   **Electron App**: Focused on IPTV (or acts as a simple launcher).

## 2. Technical Architecture

### 2.1 Chrome Extension (`browser-extension/`)

The extension will be the core of the new Web TV experience.

#### **Manifest V3 Structure**
*   **`manifest.json`**:
    *   `name`: "Web TV Helper"
    *   `permissions`:
        *   `storage`: To save the list of configured sites (URL patterns + CSS selectors).
        *   `scripting`: To inject the CSS (fullscreen) and JS (autoplay) into the pages.
    *   `host_permissions`: `["<all_urls>"]` (Required to monitor and modify any website the user adds).
    *   `action`: Defines the popup (Management UI).
    *   `background`: Service worker to handle events/state.

#### **Key Components**

1.  **Storage (Data Model)**
    We will use `chrome.storage.sync` (or `local`) to store the configuration.
    ```typescript
    interface WebSiteConfig {
      id: string;
      name: string;
      urlPattern: string; // e.g., "youtube.com/watch*"
      cssSelector: string; // The element to make fullscreen
    }
    ```

2.  **Popup UI (`popup.html` / `popup.js` / React)**
    *   Replaces `src/components/WebList.tsx`.
    *   Allows users to **Add**, **Edit**, **Delete** Web TV sites.
    *   Lists current sites. Clicking one opens it in a new tab.

3.  **Content Script (`content.js`)**
    *   Runs on every page load.
    *   Checks if the current `window.location.href` matches any saved `WebSiteConfig`.
    *   **If Match**:
        1.  **Inject CSS**: Apply the fullscreen styles to the element matching `cssSelector` (Logic ported from `src/components/web-tv/index.tsx`).
        2.  **Inject JS**: Auto-play video/audio elements (Logic ported from `src/components/web-tv/index.tsx`).

4.  **Background Service Worker (`background.js`)**
    *   Optional: Can handle context menus (e.g., "Add this site to Web TV").

### 2.2 Migration Logic (Porting form Electron)

| Feature | Electron Implementation | Chrome Extension Implementation |
| :--- | :--- | :--- |
| **Site Management** | `electron-store` / `WebList.tsx` | `chrome.storage` / Extension Popup |
| **Fullscreen Mode** | `webview.executeJavaScript` + CSS | `chrome.scripting.insertCSS` in Content Script |
| **Auto Play** | `webview` audio check loop | MutationObserver in Content Script to detect video tags |
| **Muting/Pausing** | `webview.setAudioMuted` | rely on Browser Tab behavior (user manages tabs) |

## 3. Implementation Steps

### Phase 1: Create Extension Scaffold
1.  Create `browser-extension/manifest.json`.
2.  Set up a basic build process (Vite is recommended if using React for the Popup, or vanilla JS for simplicity).

### Phase 2: Implement Core Logic (The "Player")
1.  **Site Matching**: Implement a utility in the content script to check if the current URL matches a saved "Web TV" site.
2.  **Style Injection**: Port the CSS injection logic.
    *   *Reference*: `src/components/web-tv/index.tsx` (Lines 48-67).
3.  **Autoplay Logic**: Port the JS playback logic.
    *   *Reference*: `src/components/web-tv/index.tsx` (Lines 77-90).

### Phase 3: Implement Management UI (The "List")
1.  Build the **Popup** interface.
2.  Allow CRUD operations on the site list.
3.  Implement an **Import** feature to easily bring in the existing `web-tv-sites.json` from the Electron app.

### Phase 4: Electron App Cleanup
1.  Remove `src/components/web-tv/`.
2.  Modify `src/App.tsx`:
    *   **Option A (Decouple)**: Remove "Web TV" tab entirely. The Electron app becomes an IPTV-only player.
    *   **Option B (Launcher)**: Keep the list in Electron, but clicking a site uses `window.open` (external).
        *   *Challenge*: The configuration (CSS Selector) must exist in the Extension to work.
        *   *Recommendation*: **Option A** is cleaner. Let the Extension manage Web TV.

## 4. Proposed File Structure (`browser-extension/`)

```
browser-extension/
├── manifest.json
├── icons/
│   ├── icon16.png
│   └── ...
├── src/
│   ├── background.ts    (Service Worker)
│   ├── content.ts       (Injected Logic)
│   ├── popup/           (UI)
│   │   ├── index.html
│   │   ├── App.tsx
│   │   └── main.tsx
│   └── utils/
│       ├── storage.ts
│       └── injection.ts
└── vite.config.ts       (If using bundler)
```

## 5. Next Steps for Developer
1.  Initialize the `browser-extension` folder with a `manifest.json`.
2.  Port the `injectCss` and `playVideo` functions from `src/components/web-tv/index.tsx` into a content script.
3.  Build the Popup UI to manage the sites.
