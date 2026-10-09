
import { useEffect, useRef, useState } from 'react';
import Icon from './Icon';
import { colorFor, initials } from '@/lib/format';

export default function VideoTile({
  p,
  isMe,
  stream,
  camOn,
  muted,
}) {
  const ref = useRef(null);
  const [playing, setPlaying] = useState(false);

  
useEffect(() => {
  const video = ref.current;
  if (!video) return;

  video.srcObject = stream || null;

  if (stream) {
    video.play().catch((error) => {
      if (error.name !== "AbortError") {
        console.warn("Video playback failed:", error);
      }
    });
  }

  return () => {
    video.pause();
    video.srcObject = null;
  };
}, [stream]);


  const hasVideo =
    stream?.getVideoTracks().some(
      (track) => track.readyState === 'live'
    ) ?? false;

  const showVideo = hasVideo && camOn;

  return (
    <div className="vtile">
      <video
        ref={ref}
        autoPlay
        playsInline
        muted={isMe}
        className="mirror"
        style={{
          display: showVideo ? 'block' : 'none',
        }}
      />

      {!showVideo && (
        <div
          className="vavatar"
          style={{ background: colorFor(p.display_name) }}
        >
          {initials(p.display_name)}
        </div>
      )}

      <div className="vlabel">
        {muted && <Icon name="micoff" size={14} />}
        {p.display_name}
        {isMe ? ' (Me)' : ''}
        {p.role === 'host' ? ' (Host)' : ''}
      </div>
    </div>
  );
}
