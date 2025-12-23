import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { Loader } from 'lucide-react';

interface PlayerProps {
  url: string;
}

const Player: React.FC<PlayerProps> = ({ url }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    setError(null);
    setLoading(true);
    setProgress(0);
    const video = videoRef.current;
    if (!video) return;

    let hls: Hls | null = null;
    let playbackTimeout: number | null = null;

    // Clear timeout when playback starts
    const handlePlaybackStart = () => {
      setLoading(false);
      setProgress(100);
      if (playbackTimeout) {
        clearTimeout(playbackTimeout);
      }
    };

    const handleWaiting = () => setLoading(true);
    const handleCanPlay = () => {
      setLoading(false);
      setProgress(100);
    };

    // Set 15s timeout
    playbackTimeout = window.setTimeout(() => {
      setError('Playback timeout: Channel failed to start within 15 seconds.');
      setLoading(false);
      if (hls) {
        hls.destroy();
        hls = null;
      }
    }, 15000);

    video.addEventListener('playing', handlePlaybackStart);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('canplay', handleCanPlay);

    const handleVideoError = () => {
      setLoading(false);
      if (playbackTimeout) clearTimeout(playbackTimeout);
      const err = video.error;
      let message = 'Unknown playback error';
      if (err) {
        switch (err.code) {
          case MediaError.MEDIA_ERR_ABORTED:
            message = 'Playback aborted';
            break;
          case MediaError.MEDIA_ERR_NETWORK:
            message = 'Network error';
            break;
          case MediaError.MEDIA_ERR_DECODE:
            message = 'Decode error';
            break;
          case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
            message = 'Source not supported';
            break;
        }
      }
      setError(message);
    };

    video.addEventListener('error', handleVideoError);

    let isDirectStream = false;
    try {
      const u = new URL(url);
      isDirectStream = /\.(mp4|webm|ogg|mov|mkv)$/i.test(u.pathname);
    } catch (e) {
      isDirectStream = /\.(mp4|webm|ogg|mov|mkv)($|\?)/i.test(url);
    }

    if (!isDirectStream && Hls.isSupported()) {
      hls = new Hls({
        manifestLoadingTimeOut: 15000, // 15s timeout for manifest loading
        manifestLoadingMaxRetry: 2, // Max 2 retries
        levelLoadingTimeOut: 15000, // 15s timeout for level loading
        fragLoadingTimeOut: 20000, // 20s timeout for fragment loading
      });
      hls.loadSource(url);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch((e) => console.error('Error playing video:', e));
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      hls.on('hlsFragLoadProgress' as any, (_event: any, data: any) => {
        if (data.stats && data.stats.total > 0) {
          const percent = Math.round(
            (data.stats.loaded / data.stats.total) * 100,
          );
          setProgress(percent);
        }
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.error('fatal network error encountered, try to recover');
              hls?.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.error('fatal media error encountered, try to recover');
              hls?.recoverMediaError();
              break;
            default:
              hls?.destroy();
              setLoading(false);
              setError(`Playback Error: ${data.details}`);
              break;
          }
        }
      });
    } else if (
      !isDirectStream &&
      video.canPlayType('application/vnd.apple.mpegurl')
    ) {
      video.src = url;
      video.addEventListener('loadedmetadata', () => {
        video.play().catch((e) => console.error('Error playing video:', e));
      });
    } else {
      // Direct playback for MP4 or other supported formats
      video.src = url;
      video.addEventListener('loadedmetadata', () => {
        video.play().catch((e) => console.error('Error playing video:', e));
      });
    }

    return () => {
      if (playbackTimeout) clearTimeout(playbackTimeout);
      video.removeEventListener('playing', handlePlaybackStart);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('canplay', handleCanPlay);
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
      {loading && !error && (
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
            zIndex: 8,
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              background: 'rgba(0,0,0,0.5)',
              padding: '20px',
              borderRadius: '10px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <Loader className="spin" size={48} color="white" />
            <span style={{ color: 'white', marginTop: '10px' }}>
              Loading... {progress > 0 ? `${progress}%` : ''}
            </span>
          </div>
        </div>
      )}
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
