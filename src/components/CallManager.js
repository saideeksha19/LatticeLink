export class CallManager {
  constructor(socket, activeContact, initialCallType, isReceiver = false) {
    this.socket = socket;
    this.activeContact = activeContact;
    this.callType = initialCallType;
    this.isReceiver = isReceiver;
    
    this.pc = null;
    this.localStream = null;
    this.destroyed = false; // Guard against StrictMode double-cleanup
    
    this.status = 'IDLE'; // IDLE, CALLING, RINGING, CONNECTING, CONNECTED, ENDING, ENDED, FAILED
    this.onStatusChange = null;
    this.onLocalStream = null;
    this.onRemoteStream = null;
    this.onEnded = null;
    
    this.iceServers = [
      { urls: import.meta.env.VITE_TURN_URL || 'stun:stun.l.google.com:19302' }
    ];
    
    if (import.meta.env.VITE_TURN_USERNAME && import.meta.env.VITE_TURN_PASSWORD) {
      this.iceServers[0].username = import.meta.env.VITE_TURN_USERNAME;
      this.iceServers[0].credential = import.meta.env.VITE_TURN_PASSWORD;
    }

    this._bindSocketListeners();
  }

  _setStatus(newStatus) {
    if (this.destroyed) return;
    this.status = newStatus;
    if (this.onStatusChange) this.onStatusChange(newStatus);
  }

  async startCall(incomingOffer = null) {
    // Guard against calling after destroy (StrictMode re-mount race)
    if (this.destroyed) return;

    try {
      this._setStatus('CONNECTING');
      
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: this.callType === 'video',
        audio: true
      });

      // Check if we were destroyed while waiting for getUserMedia
      if (this.destroyed) {
        this.localStream.getTracks().forEach(t => t.stop());
        this.localStream = null;
        return;
      }

      if (this.onLocalStream) this.onLocalStream(this.localStream);

      this.pc = new RTCPeerConnection({ iceServers: this.iceServers });
      
      this.localStream.getTracks().forEach(track => this.pc.addTrack(track, this.localStream));

      this.pc.onicecandidate = (e) => {
        if (e.candidate && this.socket && !this.destroyed) {
          this.socket.emit('ice_candidate', { target: this.activeContact, candidate: e.candidate });
        }
      };

      this.pc.ontrack = (e) => {
        if (this.onRemoteStream && e.streams[0] && !this.destroyed) {
          this.onRemoteStream(e.streams[0]);
        }
      };

      this.pc.oniceconnectionstatechange = () => {
        if (this.destroyed || !this.pc) return;
        const state = this.pc.iceConnectionState;
        if (state === 'connected' || state === 'completed') {
          this._setStatus('CONNECTED');
        } else if (state === 'disconnected' || state === 'failed') {
          this.endCall('Connection Lost');
        }
      };

      if (this.isReceiver && incomingOffer) {
        await this.pc.setRemoteDescription(incomingOffer);
        const answer = await this.pc.createAnswer();
        await this.pc.setLocalDescription(answer);
        this.socket.emit('call_answer', { caller: this.activeContact, answer: this.pc.localDescription.toJSON() });
        this._setStatus('CONNECTED');
      } else {
        const offer = await this.pc.createOffer();
        await this.pc.setLocalDescription(offer);
        this._setStatus('CALLING');
        this.socket.emit('call_offer', { 
          callee: this.activeContact, 
          offer: this.pc.localDescription.toJSON(), 
          call_type: this.callType 
        });
      }

    } catch (err) {
      console.error("Call init failed:", err);
      if (!this.destroyed) {
        this._setStatus('FAILED');
        // Don't auto-cleanup on failure — let user see the error and press end call
      }
    }
  }

  _bindSocketListeners() {
    this._handleAnswered = async (data) => {
      if (this.destroyed) return;
      this._setStatus('CONNECTED');
      if (this.pc && !this.pc.currentRemoteDescription) {
        try {
          await this.pc.setRemoteDescription(data.answer);
        } catch (err) {
          console.error("Failed to set remote description:", err);
        }
      }
    };

    this._handleIce = (data) => {
      if (this.destroyed || !this.pc) return;
      this.pc.addIceCandidate(data.candidate).catch(err => {
        console.warn("ICE candidate error:", err);
      });
    };

    this._handleEnded = () => {
      if (this.destroyed) return;
      this._setStatus('Call Ended');
      this._doCleanup(true);
    };

    this._handleRejected = (data) => {
      if (this.destroyed) return;
      this._setStatus(`REJECTED: ${data.reason || 'User busy'}`);
      setTimeout(() => {
        if (!this.destroyed) this._doCleanup(true);
      }, 2000);
    };

    this.socket.on('call_answered', this._handleAnswered);
    this.socket.on('ice_candidate', this._handleIce);
    this.socket.on('call_ended', this._handleEnded);
    this.socket.on('call_rejected', this._handleRejected);
  }

  endCall(reason = 'Ended') {
    if (this.destroyed) return;
    this._setStatus(reason);
    if (this.socket) {
      this.socket.emit('call_end', { target: this.activeContact });
    }
    this._doCleanup(true);
  }

  // Internal cleanup that optionally fires onEnded callback
  _doCleanup(fireCallback) {
    if (this.destroyed) return;
    this.destroyed = true;

    // Stop all tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        track.stop();
      });
      this.localStream = null;
    }

    // Close PeerConnection
    if (this.pc) {
      this.pc.ontrack = null;
      this.pc.onicecandidate = null;
      this.pc.oniceconnectionstatechange = null;
      this.pc.close();
      this.pc = null;
    }

    // Remove Socket listeners
    this._removeSocketListeners();

    if (fireCallback && this.onEnded) this.onEnded();
  }

  // Called by React useEffect cleanup — does NOT fire onEnded to prevent
  // removing the overlay during StrictMode's unmount/remount cycle
  destroy() {
    this._doCleanup(false);
  }

  _removeSocketListeners() {
    if (this.socket) {
      this.socket.off('call_answered', this._handleAnswered);
      this.socket.off('ice_candidate', this._handleIce);
      this.socket.off('call_ended', this._handleEnded);
      this.socket.off('call_rejected', this._handleRejected);
    }
  }

  toggleAudio() {
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        return audioTrack.enabled;
      }
    }
    return false;
  }

  toggleVideo() {
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        return videoTrack.enabled;
      }
    }
    return false;
  }
}
