import React, { useState, useEffect, useRef } from 'react';
// For waveform rendering
// ...existing code...
import io from 'socket.io-client';
const SOCKET_URL = process.env.REACT_APP_SOCKET_URL;

const ChatModal = ({ doctor, patient, appointmentId }) => {
  // All hooks at the very top before any logic
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const peerConnectionRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioChunks, setAudioChunks] = useState([]);
  const [showCallModal, setShowCallModal] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null); // { from, name, avatar }
  const [callActive, setCallActive] = useState(false);
  // Now safe to use state/refs below
  const room = `${doctor._id}_${patient._id}_${appointmentId}`;
  if (!doctor.isCurrentDoctor && !patient.isCurrentUser) {
    patient.isCurrentUser = true;
  }
  const myId = doctor.isCurrentDoctor ? doctor._id : patient._id;
  const myName = doctor.isCurrentDoctor ? doctor.name : patient.name;
  const myAvatar = doctor.isCurrentDoctor ? (doctor.avatarUrl || doctor.profilePic) : (patient.avatarUrl || patient.profilePic);
  const peerId = doctor.isCurrentDoctor ? patient._id : doctor._id;
  const peerName = doctor.isCurrentDoctor ? patient.name : doctor.name;
  // Removed unused peerAvatar

  // Robust: Always attach local stream to local video element after any modal/callActive change or remount

  
  useEffect(() => {
    // Attach and play local stream robustly
    const video = localVideoRef.current;
    if (video && localStream) {
      if (video.srcObject !== localStream) {
        video.srcObject = localStream;
      }
      // Try to play, handle browser autoplay
      const playPromise = video.play();
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(() => {});
      }
    }
  }, [localStream, callActive, showCallModal]);

  // Always attach remote stream to remote video element
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // Also force re-attach after negotiation (offer/answer)
// ...existing code...

// Force re-attach local video after negotiation for both caller and receiver
useEffect(() => {
  if (localVideoRef.current && localStream) {
    setTimeout(() => {
      localVideoRef.current.srcObject = localStream;
      // Try to play, handle browser autoplay
      const playPromise = localVideoRef.current.play();
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(() => {});
      }
      console.log('Force re-attach local video after negotiation:', localStream, localVideoRef.current);
    }, 200);
  }
}, [callActive, localStream, showCallModal]);

