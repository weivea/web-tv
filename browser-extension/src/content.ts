interface WebSiteConfig {
  id: string;
  name: string;
  urlPattern: string;
  cssSelector: string;
}

const initialize = async () => {
  try {
    // Wait for storage
    const result = await chrome.storage.sync.get('webTvSites');
    const sites: WebSiteConfig[] = result.webTvSites || [];
    
    const currentUrl = window.location.href;
    // Simple inclusion match. Can be improved to regex later.
    const matchedSite = sites.find(site => {
        // Remove protocols for looser matching
        const cleanPattern = site.urlPattern.replace(/^https?:\/\//, '');
        return currentUrl.includes(cleanPattern);
    });

    if (matchedSite) {
      console.log('[Web TV Helper] Site matched:', matchedSite.name);
      activateWebTvMode(matchedSite);
    }
  } catch (e) {
    console.error('[Web TV Helper] Initialization error:', e);
  }
};

const activateWebTvMode = (site: WebSiteConfig) => {
  if (site.cssSelector) {
    injectCss(site.cssSelector);
  }
  startAutoplay();
};

const injectCss = (selector: string) => {
  const style = document.createElement('style');
  style.id = 'web-tv-helper-style';
  style.textContent = `
    html, body {
      overflow: hidden !important;
      margin: 0 !important;
      padding: 0 !important;
    }
    ${selector} {
      position: fixed !important;
      z-index: 2147483647 !important;
      left: 0 !important;
      top: 0 !important;
      width: 100vw !important;
      height: 100vh !important;
      background: #000 !important;
      object-fit: contain !important; /* Ensure video fits */
    }
  `;
  
  // Try to append to head, or body if head doesn't exist yet
  const target = document.head || document.documentElement;
  target.appendChild(style);
  console.log('[Web TV Helper] CSS injected for', selector);
};

const startAutoplay = () => {
  const attemptPlay = (media: HTMLMediaElement) => {
      // Logic to ensure it plays
      media.play().catch(async (e) => {
          console.log('[Web TV Helper] Autoplay failed, trying muted:', e);
          media.muted = true;
          try {
              await media.play();
          } catch(e2) {
              console.log('[Web TV Helper] Muted autoplay also failed:', e2);
          }
      });
  };

  const check = () => {
      const mediaElements = document.querySelectorAll('video, audio');
      mediaElements.forEach(el => {
          attemptPlay(el as HTMLMediaElement);
      });
      // Poll every second to catch new videos or paused videos
      setTimeout(check, 2000);
  };
  
  check();
};

// Run initialization
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
} else {
    initialize();
}
