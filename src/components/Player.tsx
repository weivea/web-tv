import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import mpegts from 'mpegts.js';
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
    let flvPlayer: mpegts.Player | null = null;
    let playbackTimeout: number | null = null;
    let isMounted = true;

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
      if (flvPlayer) {
        flvPlayer.destroy();
        flvPlayer = null;
      }
    }, 20000);

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

    const initPlayer = async () => {
      let playUrl = url;

      // Helper to resolve nested Master Playlists (Master -> Master -> Media)
      // This fixes issues where hls.js might get stuck reloading a master playlist that points to another master playlist
      const resolveMasterPlaylist = async (
        targetUrl: string,
        depth = 0,
      ): Promise<string> => {
        if (depth > 3) return targetUrl; // Avoid infinite recursion
        try {
          // Only attempt to resolve if it looks like an m3u8
          if (!targetUrl.includes('.m3u8')) return targetUrl;

          const response = await fetch(targetUrl);
          const text = await response.text();

          // If it contains #EXTINF, it's a Media Playlist (final destination), stop resolving
          if (text.includes('#EXTINF:')) {
            return targetUrl;
          }

          // Check if it is a Master Playlist (has STREAM-INF)
          const streamInfCount = (text.match(/#EXT-X-STREAM-INF/g) || [])
            .length;

          // If it has exactly ONE variant, we can safely resolve it to that variant
          // This handles the case where a Master Playlist just redirects to another Master/Media Playlist
          if (streamInfCount === 1) {
            const lines = text.split('\n');
            for (let i = 0; i < lines.length; i++) {
              if (lines[i].includes('#EXT-X-STREAM-INF')) {
                // The URL is usually the next non-empty, non-comment line
                for (let j = i + 1; j < lines.length; j++) {
                  const line = lines[j].trim();
                  if (line && !line.startsWith('#')) {
                    const nextUrl = new URL(line, targetUrl).toString();
                    // Prevent infinite loop if it points to itself
                    if (nextUrl === targetUrl) return targetUrl;
                    return resolveMasterPlaylist(nextUrl, depth + 1);
                  }
                }
              }
            }
          }
          // If it has multiple variants (ABR) or no variants (unknown), return the current URL
          // letting hls.js handle the selection.
          return targetUrl;
        } catch (e) {
          console.warn('Failed to resolve playlist, using original', e);
          return targetUrl;
        }
      };

      try {
        playUrl = await resolveMasterPlaylist(url);
      } catch (e) {
        console.warn('Error resolving playlist', e);
      }

      if (!isMounted) return;

      let isDirectStream = false;
      let isFlvStream = false;
      try {
        const u = new URL(playUrl);
        isDirectStream = /\.(mp4|webm|ogg|mov|mkv)$/i.test(u.pathname);
        isFlvStream = /\.flv$/i.test(u.pathname);
      } catch (e) {
        isDirectStream = /\.(mp4|webm|ogg|mov|mkv)($|\?)/i.test(playUrl);
        isFlvStream = /\.flv($|\?)/i.test(playUrl);
      }

      if (isFlvStream && mpegts.isSupported()) {
        flvPlayer = mpegts.createPlayer(
          {
            type: 'flv',
            url: playUrl,
            isLive: true,
            cors: true,
            hasAudio: true,
            hasVideo: true,
          },
          {
            enableWorker: true,
            enableStashBuffer: true, // Enable stash buffer for better stability
            stashInitialSize: 128,
            autoCleanupSourceBuffer: true,
          },
        );
        flvPlayer.attachMediaElement(video);
        flvPlayer.load();
        const playPromise = flvPlayer.play();
        if (playPromise !== undefined) {
          playPromise.catch((e) => console.error('Error playing video:', e));
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        flvPlayer.on(mpegts.Events.MEDIA_INFO, (info: any) => {
          console.log('FLV Media Info:', info);
          // Detect HEVC (H.265) which is often not supported in standard Electron
          if (
            info?.mimeType?.includes('hvc1') ||
            info?.mimeType?.includes('hev1')
          ) {
            setError(
              'Error: HEVC (H.265) video codec is not supported by this player.',
            );
            setLoading(false);
          }
        });

        flvPlayer.on(mpegts.Events.ERROR, (type, details) => {
          console.error('Mpegts error', type, details);
          if (type === mpegts.ErrorTypes.NETWORK_ERROR) {
            flvPlayer?.load(); // Try to reload on network error
          } else {
            setError(`Playback Error: ${type} - ${details}`);
            setLoading(false);
          }
        });
      } else if (!isDirectStream && Hls.isSupported()) {
        hls = new Hls({
          manifestLoadingTimeOut: 15000, // 15s timeout for manifest loading
          manifestLoadingMaxRetry: 2, // Max 2 retries
          levelLoadingTimeOut: 15000, // 15s timeout for level loading
          fragLoadingTimeOut: 20000, // 20s timeout for fragment loading
        });
        hls.loadSource(playUrl);
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
                console.error(
                  'fatal network error encountered, try to recover',
                );
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
        video.src = playUrl;
        video.addEventListener('loadedmetadata', () => {
          video.play().catch((e) => console.error('Error playing video:', e));
        });
      } else {
        // Direct playback for MP4 or other supported formats
        video.src = playUrl;
        video.addEventListener('loadedmetadata', () => {
          video.play().catch((e) => console.error('Error playing video:', e));
        });
      }
    };

    initPlayer();

    return () => {
      isMounted = false;
      if (playbackTimeout) clearTimeout(playbackTimeout);
      video.removeEventListener('playing', handlePlaybackStart);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('error', handleVideoError);
      if (hls) {
        hls.destroy();
      }
      if (flvPlayer) {
        flvPlayer.destroy();
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
