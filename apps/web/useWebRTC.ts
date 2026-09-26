"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {Socket} from "socket.io-client";

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

interface UseWebRTCProps {
socket: Socket | null;
roomCode: string;
isHost: boolean;
isPeerConnected: boolean;
}

export function usewebRTC({ socket, roomCode, isHost, isPeerConnected }: UseWebRTCProps) 
{
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
    const [isAudioMuted, setIsAudioMuted] = useState(false);
    const [isVideoMuted, setIsVideoMuted] = useState(false);
     const [connectionState, setConnectionState] = useState<
    "disconnected" | "connecting" | "connected"
  >("disconnected");

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function startCamera(){
        try{
             const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 } },
          audio: true,
        });

        if (!isMounted) {
            stream.getTracks().forEach((track) => track.stop());
            return;
        }

        localStreamRef.current = stream;
        setLocalStream(stream);
        }
        catch (error) {
            console.error("Error accessing camera and microphone:", error);
        }
    }

        startCamera();

        return () => {
            isMounted = false;
            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach((track) => track.stop());
            }
        };
  }, []);

 const createPeerConnection = useCallback(() => {
    // If a connection already exists, reuse it!
    if (peerConnectionRef.current) return peerConnectionRef.current;
    // Create a new native WebRTC peer connection configured with STUN
    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnectionRef.current = pc;
    // A. FEED OUR TRACKS: Feed our local camera and mic into the connection
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }
    // B. CATCH PARTNER'S TRACKS: When remote video arrives from our partner
    pc.ontrack = (event) => {
      console.log("🎥 [WebRTC] Received remote stream track from partner!");
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
      }
    };
    // C. DISCOVER PUBLIC IP (ICE Candidates): Send our public address to partner via Socket
    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit("webrtc_ice_candidate", {
          roomCode,
          candidate: event.candidate,
        });
      }
    };
    // D. CONNECTION MONITOR: Track live status (connecting -> connected -> disconnected)
    pc.onconnectionstatechange = () => {
      console.log(`📡 [WebRTC] Connection State: ${pc.connectionState}`);
      if (pc.connectionState === "connected") {
        setConnectionState("connected");
      } else if (
        pc.connectionState === "connecting" ||
        pc.connectionState === "new"
      ) {
        setConnectionState("connecting");
      } else {
        setConnectionState("disconnected");
      }
    };
    return pc;
  }, [socket, roomCode]);

   useEffect(() => {
    if (!socket) return;
    // A. Partner sent an Offer -> We (Peer) create an Answer
    const handleOffer = async ({ sdp }: { sdp: RTCSessionDescriptionInit }) => {
      console.log("📨 [WebRTC] Received Offer from Host");
      const pc = createPeerConnection();
      await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit("webrtc_answer", { roomCode, sdp: answer });
    };
    // B. Partner sent an Answer -> We (Host) set Remote Description
    const handleAnswer = async ({ sdp }: { sdp: RTCSessionDescriptionInit }) => {
      console.log("📨 [WebRTC] Received Answer from Peer");
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.setRemoteDescription(
          new RTCSessionDescription(sdp)
        );
      }
    };
    // C. Partner sent an ICE Candidate -> Add their network address
    const handleCandidate = async ({
      candidate,
    }: {
      candidate: RTCIceCandidateInit;
    }) => {
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.addIceCandidate(
          new RTCIceCandidate(candidate)
        );
      }
    };
    // D. Partner left the room -> Clean up the peer connection
    const handlePeerDisconnected = () => {
      console.log("👋 [WebRTC] Partner disconnected, resetting connection");
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
      setRemoteStream(null);
      setConnectionState("disconnected");
    };
    socket.on("webrtc_offer", handleOffer);
    socket.on("webrtc_answer", handleAnswer);
    socket.on("webrtc_ice_candidate", handleCandidate);
    socket.on("peer_disconnected", handlePeerDisconnected);
    return () => {
      socket.off("webrtc_offer", handleOffer);
      socket.off("webrtc_answer", handleAnswer);
      socket.off("webrtc_ice_candidate", handleCandidate);
      socket.off("peer_disconnected", handlePeerDisconnected);
    };
  }, [socket, roomCode, createPeerConnection]);

  // 4. Host initiates the call as soon as the Peer joins the room
  useEffect(() => {
    if (!isHost || !isPeerConnected || !socket || !localStream) return;

    async function callPeer() {
      console.log("📞 [WebRTC] Host initiating call to Peer...");
      const pc = createPeerConnection();
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socket.emit("webrtc_offer", { roomCode, sdp: offer });
    }

    callPeer();
  }, [isHost, isPeerConnected, socket, localStream, roomCode, createPeerConnection]);

    // Toggle Mic (Mute / Unmute)
  const toggleAudio = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled; // Toggle hardware track
      });
      setIsAudioMuted((prev) => !prev);
    }
  };

  // Toggle Camera (Video On / Off)
  const toggleVideo = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = !track.enabled; // Toggle video track
      });
      setIsVideoMuted((prev) => !prev);
    }
  };


  return {
    localStream,
    remoteStream,
    isAudioMuted,
    isVideoMuted,
    connectionState,
    toggleAudio,
    toggleVideo,
  }
}