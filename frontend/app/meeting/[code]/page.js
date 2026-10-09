'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import Icon from '@/components/Icon';
import VideoTile from '@/components/VideoTile';
import ParticipantsPanel from '@/components/ParticipantsPanel';
import { copy, formatCode, inviteLink } from '@/lib/format';

const mmss = (s) =>
  `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

function Tool({ icon, label, onClick, active, badge, danger }) {
  return (
    <button
      className={`tool ${danger ? 'danger' : ''} ${active ? 'on' : ''}`}
      onClick={onClick}
    >
      <Icon name={icon} size={24} />
      {badge > 0 && <b className="badge">{badge}</b>}
      <span>{label}</span>
    </button>
  );
}

export default function Room() {
  const { code } = useParams();
  const router = useRouter();

  const [pid, setPid] = useState(null);
  const [meeting, setMeeting] = useState(null);
  const [data, setData] = useState({ participants: [] });
  const [stream, setStream] = useState(null);

  const [muted, setMuted] = useState(true);
  const [camOn, setCamOn] = useState(false);
  const [panel, setPanel] = useState(false);
  const [info, setInfo] = useState(false);
  const [leaveMenu, setLeaveMenu] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [sharing, setSharing] = useState(false);
  const [sharingParticipants, setSharingParticipants] = useState({});
  const [moreMenu, setMoreMenu] = useState(false);
  const screenTrackRef = useRef(null);

  // Remote participant media streams.
  // participantId -> MediaStream
  const [remoteStreams, setRemoteStreams] = useState({});

  // WebRTC connections.
  const peersRef = useRef({});

  // WebSocket connection.
  const socketRef = useRef(null);

  /*
   * Create a WebRTC connection for one remote participant.
   */
  function createPeerConnection(remotePid) {
    if (peersRef.current[remotePid]) {
      return peersRef.current[remotePid];
    }

    const peer = new RTCPeerConnection({
      iceServers: [
        {
          urls: 'stun:stun.l.google.com:19302',
        },
      ],
    });

    // Send our local camera/microphone tracks.
    if (stream) {
      stream.getTracks().forEach((track) => {
        peer.addTrack(track, stream);
      });
    }

    // Receive remote camera/microphone tracks.
    peer.ontrack = (event) => {
      const [remoteStream] = event.streams;

      if (!remoteStream) return;

      setRemoteStreams((current) => ({
        ...current,
        [remotePid]: remoteStream,
      }));
    };

    // Send ICE candidates through FastAPI.
    peer.onicecandidate = (event) => {
      if (!event.candidate) return;

      const socket = socketRef.current;

      if (socket?.readyState === WebSocket.OPEN) {
        socket.send(
          JSON.stringify({
            type: 'ice-candidate',
            target: remotePid,
            candidate: event.candidate,
          })
        );
      }
    };

    peer.onconnectionstatechange = () => {
      const state = peer.connectionState;

      if (
        state === 'failed' ||
        state === 'closed' ||
        state === 'disconnected'
      ) {
        peer.close();
        delete peersRef.current[remotePid];

        setRemoteStreams((current) => {
          const next = { ...current };
          delete next[remotePid];
          return next;
        });
      }
    };

    peersRef.current[remotePid] = peer;

    return peer;
  }

  /*
  * Start screen sharing.
  */
  async function startScreenShare() {
    try {
      const displayStream =
        await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false,
        });

      const screenTrack = displayStream.getVideoTracks()[0];

      if (!screenTrack) {
        return;
      }

      screenTrackRef.current = screenTrack;

      // Replace the camera video track with the screen track
      // for every connected participant.
      Object.values(peersRef.current).forEach((peer) => {
        const sender = peer
          .getSenders()
          .find((s) => s.track?.kind === 'video');

        if (sender) {
          sender.replaceTrack(screenTrack);
        }
      });

      setSharing(true);

      const socket = socketRef.current;

      if (socket?.readyState === WebSocket.OPEN) {
        socket.send(
          JSON.stringify({
            type: 'screen-share',
            sharing: true,
          })
        );
      }

      // If the user clicks "Stop sharing" from the browser's
      // screen-sharing UI, restore the camera automatically.
      screenTrack.onended = () => {
        stopScreenShare();
      };
    } catch (error) {
      console.log('Screen sharing cancelled:', error);
    }
  }


  /*
  * Stop screen sharing and restore the camera track.
  */
  async function stopScreenShare() {
    const screenTrack = screenTrackRef.current;

    if (screenTrack) {
      screenTrack.onended = null;
      screenTrack.stop();
      screenTrackRef.current = null;
    }

    const cameraTrack = stream?.getVideoTracks()[0];

    if (cameraTrack) {
      Object.values(peersRef.current).forEach((peer) => {
        const sender = peer
          .getSenders()
          .find((s) => s.track?.kind === 'video');

        if (sender) {
          sender.replaceTrack(cameraTrack);
        }
      });

      // Respect the current camera state.
      cameraTrack.enabled = camOn;
    }

    const socket = socketRef.current;

    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(
        JSON.stringify({
          type: 'screen-share',
          sharing: false,
        })
      );
    }

    setSharing(false);
  }


  /*
  * Toggle screen sharing.
  */
  async function toggleScreenShare() {
    if (sharing) {
      await stopScreenShare();
    } else {
      await startScreenShare();
    }
  }

  async function toggleCamera() {
  if (camOn) {
    const videoTrack = stream?.getVideoTracks()[0];

    if (videoTrack) {
      videoTrack.stop();

      Object.values(peersRef.current).forEach((peer) => {
        const sender = peer.getSenders().find(
          (s) => s.track?.kind === 'video'
        );

        if (sender) {
          sender.replaceTrack(null);
        }
      });
    }

    setCamOn(false);
    setStream((prev) => {
      if (!prev) return prev;

      const newStream = new MediaStream(
        prev.getAudioTracks()
      );

      return newStream;
    });

    return;
  }

  try {
    const cameraStream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: false,
    });

    const cameraTrack = cameraStream.getVideoTracks()[0];

    if (!cameraTrack) return;

    const newStream = new MediaStream([
      ...(stream?.getAudioTracks() || []),
      cameraTrack,
    ]);

    setStream(newStream);
    setCamOn(true);

    Object.values(peersRef.current).forEach((peer) => {
      const sender = peer.getSenders().find(
        (s) => s.track?.kind === 'video'
      );

      if (sender) {
        sender.replaceTrack(cameraTrack);
      } else {
        peer.addTrack(cameraTrack, newStream);
      }
    });
  } catch (error) {
    console.log('Camera permission denied:', error);
    setCamOn(false);
  }
}

async function toggleMicrophone() {
  if (!muted) {
    const track = stream?.getAudioTracks()[0];

    if (track) {
      track.stop();

      Object.values(peersRef.current).forEach((peer) => {
        const sender = peer
          .getSenders()
          .find((s) => s.track?.kind === 'audio');

        if (sender) {
          sender.replaceTrack(null);
        }
      });
    }

    setMuted(true);
    return;
  }

  try {
    const micStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: false,
    });

    const micTrack = micStream.getAudioTracks()[0];

    if (!micTrack) return;

    let currentStream = stream;

    if (!currentStream) {
      currentStream = new MediaStream();
    }

    currentStream.addTrack(micTrack);
    setStream(currentStream);

    Object.values(peersRef.current).forEach((peer) => {
      const sender = peer
        .getSenders()
        .find((s) => s.track?.kind === 'audio');

      if (sender) {
        sender.replaceTrack(micTrack);
      } else {
        peer.addTrack(micTrack, currentStream);
      }
    });

    setMuted(false);
  } catch (error) {
    console.log('Microphone permission denied:', error);
    setMuted(true);
  }
}

  /*
   * join session + local media
   */
  useEffect(() => {
    const stored = sessionStorage.getItem(`zoom_pid_${code}`);

    if (!stored) {
      router.replace(`/j/${code}`);
      return;
    }

    setPid(Number(stored));

    api
      .meeting(code)
      .then(setMeeting)
      .catch(() => router.replace('/'));

    let dead = false;
    let media;

    navigator.mediaDevices
      ?.getUserMedia({
        video: false,
        audio: false,
      })
      .then((m) => {
        if (dead) {
          m.getTracks().forEach((t) => t.stop());
        } else {
          media = m;
          setStream(m);
        }
      })
      .catch(() => {});

    const t = setInterval(() => setElapsed((e) => e + 1), 1000);

    return () => {
      dead = true;
      clearInterval(t);

      media?.getTracks().forEach((track) => track.stop());
    };
  }, [code, router]);

  /*
   * Apply mute state to local microphone.
   */
  useEffect(() => {
    stream
      ?.getAudioTracks()
      .forEach((track) => (track.enabled = !muted));
  }, [stream, muted]);

  /*
   * Apply camera state to local video.
   */
  useEffect(() => {
    stream
      ?.getVideoTracks()
      .forEach((track) => (track.enabled = camOn));
  }, [stream, camOn]);

  /*
   * Sync local media state with backend.
   */
  useEffect(() => {
    if (pid) {
      api
        .state(pid, {
          is_muted: muted,
          is_video_on: camOn,
        })
        .catch(() => {});
    }
  }, [pid, muted, camOn]);

  /*
   * WebRTC signaling connection.
   */
  useEffect(() => {
    if (!pid || !stream) return;

    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';

    const host =
      process.env.NEXT_PUBLIC_API_WS_URL ||
      `${protocol}://${window.location.hostname}:8000`;

    const socket = new WebSocket(
      `${host}/ws/meetings/${code}?participant_id=${pid}`
    );

    socketRef.current = socket;

    socket.onopen = () => {
      console.log('WebSocket connected');
    };

    socket.onmessage = async (event) => {
      const message = JSON.parse(event.data);

      /*
       * Server tells us who is already in the meeting.
       *
       * The new participant creates offers to those peers.
       */
      if (message.type === 'peers') {
        for (const remotePid of message.peers) {
          const peer = createPeerConnection(remotePid);

          const offer = await peer.createOffer();

          await peer.setLocalDescription(offer);

          socket.send(
            JSON.stringify({
              type: 'offer',
              target: remotePid,
              offer: peer.localDescription,
            })
          );
        }

        return;
      }

      /*
       * Another participant joined.
       *
       * We don't create an offer here because the newly joined
       * participant already creates one for existing peers.
       */
      if (message.type === 'peer-joined') {
        return;
      }

      /*
       * Receive WebRTC offer.
       */
      if (message.type === 'offer') {
        const remotePid = message.from;

        const peer = createPeerConnection(remotePid);

        await peer.setRemoteDescription(
          new RTCSessionDescription(message.offer)
        );

        const answer = await peer.createAnswer();

        await peer.setLocalDescription(answer);

        socket.send(
          JSON.stringify({
            type: 'answer',
            target: remotePid,
            answer: peer.localDescription,
          })
        );

        return;
      }

      /*
       * Receive WebRTC answer.
       */
      if (message.type === 'answer') {
        const remotePid = message.from;
        const peer = peersRef.current[remotePid];

        if (!peer) return;

        await peer.setRemoteDescription(
          new RTCSessionDescription(message.answer)
        );

        return;
      }

      /*
       * Receive ICE candidate.
       */
      if (message.type === 'ice-candidate') {
        const remotePid = message.from;
        const peer = peersRef.current[remotePid];

        if (!peer) return;

        try {
          await peer.addIceCandidate(
            new RTCIceCandidate(message.candidate)
          );
        } catch (error) {
          console.error('Failed to add ICE candidate:', error);
        }

        return;
      }

      if (message.type === 'screen-share') {
        const remotePid = message.participant_id;

        setSharingParticipants((current) => ({
          ...current,
          [remotePid]: message.sharing,
        }));

        return;
      }

      /*
       * Participant disconnected.
       */
      if (message.type === 'peer-left') {
        const remotePid = message.participant_id;
        setSharingParticipants((current) => {
          const next = { ...current };
          delete next[remotePid];
          return next;
        });

        const peer = peersRef.current[remotePid];

        if (peer) {
          peer.close();
          delete peersRef.current[remotePid];
        }

        setRemoteStreams((current) => {
          const next = { ...current };
          delete next[remotePid];
          return next;
        });
      }
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    socket.onclose = () => {
      console.log('WebSocket disconnected');
    };

    return () => {
      socket.close();

      Object.values(peersRef.current).forEach((peer) => {
        peer.close();
      });

      peersRef.current = {};
      socketRef.current = null;
    };
  }, [pid, stream, code]);

  /*
   * poll roster
   * also detects removal / meeting end
   */
  useEffect(() => {
    if (!pid) return;

    let stop = false;

    const tick = async () => {
      try {
        const d = await api.participants(code, pid);

        if (stop) return;

        setData(d);

        if (d.me_status === 'removed') {
          router.replace('/?notice=removed');
        } else if (d.meeting_status === 'ended') {
          router.replace('/?notice=ended');
        }
      } catch {}
    };

    tick();

    const t = setInterval(tick, 2500);

    return () => {
      stop = true;
      clearInterval(t);
    };
  }, [pid, code, router]);

  const me = data.participants.find((p) => p.id === pid);
  const isHost = me?.role === 'host';

  /*
   * Host muted me.
   */
  useEffect(() => {
    if (me?.is_muted) {
      setMuted(true);
    }
  }, [me?.is_muted]);

  const ordered = me
    ? [me, ...data.participants.filter((p) => p.id !== pid)]
    : data.participants;

  const cols = Math.ceil(Math.sqrt(ordered.length || 1));

  async function leave(end) {
    /*
     * Close WebRTC connections.
     */
    Object.values(peersRef.current).forEach((peer) => {
      peer.close();
    });

    peersRef.current = {};

    /*
     * Close WebSocket.
     */
    socketRef.current?.close();
    socketRef.current = null;

    /*
     * Leave meeting through existing API.
     */
    await api.leave(pid, end).catch(() => {});

    sessionStorage.removeItem(`zoom_pid_${code}`);

    router.replace('/');
  }

  return (
    <div className="room">
      <div className="room-top">
        <button className="info-btn" onClick={() => setInfo(!info)}>
          <Icon name="shield" size={18} /> Meeting info
        </button>

        <span className="timer">{mmss(elapsed)}</span>

        {info && meeting && (
          <div className="info-pop">
            <strong>{meeting.title}</strong>

            <p>Meeting ID: {formatCode(meeting.code)}</p>

            <p>Host: {meeting.host_name}</p>

            <p className="link">{inviteLink(meeting.code)}</p>

            <button
              className="chip"
              onClick={() => copy(inviteLink(meeting.code))}
            >
              Copy invite link
            </button>
          </div>
        )}
      </div>

      <div className="stage">
        <div
          className="grid"
          style={{
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
          }}
        >
          {ordered.map((p) => (
            <VideoTile
              key={p.id}
              p={p}
              isMe={p.id === pid}
              stream={
                p.id === pid
                  ? stream
                  : remoteStreams[p.id] || null
              }
              camOn={
                p.id === pid
                  ? camOn || sharing
                  : p.is_video_on || sharingParticipants[p.id]
              }
              muted={
                p.id === pid
                  ? muted
                  : p.is_muted
              }
            />
          ))}
        </div>

        {panel && (
          <ParticipantsPanel
            list={ordered}
            myId={pid}
            isHost={isHost}
            onClose={() => setPanel(false)}
            onMuteAll={() => api.muteAll(code, pid)}
            onMute={(p) => api.mute(p.id, pid)}
            onRemove={(p) => api.kick(p.id, pid)}
          />
        )}
      </div>

      <div className="toolbar">

        {/* LEFT CONTROLS */}
        <div className="toolbar-left">
          <Tool
            icon={muted ? 'micoff' : 'mic'}
            label={muted ? 'Unmute' : 'Mute'}
            onClick={toggleMicrophone}
            active={muted}
          />

          <Tool
            icon={camOn ? 'video' : 'videooff'}
            label={camOn ? 'Stop Video' : 'Start Video'}
            onClick={toggleCamera}
            active={!camOn}
          />
        </div>

        {/* CENTER CONTROLS */}
        <div className="toolbar-center">
          <Tool
            icon="users"
            label="Participants"
            badge={ordered.length}
            onClick={() => setPanel(!panel)}
            active={panel}
          />

          <Tool
            icon="chat"
            label="Chat"
            onClick={() => {}}
          />

          <div className="mobile-more-item">
            <Tool
            icon="smile"
            label="React"
            onClick={() => {}}
          />
          </div>

          <div className="mobile-more-item">
          <Tool
            icon="share"
            label={sharing ? 'Stop Share' : 'Share Screen'}
            onClick={toggleScreenShare}
            active={sharing}
          />
          </div>

          {isHost && (
            <div className="mobile-more-item">
            <Tool
            icon="shield"
            label="Host tools"
            onClick={() => setPanel(true)}
            />
            </div>
          )}

          <div className="mobile-more-wrap">
            <Tool
              icon="more"
              label="More"
              onClick={() => setMoreMenu(!moreMenu)}
              active={moreMenu}
            />

            {moreMenu && (
              <div className="mobile-more-menu">
                <Tool
                  icon="smile"
                  label="React"
                  onClick={() => setMoreMenu(false)}
                />

                <Tool
                  icon="share"
                  label={sharing ? 'Stop Share' : 'Share Screen'}
                  onClick={() => {
                    toggleScreenShare();
                    setMoreMenu(false);
                  }}
                  active={sharing}
                />

                {isHost && (
                  <Tool
                    icon="shield"
                    label="Host tools"
                    onClick={() => setPanel(true)}
                  />
                )}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT CONTROL */}
        <div className="toolbar-right">
          <div className="leave-wrap">
            <button
              className="btn-leave"
              onClick={() => setLeaveMenu(!leaveMenu)}
            >
              {isHost ? 'End' : 'Leave'}
            </button>

            {leaveMenu && (
              <div className="leave-pop">
                {isHost && (
                  <button
                    className="danger-text"
                    onClick={() => leave(true)}
                  >
                    End Meeting for All
                  </button>
                )}

                <button onClick={() => leave(false)}>
                  Leave Meeting
                </button>

                <button onClick={() => setLeaveMenu(false)}>
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}