// ...existing code... 
  // Start recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Specify correct MIME type for webm audio
      const recorder = new window.MediaRecorder(stream, { mimeType: 'audio/webm' });
      setMediaRecorder(recorder);
      setAudioChunks([]);
      recorder.ondataavailable = (e) => {
        setAudioChunks((prev) => [...prev, e.data]);
      };
      recorder.onstop = async () => {
        // Prevent upload if audioChunks is empty or too short
        if (!audioChunks || audioChunks.length === 0 || (audioChunks.length === 1 && audioChunks[0].size < 1000)) {
          alert('Recording too short or no audio detected. Please record at least 1 second.');
          return;
        }
        // Use correct mimetype and extension for webm audio
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        if (audioBlob.size < 1000) {
          alert('Recording too short or no audio detected. Please record at least 1 second.');
          return;
        }
        const formData = new FormData();
        formData.append('audio', audioBlob, 'voice-message.webm');
        formData.append('senderId', doctor.isCurrentDoctor ? doctor._id : patient._id);
        formData.append('receiverId', doctor.isCurrentDoctor ? patient._id : doctor._id);
        formData.append('senderModel', doctor.isCurrentDoctor ? 'Doctor' : 'User');
        formData.append('receiverModel', doctor.isCurrentDoctor ? 'User' : 'Doctor');
        formData.append('appointmentId', appointmentId);
        const token = doctor.isCurrentDoctor ? doctor.token : patient.token;
        const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/messages/upload-audio`, {
          method: 'POST',
          headers: {
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          body: formData
        });
        const data = await res.json();
        if (data && data._id) {
          setMessages((prev) => [...prev, data]);
          // No auto-play, just show audio UI
        }
      };
      recorder.start();
      setIsRecording(true);
    } catch (err) {
      alert('Mic access denied or not available.');
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };
  useEffect(() => {
    // Connect socket
    socketRef.current = io(SOCKET_URL, { transports: ['websocket'] });
    // Register user (doctor or patient)
    socketRef.current.emit('register', myId);
    // Join room
    socketRef.current.emit('joinRoom', { room });
    // Listen for messages
    socketRef.current.on('receiveMessage', (data) => {
      setMessages((prev) => [...prev, data]);
      // No auto-play, just show audio UI
    });
    // Fetch old messages (API call)
    fetch(`${process.env.REACT_APP_API_BASE_URL}/api/messages/${doctor._id}/${patient._id}`,
      {
        headers: {
          'Content-Type': 'application/json',
          ...((doctor.isCurrentDoctor && doctor.token)
            ? { 'Authorization': `Bearer ${doctor.token}` }
            : (patient.token ? { 'Authorization': `Bearer ${patient.token}` } : {}))
        }
      }
    )
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setMessages(data);
        } else {
          setMessages([]);
        }
      });
    return () => {
      socketRef.current.disconnect();
    };
    // eslint-disable-next-line
  }, [doctor._id, patient._id, appointmentId, room, patient.token]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Determine if the current user is a doctor or a patient
  const isDoctor = !!doctor.isCurrentDoctor; // doctor.isCurrentDoctor should be set true in DoctorChatPage

  const sendMessage = async () => {
    if (!input.trim()) return;
    // Dynamically set sender and receiver based on role
    const msg = isDoctor
      ? {
          senderId: doctor._id,
          receiverId: patient._id,
          senderModel: 'Doctor',
          receiverModel: 'User',
          message: input,
          room,
          appointmentId
        }
      : {
          senderId: patient._id,
          receiverId: doctor._id,
          senderModel: 'User',
          receiverModel: 'Doctor',
          message: input,
          room,
          appointmentId
        };
    // Real-time emit
    socketRef.current.emit('sendMessage', msg);
    // Save to DB
    await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...((doctor.isCurrentDoctor && doctor.token)
          ? { 'Authorization': `Bearer ${doctor.token}` }
          : (patient.token ? { 'Authorization': `Bearer ${patient.token}` } : {}))
      },
      body: JSON.stringify(msg)
    });
    setInput('');
  };

  // Clear chat handler
  const handleClearChat = async () => {
    const doctorId = doctor._id;
    const userId = patient._id;
    const token = doctor.isCurrentDoctor ? doctor.token : patient.token;
    try {
      const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/messages/clear/${doctorId}/${userId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      const data = await res.json();
      if (data.success) {
        setMessages([]);
      }
    } catch (err) {
      // Optionally show error
      setMessages([]);
    }
  };

  

  // Start WebRTC connection
// Add loadedmetadata event to local video to force play as soon as stream is ready

useEffect(() => {
  const video = localVideoRef.current;
  if (!video) return;
  const handleLoadedMetadata = () => {
    video.play().catch(() => {});
  };
  video.addEventListener('loadedmetadata', handleLoadedMetadata);
  return () => {
    video.removeEventListener('loadedmetadata', handleLoadedMetadata);
  };
}, [localStream, callActive, showCallModal]);

// ✅ FIXED startWebRTC function (no useEffect inside)
const startWebRTC = React.useCallback(async (isCaller) => {
  peerConnectionRef.current = new RTCPeerConnection({
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
  });

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    setLocalStream(stream);

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
      setTimeout(() => {
        if (localVideoRef.current) {
          localVideoRef.current.play().catch(() => {});
        }
      }, 50);
    }

    stream.getTracks().forEach(track => {
      peerConnectionRef.current.addTrack(track, stream);
    });
  } catch (err) {
    alert('Camera/Mic access denied or not available.');
    return;
  }

  peerConnectionRef.current.ontrack = (event) => {
    const [remote] = event.streams;
    setRemoteStream(remote);
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remote;
    }
    console.log('ontrack event fired, remote stream set:', remote);
  };

  peerConnectionRef.current.onicecandidate = (event) => {
    if (event.candidate) {
      socketRef.current.emit('webrtc-candidate', {
        to: peerId,
        candidate: event.candidate
      });
    }
  };

  if (isCaller) {
    const offer = await peerConnectionRef.current.createOffer();
    await peerConnectionRef.current.setLocalDescription(offer);
    socketRef.current.emit('webrtc-offer', {
      to: peerId,
      offer
    });
  }
}, [peerId, socketRef, localVideoRef, remoteVideoRef]);


  // Socket.io signaling for video call
  useEffect(() => {
    if (!socketRef.current) return;
    // Listen for incoming call request
    socketRef.current.on('videoCallRequest', (data) => {
      // Only set incomingCall if I am the receiver
      if (data.to === myId) {
        console.log('Doctor received call from user:', data.from);
        setIncomingCall({
          from: data.from,
          name: data.name,
          avatar: data.avatar,
          to: data.to // ensure 'to' is always present
        });
      }
    });
    // Listen for call accepted
    socketRef.current.on('videoCallAccepted', () => {
      setCallActive(true);
      setShowCallModal(false);
      setIncomingCall(null);
    });
    // Listen for call rejected
    socketRef.current.on('videoCallRejected', () => {
      setShowCallModal(false);
      setIncomingCall(null);
      setCallActive(false);
      alert('Call rejected');
    });
    // Listen for call ended
    socketRef.current.on('videoCallEnded', () => {
      setShowCallModal(false);
      setIncomingCall(null);
      setCallActive(false);
      alert('Call ended');
    });
    // WebRTC signaling: offer, answer, candidate
    socketRef.current.on('webrtc-offer', async ({ from, offer }) => {
      // Only start WebRTC if callActive is true (call accepted)
      if (!callActive) return;
      // Prevent duplicate peer connection
      if (!peerConnectionRef.current) {
        await startWebRTC(false); // Callee starts WebRTC
      }
      // Only set remote description if not already set
      if (peerConnectionRef.current && peerConnectionRef.current.signalingState === 'stable') {
        // Already stable, ignore duplicate offer
        return;
      }
      if (peerConnectionRef.current) {
        try {
          await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(offer));
          const answer = await peerConnectionRef.current.createAnswer();
          await peerConnectionRef.current.setLocalDescription(answer);
          socketRef.current.emit('webrtc-answer', { to: from, answer });
        } catch (err) {
          console.error('Error setting remote offer/answer:', err);
        }
      }
    });
    socketRef.current.on('webrtc-answer', async ({ answer }) => {
      if (peerConnectionRef.current) {
        // Only set remote answer if in correct state
        if (peerConnectionRef.current.signalingState === 'have-local-offer') {
          try {
            await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
          } catch (err) {
            console.error('Error setting remote answer:', err);
          }
        } else {
          console.warn('Skipping setRemoteDescription(answer) because signalingState is', peerConnectionRef.current.signalingState);
        }
        // If remote stream not set, force check tracks
        if (peerConnectionRef.current.getReceivers) {
          const remoteStreams = peerConnectionRef.current.getReceivers()
            .map(r => r.track && r.track.kind === 'video' ? r : null)
            .filter(Boolean);
          console.log('Caller: Receivers after answer:', remoteStreams);
        }
      }
    });
    socketRef.current.on('webrtc-candidate', async ({ candidate }) => {
      if (peerConnectionRef.current && candidate) {
        try {
          await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {}
      }
    });
    return () => {
      socketRef.current.off('videoCallRequest');
      socketRef.current.off('videoCallAccepted');
      socketRef.current.off('videoCallRejected');
      socketRef.current.off('videoCallEnded');
      socketRef.current.off('webrtc-offer');
      socketRef.current.off('webrtc-answer');
      socketRef.current.off('webrtc-candidate');
    };
  }, [socketRef, myId, callActive, startWebRTC]);

  // Cleanup streams and peer connection on call end
  useEffect(() => {
    if (!callActive) {
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        setLocalStream(null);
      }
      if (remoteStream) {
        remoteStream.getTracks?.().forEach(track => track.stop?.());
        setRemoteStream(null);
      }
    } else {
      // When callActive becomes true, start WebRTC for both caller and receiver
      // Caller: startWebRTC(true), Receiver: startWebRTC(false)
      if (incomingCall) {
        // Receiver just accepted
        startWebRTC(false);
      } else {
        // Caller just got accepted
        startWebRTC(true);
      }
      // Always re-attach local stream to local video element after negotiation
      setTimeout(() => {
        if (localVideoRef.current && localStream) {
          localVideoRef.current.srcObject = localStream;
        }
      }, 200);
    }
    // eslint-disable-next-line
  }, [callActive]);
  // Start video call (send request)
  const handleStartCall = async () => {
    // Show modal first so user sees camera preview instantly
    setShowCallModal(true);
    setIncomingCall(null);
    // Start camera/mic immediately
    await startWebRTC(true);
    console.log('User initiated call. Now doctor will receive call.');
    socketRef.current.emit('videoCallRequest', {
      to: peerId,
      from: myId,
      name: myName,
      avatar: myAvatar
    });
  };

  // Accept call
  const handleAcceptCall = () => {
    socketRef.current.emit('videoCallAccepted', {
      to: incomingCall?.from,
      from: myId
    });
    setCallActive(true);
    setShowCallModal(false);
    setIncomingCall(null);
    // TODO: Start WebRTC connection here
  };

  // Reject call
  const handleRejectCall = () => {
    socketRef.current.emit('videoCallRejected', {
      to: incomingCall?.from,
      from: myId
    });
    setShowCallModal(false);
    setIncomingCall(null);
    setCallActive(false);
  };

  // End call
  const handleEndCall = () => {
    socketRef.current.emit('videoCallEnded', {
      to: peerId,
      from: myId
    });
    setShowCallModal(false);
    setIncomingCall(null);
    setCallActive(false);
  };

  return (
    <div className="flex flex-col flex-1 h-full">
      {/* Video Call UI */}
      {/* Video Call Modal (handles both incoming and active call UI) */}
      {/* Show modal for caller (showCallModal) or receiver (incomingCall) or during call (callActive) */}
      {(showCallModal || incomingCall || callActive) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80">
          <div className="bg-white rounded-2xl shadow-2xl p-6 flex flex-col items-center gap-4 min-w-[340px]">
            <div className="font-bold text-lg text-teal-700 mb-2">Video Call</div>
            <div className="flex gap-4 items-center">
              <div className="relative">
                <video ref={localVideoRef} autoPlay muted playsInline className="w-40 h-32 rounded-lg border-2 border-teal-400 bg-black" />
                {/* Debug overlay for local video */}
                <div style={{position:'absolute',top:2,left:2,background:'rgba(0,0,0,0.5)',color:'#fff',fontSize:10,padding:'2px 4px',borderRadius:4,zIndex:10}}>
                  {localStream ? `stream: ok` : 'no stream'} | vid: {localVideoRef.current && localVideoRef.current.currentTime ? localVideoRef.current.currentTime.toFixed(2) : '0.00'}
                </div>
                <div className="text-xs text-center mt-1">You</div>
              </div>
              {/* Show remote video only if call is active */}
              {callActive && (
                <div>
                  <video ref={remoteVideoRef} autoPlay playsInline className="w-40 h-32 rounded-lg border-2 border-gray-400 bg-black" />
                  <div className="text-xs text-center mt-1">{peerName}</div>
                </div>
              )}
            </div>
            {/* Accept/Reject only for receiver, Waiting/Cancel only for caller, End Call for both during call */}
            {incomingCall && !callActive && incomingCall.to === myId ? (
              <>
                <div className="text-gray-600 text-sm mb-2">Incoming call from {incomingCall.name}</div>
                <div className="flex gap-4 mt-2">
                  <button className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-full font-bold shadow transition text-sm" onClick={handleAcceptCall}>
                    Accept
                  </button>
                  <button className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-full font-bold shadow transition text-sm" onClick={handleRejectCall}>
                    Reject
                  </button>
                </div>
              </>
            ) : callActive ? (
              <>
                <div className="text-gray-600 text-sm mb-2">Call in progress with {peerName}</div>
                <button className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-full font-bold shadow transition text-sm mt-4" onClick={handleEndCall}>
                  End Call
                </button>
              </>
            ) : (showCallModal && !incomingCall) ? (
              <>
                <div className="text-gray-600 text-sm mb-2">Waiting for {peerName} to accept...</div>
                <button className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-full font-bold shadow transition text-sm mt-4" onClick={handleEndCall}>
                  Cancel
                </button>
              </>
            ) : null}
          </div>
        </div>
      )}
      {/* Chat Header with Video Call Icon */}
      <div className="flex items-center justify-between px-4 pt-2 pb-1 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-2">
          {/* Doctor/Patient avatar and name */}
          <img src={doctor.isCurrentDoctor ? (doctor.avatarUrl || doctor.profilePic) : (patient.avatarUrl || patient.profilePic)} alt="avatar" className="w-8 h-8 rounded-full border-2 border-teal-400 object-cover" />
          <span className="font-bold text-teal-700 text-sm">{doctor.isCurrentDoctor ? patient.name : doctor.name}</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Video Call Icon */}
          <button
            className="bg-teal-100 hover:bg-teal-200 rounded-full p-2 shadow transition"
            title="Start Video Call"
            onClick={handleStartCall}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-teal-600">
              <rect x="3" y="7" width="13" height="10" rx="2" fill="#14b8a6" />
              <polygon points="17,9 22,12 17,15" fill="#14b8a6" />
            </svg>
          </button>
          {/* Clear Chat Button */}
          <button
            onClick={handleClearChat}
            className="bg-red-500 text-white px-4 py-1 rounded-full font-bold shadow hover:bg-red-600 transition text-xs"
          >
            Clear Chat
          </button>
        </div>
      </div>

      {/* ...existing code... */}

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-4" style={{ minHeight: 0 }}>
        {messages.length === 0 ? (
          <div className="text-center text-gray-400 mt-10">No messages yet. Start the conversation!</div>
        ) : (
          messages.map((msg, idx) => {
            let myId = null;
            if (doctor.isCurrentDoctor) {
              myId = doctor._id;
            } else if (patient.isCurrentUser) {
              myId = patient._id;
            }
            if (!myId) myId = patient._id;
            const isMine = msg.senderId === myId || (msg.senderId && msg.senderId._id === myId);
            // Bubble tail position
            const tailClass = isMine ? 'bubble-tail-right' : 'bubble-tail-left';
            // Fix image URL for /uploads/ paths
            let imageUrl = msg.imageUrl;
            if (imageUrl && imageUrl.startsWith('/uploads/')) {
              imageUrl = `${process.env.REACT_APP_API_BASE_URL}${imageUrl}`;
            }
            return (
              <div key={idx} className={`mb-2 flex ${isMine ? 'justify-end' : 'justify-start'} animate-fade-in-up`}>
                <div className="flex items-end gap-2">
                  {/* Avatar for other user */}
                  {!isMine && (
                    <img src={patient.avatarUrl || patient.profilePic || `https://i.pravatar.cc/150?u=${patient._id}`} alt="avatar" className="w-7 h-7 rounded-full border border-teal-300" />
                  )}
                  <div className={`relative max-w-xs`}>
                    {/* Audio bubble uses its own style */}
                    {msg.audioUrl ? (
                      <AudioMessageBubble
                        audioUrl={msg.audioUrl.startsWith('/uploads/') ? `${process.env.REACT_APP_API_BASE_URL}${msg.audioUrl}` : msg.audioUrl}
                        avatar={isMine ? (doctor.avatarUrl || doctor.profilePic) : (patient.avatarUrl || patient.profilePic)}
                        isMine={isMine}
                      />
                    ) : (
                      <div className={`chat-bubble ${isMine ? 'mine' : 'theirs'} ${tailClass}`}>
                        {imageUrl ? (
                          <img src={imageUrl} alt="chat-img" className="max-w-[180px] max-h-[180px] rounded-lg mb-1" />
                        ) : null}
                        <span>{msg.message}</span>
                      </div>
                    )}
                  </div>
                  {/* Avatar for my message */}
                  {isMine && (
                    <img src={doctor.avatarUrl || doctor.profilePic || `https://i.pravatar.cc/150?u=${doctor._id}`} alt="avatar" className="w-7 h-7 rounded-full border border-teal-300" />
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>
      <style>{`
        .chat-bubble {
          display: inline-block;
          padding: 0.7rem 1.1rem;
          border-radius: 1.3rem;
          box-shadow: 0 2px 8px 0 rgba(0,0,0,0.07);
          font-size: 1rem;
          position: relative;
          margin-bottom: 2px;
          word-break: break-word;
          animation: fadeInUp 0.5s;
        }
        .chat-bubble.mine {
          background: linear-gradient(90deg, #14b8a6 0%, #2563eb 100%);
          color: #fff;
          border-bottom-right-radius: 0.4rem;
        }
        .chat-bubble.theirs {
          background: #fff;
          color: #222;
          border: 1px solid #e0e7ef;
          border-bottom-left-radius: 0.4rem;
        }
        .bubble-tail-right::after {
          content: '';
          position: absolute;
          right: -10px;
          bottom: 0.3rem;
          width: 14px;
          height: 18px;
          background: transparent;
          background-image: linear-gradient(120deg, #14b8a6 0%, #2563eb 100%);
          clip-path: polygon(0 0, 100% 100%, 0 100%);
          z-index: 1;
        }
        .bubble-tail-left::after {
          content: '';
          position: absolute;
          left: -10px;
          bottom: 0.3rem;
          width: 14px;
          height: 18px;
          background: transparent;
          background-image: linear-gradient(120deg, #fff 60%, #e0e7ef 100%);
          clip-path: polygon(100% 0, 0 100%, 100% 100%);
          z-index: 1;
        }
        @keyframes fadeInUp {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Input area at bottom */}
      <div className="w-full flex items-center gap-2 px-4 pb-4">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          className="flex-1 rounded-full border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white shadow"
          placeholder="Type your message..."
          onKeyDown={e => e.key === 'Enter' && sendMessage()}
        />
        {/* Mic icon for voice message - always visible */}
        <button
          onClick={isRecording ? stopRecording : startRecording}
          className={`bg-gray-200 hover:bg-gray-300 rounded-full p-2 ${isRecording ? 'bg-red-400 animate-pulse' : ''}`}
          title={isRecording ? 'Stop Recording' : 'Record Voice'}
          style={{ marginRight: '0.5rem' }}
        >
          {isRecording ? (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-red-600">
              <circle cx="12" cy="12" r="10" fill="red" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-gray-600">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v2m0-2a6 6 0 006-6V9a6 6 0 10-12 0v3a6 6 0 006 6zm0 0v2" />
            </svg>
          )}
        </button>
        {/* Image upload icon */}
        <label className="cursor-pointer">
          <input
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={async (e) => {
              const file = e.target.files[0];
              if (!file) return;
              const formData = new FormData();
              formData.append('image', file);
              formData.append('senderId', doctor.isCurrentDoctor ? doctor._id : patient._id);
              formData.append('receiverId', doctor.isCurrentDoctor ? patient._id : doctor._id);
              formData.append('senderModel', doctor.isCurrentDoctor ? 'Doctor' : 'User');
              formData.append('receiverModel', doctor.isCurrentDoctor ? 'User' : 'Doctor');
              formData.append('appointmentId', appointmentId);
              const token = doctor.isCurrentDoctor ? doctor.token : patient.token;
              const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/messages/upload`, {
                method: 'POST',
                headers: {
                  ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
                body: formData
              });
              const data = await res.json();
              if (data && data._id) {
                setMessages((prev) => [...prev, data]);
              }
              e.target.value = '';
            }}
          />
          <span className="bg-gray-200 hover:bg-gray-300 rounded-full p-2 mr-2" title="Upload Image">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-gray-600">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5V7a2 2 0 012-2h14a2 2 0 012 2v9.5M3 16.5l4.5-4.5a2 2 0 012.8 0l2.2 2.2a2 2 0 002.8 0l4.5-4.5M3 16.5V19a2 2 0 002 2h14a2 2 0 002-2v-2.5" />
            </svg>
          </span>
        </label>
        <button onClick={sendMessage} className="bg-teal-500 text-white px-6 py-2 rounded-full font-bold shadow hover:bg-teal-600 transition">Send</button>
      </div>
    </div>
  );
};

