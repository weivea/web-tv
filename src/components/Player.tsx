import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';

interface PlayerProps {
  url: string;
}

const Player: React.FC<PlayerProps> = ({ url }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
    const video = videoRef.current;
    if (!video) return;

    let hls: Hls | null = null;
    let playbackTimeout: number | null = null;

    // Clear timeout when playback starts
    const handlePlaybackStart = () => {
      if (playbackTimeout) {
        clearTimeout(playbackTimeout);
      }
    };

    // Set 10s timeout
    playbackTimeout = window.setTimeout(() => {
      setError("Playback timeout: Channel failed to start within 10 seconds.");
      if (hls) {
        hls.destroy();
        hls = null;
      }
    }, 10000);

    video.addEventListener('playing', handlePlaybackStart);

    const handleVideoError = () => {
      if (playbackTimeout) clearTimeout(playbackTimeout);
      const err = video.error;
      let message = "Unknown playback error";
      if (err) {
        switch (err.code) {
          case MediaError.MEDIA_ERR_ABORTED: message = "Playback aborted"; break;
          case MediaError.MEDIA_ERR_NETWORK: message = "Network error"; break;
          case MediaError.MEDIA_ERR_DECODE: message = "Decode error"; break;
          case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED: message = "Source not supported"; break;
        }
      }
      setError(message);
    };

    video.addEventListener('error', handleVideoError);

    if (Hls.isSupported()) {
      hls = new Hls({
        manifestLoadingTimeOut: 15000, // 15s timeout for manifest loading
        manifestLoadingMaxRetry: 2,    // Max 2 retries
        levelLoadingTimeOut: 15000,    // 15s timeout for level loading
        fragLoadingTimeOut: 20000,     // 20s timeout for fragment loading
      });
      hls.loadSource(url);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(e => console.error("Error playing video:", e));
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.error("fatal network error encountered, try to recover");
              hls?.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.error("fatal media error encountered, try to recover");
              hls?.recoverMediaError();
              break;
            default:
              hls?.destroy();
              setError(`Playback Error: ${data.details}`);
              break;
          }
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = url;
      video.addEventListener('loadedmetadata', () => {
        video.play().catch(e => console.error("Error playing video:", e));
      });
    }

    return () => {
      if (playbackTimeout) clearTimeout(playbackTimeout);
      video.removeEventListener('playing', handlePlaybackStart);
      video.removeEventListener('error', handleVideoError);
      if (hls) {
        hls.destroy();
      }
    };
  }, [url]);

  return (
    <div
      className="player-container"
      style={{
        width: '100%',
        height: '100%',
        background: '#000',
        position: 'relative',
      }}
    >
      {error && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            background: 'rgba(0,0,0,0.8)',
            color: 'white',
            zIndex: 10,
            flexDirection: 'column',
          }}
        >
          <h3>Playback Failed</h3>
          <p>{error}</p>
        </div>
      )}
      {/* Overlay to capture clicks and prevent default play/pause toggle, but allow bubbling for sidebar close */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: 'calc(100% - 80px)', // Leave space for bottom controls
          zIndex: 5,
        }}
      />
      <video
        ref={videoRef}
        controls
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
};

export default Player;
