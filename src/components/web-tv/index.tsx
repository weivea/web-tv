import { useEffect, useRef } from 'react';

interface WebTVProps {
  isActive: boolean;
  currentSite: Channel | null;
}

const WebTV = ({ isActive, currentSite }: WebTVProps) => {
  const webviewRef = useRef<any>(null);

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