// WhatsApp-style audio bubble component
const AudioMessageBubble = ({ audioUrl, avatar, isMine }) => {
  // Always use absolute URL for /uploads/ files, avoid double prefix
  let fixedAudioUrl = audioUrl;
  if (audioUrl && audioUrl.startsWith('/uploads/')) {
    if (!audioUrl.startsWith('http://') && !audioUrl.startsWith('https://')) {
      fixedAudioUrl = `${process.env.REACT_APP_API_BASE_URL}
${audioUrl}`;
    }
  }
  // Remove any accidental double slashes
  fixedAudioUrl = fixedAudioUrl.replace(`${process.env.REACT_APP_API_BASE_URL}
//`, `${process.env.REACT_APP_API_BASE_URL}
`);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [duration, setDuration] = React.useState(0);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [audioError, setAudioError] = React.useState(false);
  const audioRef = React.useRef(null);

  React.useEffect(() => {
    if (audioRef.current) {
      audioRef.current.onloadedmetadata = () => {
        setDuration(audioRef.current.duration);
        setAudioError(false);
      };
      audioRef.current.ontimeupdate = () => {
        setCurrentTime(audioRef.current.currentTime);
      };
      audioRef.current.onended = () => {
        setIsPlaying(false);
        setCurrentTime(0);
      };
      audioRef.current.onerror = () => {
        setAudioError(true);
        setIsPlaying(false);
      };
    }
  }, [fixedAudioUrl]);

  const handlePlayPause = () => {
    if (!audioRef.current) return;
    // Check if fixedAudioUrl is valid and supported
    if (!fixedAudioUrl || !audioRef.current.src || audioRef.current.src === window.location.href || audioError) {
      alert('Audio file not found or format not supported in this browser.');
      setIsPlaying(false);
      return;
    }
    // Try to play/pause, catch NotSupportedError
    try {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        // Only reload if not already loaded
        if (audioRef.current.readyState < 2) {
          audioRef.current.load();
        }
        audioRef.current.play();
        setIsPlaying(true);
      }
    } catch (err) {
      setAudioError(true);
      setIsPlaying(false);
      alert('Audio format not supported in this browser.');
    }
  };

  // Format time mm:ss
  const formatTime = (t) => {
    if (!t || isNaN(t)) return '0:00';
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className={`flex items-center bg-green-100 rounded-xl px-3 py-2 gap-3 ${isMine ? 'flex-row-reverse' : ''}`} style={{ minWidth: 220 }}>
      {/* Avatar */}
      <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-green-400">
        <img src={avatar || 'https://ui-avatars.com/api/?name=User'} alt="avatar" className="w-full h-full object-cover" />
      </div>
      {/* Play/Pause button */}
      <button onClick={handlePlayPause} className="bg-green-500 hover:bg-green-600 rounded-full p-2">
        {isPlaying ? (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-white">
            <rect x="6" y="5" width="4" height="14" rx="1" fill="#fff" />
            <rect x="14" y="5" width="4" height="14" rx="1" fill="#fff" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-white">
            <polygon points="6,4 20,12 6,20" fill="#fff" />
          </svg>
        )}
      </button>
      {/* Progress bar */}
      <div className="flex-1 min-w-[100px] max-w-[180px] h-8 flex items-center">
        <div className="w-full h-2 bg-green-300 rounded-full relative">
          <div className="absolute left-0 top-0 h-2 bg-green-500 rounded-full" style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }} />
        </div>
      </div>
      {/* Time */}
      <span className="text-xs text-gray-700 font-mono min-w-[40px] text-center">{formatTime(currentTime)}</span>
      {/* Audio element (hidden) */}
      <audio ref={audioRef} src={fixedAudioUrl} preload="metadata" style={{ display: 'none' }} />
    </div>
  );
};

export default ChatModal;

