import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic, MicOff, Video, VideoOff, PhoneOff,
  Maximize2, Minimize2, Phone, Volume2, ShieldCheck
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { UserProfile } from '../lib/types';

export interface CallSession {
  callId: string;
  conversationId: string;
  caller: UserProfile;
  receiver: UserProfile;
  isVideo: boolean;
  status: 'ringing' | 'connected' | 'ended';
}

interface VideoCallModalProps {
  currentCall: CallSession | null;
  currentUser: UserProfile;
  onEndCall: () => void;
  onAcceptCall?: () => void;
}

// Google's public STUN servers (100% free, reliable WebRTC ICE servers)
const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

export const VideoCallModal: React.FC<VideoCallModalProps> = ({
  currentCall,
  currentUser,
  onEndCall,
  onAcceptCall,
}) => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState<string>('Connecting...');

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const timerRef = useRef<any>(null);

  const isIncoming = currentCall && currentCall.receiver.id === currentUser.id && currentCall.status === 'ringing';
  const isCaller = currentCall && currentCall.caller.id === currentUser.id;
  const otherUser = isCaller ? currentCall?.receiver : currentCall?.caller;

  // ─── Format Duration ────────────────────────────────────────────────────────
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  // ─── Start Call Duration Timer ──────────────────────────────────────────────
  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
  }, []);

  // ─── Clean up all media & connection ────────────────────────────────────────
  const cleanup = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    setLocalStream(null);
    setRemoteStream(null);
    setCallDuration(0);
  }, [localStream]);

  // ─── Initialize Media & WebRTC ───────────────────────────────────────────────
  const setupWebRTC = useCallback(async () => {
    if (!currentCall) return;

    try {
      // 1. Get user media (camera + mic)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: currentCall.isVideo,
        audio: true,
      });

      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // 2. Initialize RTCPeerConnection
      const pc = new RTCPeerConnection(ICE_SERVERS);
      peerConnectionRef.current = pc;

      // Add local tracks to peer connection
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      // Handle incoming remote stream tracks
      pc.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
          setRemoteStream(event.streams[0]);
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = event.streams[0];
          }
          setConnectionStatus('Connected');
          startTimer();
        }
      };

      pc.oniceconnectionstatechange = () => {
        if (pc.iceConnectionState === 'connected') {
          setConnectionStatus('Connected');
        } else if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'failed') {
          setConnectionStatus('Connection lost');
        }
      };

      // 3. Connect Supabase Realtime Broadcast Channel for WebRTC Signaling
      const channel = supabase.channel(`call:${currentCall.callId}`, {
        config: { broadcast: { self: false } },
      });

      // Handle ICE Candidates
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          channel.send({
            type: 'broadcast',
            event: 'ice-candidate',
            payload: { candidate: event.candidate, senderId: currentUser.id },
          });
        }
      };

      // Listen for remote signaling messages
      channel
        .on('broadcast', { event: 'offer' }, async ({ payload }) => {
          if (payload.senderId === currentUser.id) return;
          try {
            await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            channel.send({
              type: 'broadcast',
              event: 'answer',
              payload: { sdp: answer, senderId: currentUser.id },
            });
          } catch (err) {
            console.error('Error handling offer:', err);
          }
        })
        .on('broadcast', { event: 'answer' }, async ({ payload }) => {
          if (payload.senderId === currentUser.id) return;
          try {
            await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
          } catch (err) {
            console.error('Error handling answer:', err);
          }
        })
        .on('broadcast', { event: 'ice-candidate' }, async ({ payload }) => {
          if (payload.senderId === currentUser.id) return;
          try {
            if (payload.candidate) {
              await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
            }
          } catch (err) {
            console.error('Error adding ice candidate:', err);
          }
        })
        .on('broadcast', { event: 'end-call' }, () => {
          cleanup();
          onEndCall();
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            // If we are the caller and call is accepted/connected, create offer
            if (isCaller) {
              try {
                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);
                channel.send({
                  type: 'broadcast',
                  event: 'offer',
                  payload: { sdp: offer, senderId: currentUser.id },
                });
              } catch (err) {
                console.error('Error creating offer:', err);
              }
            }
          }
        });

      channelRef.current = channel;
    } catch (err: any) {
      console.error('Failed to get media or start call:', err);
      setConnectionStatus('Camera / mic permission denied');
    }
  }, [currentCall, currentUser.id, isCaller, onEndCall, cleanup, startTimer]);

  // When call status becomes 'connected', run WebRTC setup
  useEffect(() => {
    if (currentCall && currentCall.status === 'connected') {
      setupWebRTC();
    }
    return () => {
      cleanup();
    };
  }, [currentCall?.status]);

  // Toggle Mute Audio
  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  // Toggle Video Camera
  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsVideoOff(!isVideoOff);
    }
  };

  // Hang up / End Call
  const handleHangup = () => {
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'end-call',
        payload: { senderId: currentUser.id },
      });
    }
    cleanup();
    onEndCall();
  };

  if (!currentCall) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md">
        {/* INCOMING CALL SCREEN */}
        {isIncoming ? (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col items-center text-center relative overflow-hidden"
          >
            {/* Pulsing ring animation */}
            <div className="relative mb-6">
              <motion.div
                animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0, 0.6] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute inset-0 rounded-full bg-cyan-500/30 blur-md"
              />
              <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-tr from-blue-600 to-cyan-500 ring-4 ring-cyan-500/40 relative z-10 flex items-center justify-center shadow-xl">
                {otherUser?.avatar_url ? (
                  <img src={otherUser.avatar_url} alt={otherUser.display_name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl font-extrabold text-white">
                    {otherUser?.display_name?.charAt(0)?.toUpperCase() || '?'}
                  </span>
                )}
              </div>
            </div>

            <h3 className="text-xl font-bold text-white mb-1">{otherUser?.display_name}</h3>
            <p className="text-xs text-cyan-400 font-medium mb-6">
              Incoming {currentCall.isVideo ? 'Video' : 'Voice'} Call...
            </p>

            <div className="flex items-center gap-6">
              {/* Decline button */}
              <button
                onClick={handleHangup}
                className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-500 active:scale-95 text-white flex items-center justify-center shadow-lg shadow-red-600/30 transition"
                title="Decline"
              >
                <PhoneOff className="w-6 h-6" />
              </button>

              {/* Accept button */}
              <button
                onClick={onAcceptCall}
                className="w-16 h-16 rounded-full bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white flex items-center justify-center shadow-xl shadow-emerald-600/40 transition animate-pulse"
                title="Accept"
              >
                {currentCall.isVideo ? <Video className="w-7 h-7" /> : <Phone className="w-7 h-7" />}
              </button>
            </div>
          </motion.div>
        ) : (
          /* ACTIVE / CONNECTED VIDEO CALL WINDOW */
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className={`w-full ${
              isFullScreen ? 'h-full max-w-none' : 'max-w-4xl h-[85vh]'
            } bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col relative transition-all duration-300`}
          >
            {/* Top Bar Overlay */}
            <div className="absolute top-0 inset-x-0 p-4 z-20 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent pointer-events-auto">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-800 ring-2 ring-slate-700 flex items-center justify-center">
                  {otherUser?.avatar_url ? (
                    <img src={otherUser.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="font-bold text-white text-sm">{otherUser?.display_name?.charAt(0)}</span>
                  )}
                </div>
                <div>
                  <h4 className="text-white text-sm font-bold flex items-center gap-1.5">
                    {otherUser?.display_name}
                    <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                  </h4>
                  <p className="text-[11px] text-slate-400 font-medium">
                    {connectionStatus} {callDuration > 0 && `• ${formatTime(callDuration)}`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsFullScreen(!isFullScreen)}
                  className="p-2 text-slate-300 hover:text-white bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-xl transition"
                  title="Toggle Fullscreen"
                >
                  {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Video Streams Canvas */}
            <div className="flex-1 relative bg-slate-950 flex items-center justify-center overflow-hidden">
              {/* Remote Stream (Main view) */}
              {remoteStream ? (
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-center p-6 space-y-4">
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden bg-slate-900 border-2 border-slate-800 flex items-center justify-center relative">
                    <motion.div
                      animate={{ scale: [1, 1.25, 1], opacity: [0.5, 0, 0.5] }}
                      transition={{ duration: 2.5, repeat: Infinity }}
                      className="absolute inset-0 rounded-full bg-blue-500/30"
                    />
                    {otherUser?.avatar_url ? (
                      <img src={otherUser.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-3xl font-bold text-white">{otherUser?.display_name?.charAt(0)}</span>
                    )}
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-lg">{otherUser?.display_name}</h4>
                    <p className="text-xs text-slate-400 mt-1 animate-pulse">
                      {currentCall.status === 'ringing' ? 'Ringing...' : connectionStatus}
                    </p>
                  </div>
                </div>
              )}

              {/* Local Stream (Picture-in-Picture window) */}
              {currentCall.isVideo && (
                <motion.div
                  drag
                  dragConstraints={{ top: 0, left: 0, right: 200, bottom: 200 }}
                  className="absolute bottom-24 right-4 sm:bottom-28 sm:right-6 w-28 sm:w-44 aspect-video bg-slate-900 border-2 border-slate-700/80 rounded-2xl overflow-hidden shadow-2xl z-30 cursor-grab active:cursor-grabbing"
                >
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full object-cover ${isVideoOff ? 'hidden' : ''}`}
                  />
                  {isVideoOff && (
                    <div className="w-full h-full flex items-center justify-center bg-slate-900 text-slate-500 text-xs font-semibold">
                      Camera Off
                    </div>
                  )}
                  <span className="absolute bottom-1.5 left-2 px-1.5 py-0.5 rounded bg-black/60 text-[9px] text-white backdrop-blur">
                    You
                  </span>
                </motion.div>
              )}
            </div>

            {/* Bottom Controls Bar */}
            <div className="absolute bottom-0 inset-x-0 p-4 sm:p-6 z-20 flex items-center justify-center gap-3 sm:gap-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent pointer-events-auto">
              {/* Mute button */}
              <button
                onClick={toggleMute}
                className={`p-3.5 sm:p-4 rounded-2xl backdrop-blur-md transition shadow-lg ${
                  isMuted ? 'bg-red-500/80 text-white' : 'bg-slate-800/80 hover:bg-slate-700 text-white'
                }`}
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              {/* Toggle Video Camera */}
              {currentCall.isVideo && (
                <button
                  onClick={toggleVideo}
                  className={`p-3.5 sm:p-4 rounded-2xl backdrop-blur-md transition shadow-lg ${
                    isVideoOff ? 'bg-red-500/80 text-white' : 'bg-slate-800/80 hover:bg-slate-700 text-white'
                  }`}
                  title={isVideoOff ? 'Turn Video On' : 'Turn Video Off'}
                >
                  {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                </button>
              )}

              {/* End / Hangup Call button */}
              <button
                onClick={handleHangup}
                className="px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl bg-red-600 hover:bg-red-500 active:scale-95 text-white flex items-center gap-2 font-semibold shadow-xl shadow-red-600/30 transition"
                title="End Call"
              >
                <PhoneOff className="w-5 h-5" />
                <span className="text-xs sm:text-sm font-bold">End</span>
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </AnimatePresence>
  );
};
