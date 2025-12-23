import { useEffect, useRef } from 'react';

interface WebTVProps {
  isActive: boolean;
  currentSite: Channel | null;
}

const WebTV = ({ isActive, currentSite }: WebTVProps) => {
  const webviewRef = useRef<any>(null);

  useEffect(() => {
    const webview = webviewRef.current;
    if (!webview || !currentSite?.cssSelector) return;

    const injectCss = () => {
      const selector = JSON.stringify(currentSite.cssSelector);
      const script = `
        (function() {
          document.documentElement.style.overflow = 'hidden';
          const selector = ${selector};
          const check = () => {
            const el = document.querySelector(selector);
            if (el) {
              el.style.position = 'fixed';
              el.style.zIndex = '10400';
              el.style.left = '0';
              el.style.top = '0';
              el.style.width = '100%';
              el.style.height = '100%';
              el.style.background = '#000';
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
          console.error('Failed to inject CSS script', err),
        );
    };
    webview.addEventListener('dom-ready', injectCss);

    return () => {
      webview.removeEventListener('dom-ready', injectCss);
    };
  }, [currentSite]);

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
        webview
          .executeJavaScript(
            `document.querySelectorAll('video, audio').forEach(el => el.play());`,
          )
          .catch(() => {});
      } catch (e) {
        console.error('Failed to unmute webview', e);
      }
    }
  }, [isActive]);

  return (
    <div
      style={{
        display: isActive ? 'block' : 'none',
        width: '100%',
        height: '100%',
      }}
    >
      {currentSite ? (
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
