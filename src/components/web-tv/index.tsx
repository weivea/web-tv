import { useEffect, useRef, useState } from 'react';

interface WebTVProps {
  isActive: boolean;
  currentSite: Channel | null;
}

const WebTV = ({ isActive, currentSite }: WebTVProps) => {
  const webviewRef = useRef<any>(null);
  const [hasActivated, setHasActivated] = useState(false);

  useEffect(() => {
    if (isActive) {
      setHasActivated(true);
    }
  }, [isActive]);

  useEffect(() => {
    const webview = webviewRef.current;
    if (!webview) return;

    if (!isActive) {
      try {
        webview.setAudioMuted(true);
        webview
          .executeJavaScript(
            `document.querySelectorAll('video, audio').forEach(el => el.pause());`,
          )
          .catch(() => {});
      } catch (e) {
        console.error('Failed to pause webview', e);
      }
    } else {
      try {
        webview.setAudioMuted(false);
        webview.executeJavaScript(`location.reload();`).catch(() => {});
      } catch (e) {
        console.error('Failed to unmute webview', e);
      }
    }
  }, [isActive]);

  useEffect(() => {
    if (!hasActivated) return;

    const webview = webviewRef.current;
    if (!webview || !currentSite?.cssSelector) return;

    const injectCss = () => {
      const selector = JSON.stringify(currentSite.cssSelector);
      const script = `
        (function() {
          const selector = ${selector};
          const style = document.createElement('style');
          style.textContent = \`
            html, body {
              overflow: hidden !important;
            }
            \${selector} {
              position: fixed !important;
              z-index: 10400 !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              height: 100% !important;
              background: #000 !important;
            }
          \`;
          document.head.appendChild(style);
        })();
      `;
      webview
        .executeJavaScript(script)
        .catch((err: unknown) =>
          console.error('Failed to inject CSS script', err),
        );
    };
    const playVideo = () => {
      const script = `
        (function() {
          const check = () => {
            const mediaElements = document.querySelectorAll('video, audio');
            if (mediaElements.length > 0) {
              mediaElements.forEach(el => {
                el.play().catch(() => {});
              });
            } else {
              setTimeout(check, 200);
            }
          };
          check();
        })();
      `;
      webview
        .executeJavaScript(script)
        .catch((err: unknown) =>
          console.error('Failed to play media elements', err),
        );
    };
    webview.addEventListener('dom-ready', injectCss);
    webview.addEventListener('dom-ready', playVideo);

    return () => {
      try {
        webview.removeEventListener('dom-ready', injectCss);
        webview.removeEventListener('dom-ready', playVideo);
      } catch (e) {
        // Ignore errors if webview is destroyed
      }
    };
  }, [currentSite, hasActivated]);

  return (
    <div
      style={{
        display: isActive ? 'block' : 'none',
        width: '100%',
        height: '100%',
      }}
    >
      {hasActivated && currentSite ? (
        <>
          <webview
            ref={webviewRef}
            src={currentSite.url}
            style={{ width: '100%', height: '100%' }}
          />
          <div className="webview-overlay" />
        </>
      ) : (
        <div className="placeholder-text">Select or add a website to view</div>
      )}
    </div>
  );
};

export default WebTV;
