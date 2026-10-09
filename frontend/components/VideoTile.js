import { useEffect, useRef } from 'react';
import Icon from './Icon';
import { colorFor, initials } from '@/lib/format';

export default function VideoTile({ p, isMe, stream, camOn, muted }) {
  const ref = useRef(null);

  const hasVideo =
    stream?.getVideoTracks().length > 0;

  const showVideo = hasVideo && camOn;

  useEffect(() => {
    if (!ref.current) return;

    // Keep the remote media stream attached even when
    // the participant's camera is turned off.
    ref.current.srcObject = stream || null;
  }, [stream]);

  return (
    <div className="vtile">
      {/* 
        Keep the video element mounted whenever a stream exists.
        This is important because the same WebRTC stream contains
        both audio and video tracks.
      */}
      {stream && (
        <video
          ref={ref}
          autoPlay
          muted={isMe}
          playsInline
          className="mirror"
          style={{
            display: showVideo ? 'block' : 'none',
          }}
        />
      )}

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