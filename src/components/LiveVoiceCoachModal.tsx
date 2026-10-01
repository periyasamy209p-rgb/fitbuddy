import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, X, Activity, Send, VolumeX, ExternalLink, ShieldCheck, Sparkles } from 'lucide-react';

interface LiveVoiceCoachModalProps {
  isOpen: boolean;
  onClose: () => void;
  userGoal?: string;
}

export const LiveVoiceCoachModal: React.FC<LiveVoiceCoachModalProps> = ({
  isOpen,
  onClose,
  userGoal,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
  const [statusText, setStatusText] = useState('Tap "Allow Microphone" to trigger device access notification');
  const [coachSpeechActive, setCoachSpeechActive] = useState(false);
  const [isInIframe, setIsInIframe] = useState(false);
  const [micState, setMicState] = useState<'granted' | 'needs_standalone' | 'prompt' | 'active'>('prompt');
  const [textInput, setTextInput] = useState('');

  const wsRef = useRef<WebSocket | null>(null);
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);

  // Check if running in an iframe
  useEffect(() => {
    try {
      const inFrame = window.self !== window.top;
      setIsInIframe(inFrame);
      if (inFrame) {
        setMicState('needs_standalone');
      }
    } catch {
      setIsInIframe(true);
      setMicState('needs_standalone');
    }
  }, []);

  // If opened directly top-level with ?coach=true, automatically trigger microphone permission prompt
  useEffect(() => {
    if (!isInIframe && isOpen) {
      const params = new URLSearchParams(window.location.search);
      if (params.get('coach') === 'true' || window.location.hash === '#coach') {
        // Automatically request microphone on direct tab load
        handleRequestMicrophoneAndConnect();
      }
    }
  }, [isInIframe, isOpen]);

  // Downsample input audio from any hardware sample rate to 16000 Hz
  const downsampleTo16k = (inputData: Float32Array, inputSampleRate: number): Float32Array => {
    if (inputSampleRate === 16000) return inputData;
    const ratio = inputSampleRate / 16000;
    const newLength = Math.round(inputData.length / ratio);
    const result = new Float32Array(newLength);
    for (let i = 0; i < newLength; i++) {
      const origIndex = Math.min(Math.round(i * ratio), inputData.length - 1);
      result[i] = inputData[origIndex];
    }
    return result;
  };

  // Convert Float32 [-1, 1] to 16-bit PCM Base64
  const floatTo16BitPCMBase64 = (input: Float32Array): string => {
    const buffer = new ArrayBuffer(input.length * 2);
    const view = new DataView(buffer);
    for (let i = 0; i < input.length; i++) {
      const s = Math.max(-1, Math.min(1, input[i]));
      view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    }
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  };

  // Helper to play 24kHz raw PCM chunk from Gemini Live
  const playPCMChunk = (base64Audio: string) => {
    try {
      if (!outputAudioCtxRef.current) {
        outputAudioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
          sampleRate: 24000,
        });
      }
      const ctx = outputAudioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const binaryStr = window.atob(base64Audio);
      const len = binaryStr.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }

      const int16Array = new Int16Array(bytes.buffer);
      const float32Array = new Float32Array(int16Array.length);
      for (let i = 0; i < int16Array.length; i++) {
        float32Array[i] = int16Array[i] / 32768.0;
      }

      const audioBuffer = ctx.createBuffer(1, float32Array.length, 24000);
      audioBuffer.getChannelData(0).set(float32Array);

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      source.start();

      setCoachSpeechActive(true);
      source.onended = () => {
        setCoachSpeechActive(false);
      };
    } catch (e) {
      console.error('Error playing coach audio:', e);
    }
  };

  // Connects WebSocket to the backend live API bridge
  const initWebSocket = (): Promise<WebSocket> => {
    return new Promise((resolve, reject) => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        resolve(wsRef.current);
        return;
      }

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/live-coach`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        resolve(ws);
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.audio) {
            playPCMChunk(msg.audio);
          }
          if (msg.interrupted) {
            setCoachSpeechActive(false);
          }
          if (msg.status === 'connected') {
            setStatusText(msg.message || 'FitBuddy Live Coach is ready.');
          }
          if (msg.error) {
            setConnectionStatus('error');
          }
        } catch (e) {
          console.error('Error handling WS message:', e);
        }
      };

      ws.onerror = (err) => {
        console.error('WebSocket error:', err);
        setConnectionStatus('error');
        reject(err);
      };

      ws.onclose = () => {
        setConnectionStatus('idle');
        setIsRecording(false);
        setCoachSpeechActive(false);
        setStatusText('Session disconnected.');
      };
    });
  };

  /**
   * Request device microphone and connect live coaching session
   */
  const handleRequestMicrophoneAndConnect = async () => {
    setStatusText('Requesting device microphone permission...');

    // 1. Trigger getUserMedia directly on user click
    let stream: MediaStream | null = null;
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        } catch (subErr) {
          console.warn('getUserMedia standard audio failed:', subErr);
          stream = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
            },
          });
        }
      }
    } catch (err: any) {
      console.warn('Microphone permission result:', err);
      if (isInIframe) {
        setMicState('needs_standalone');
      }
    }

    if (stream) {
      setMicState('granted');
      audioStreamRef.current = stream;
    }

    // 2. Unlock Web Audio Context
    try {
      if (!outputAudioCtxRef.current) {
        outputAudioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
          sampleRate: 24000,
        });
      }
      if (outputAudioCtxRef.current.state === 'suspended') {
        await outputAudioCtxRef.current.resume();
      }
    } catch (e) {
      console.warn('AudioContext unlock:', e);
    }

    // 3. Connect WebSocket to Gemini Live backend
    setConnectionStatus('connecting');
    setStatusText('Connecting to Gemini 3.8 Live API...');

    try {
      const ws = await initWebSocket();
      setConnectionStatus('connected');

      // 4. If microphone was granted, wire up audio processing pipeline
      if (stream) {
        const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        if (inputCtx.state === 'suspended') {
          await inputCtx.resume();
        }
        inputAudioCtxRef.current = inputCtx;

        const source = inputCtx.createMediaStreamSource(stream);
        const bufferSize = 4096;
        const processor = inputCtx.createScriptProcessor(bufferSize, 1, 1);
        scriptProcessorRef.current = processor;

        processor.onaudioprocess = (e) => {
          if (ws.readyState === WebSocket.OPEN) {
            const inputFloat32 = e.inputBuffer.getChannelData(0);
            const resampled = downsampleTo16k(inputFloat32, inputCtx.sampleRate);
            const pcmBase64 = floatTo16BitPCMBase64(resampled);
            ws.send(JSON.stringify({ audio: pcmBase64 }));
          }
        };

        source.connect(processor);
        processor.connect(inputCtx.destination);

        setIsRecording(true);
        setStatusText('Microphone active! Speak naturally with your coach.');
      } else {
        setStatusText('Live Coach connected. Voice audio responses are active!');
      }
    } catch (wsErr: any) {
      setConnectionStatus('error');
      setStatusText('Session disconnected.');
    }
  };

  const stopVoiceSession = () => {
    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.disconnect();
      scriptProcessorRef.current = null;
    }
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((t) => t.stop());
      audioStreamRef.current = null;
    }
    if (inputAudioCtxRef.current) {
      inputAudioCtxRef.current.close().catch(() => {});
      inputAudioCtxRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsRecording(false);
    setCoachSpeechActive(false);
    setConnectionStatus('idle');
    setStatusText('Session disconnected.');
  };

  // Text message sender to Gemini Live
  const handleSendTextPrompt = async (promptToSend?: string) => {
    const text = promptToSend || textInput;
    if (!text.trim()) return;

    let ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      setConnectionStatus('connecting');
      setStatusText('Connecting to Gemini Live API...');
      try {
        ws = await initWebSocket();
        setConnectionStatus('connected');
      } catch (e: any) {
        return;
      }
    }

    if (outputAudioCtxRef.current && outputAudioCtxRef.current.state === 'suspended') {
      outputAudioCtxRef.current.resume();
    }

    ws.send(JSON.stringify({ text: text.trim() }));
    setTextInput('');
    setStatusText('Coach is analyzing and speaking back live...');
  };

  useEffect(() => {
    return () => {
      stopVoiceSession();
    };
  }, []);

  if (!isOpen) return null;

  const standaloneUrl = `${window.location.origin}/?coach=true`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[#0f141f] border border-slate-700/80 rounded-2xl w-full max-w-xl shadow-2xl p-4 sm:p-6 space-y-4 sm:space-y-5 relative overflow-hidden my-4 max-h-[94vh] flex flex-col">
        {/* Glow ambient background effect */}
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 relative z-10 shrink-0">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-amber-400">
              <Activity className="h-4 w-4" />
              <span>LIVE API · GEMINI-3.8-LIVE</span>
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold text-white mt-0.5">
              FitBuddy AI Live Voice Coach
            </h2>
          </div>
          <button
            onClick={() => {
              stopVoiceSession();
              onClose();
            }}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Device Microphone Access Banner for Preview Iframe */}
        {isInIframe && micState !== 'granted' && (
          <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-blue-500/10 border border-amber-500/40 shadow-lg space-y-2 shrink-0">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                  <Sparkles className="h-4 w-4 text-amber-400 shrink-0" />
                  <span>Enable Device Microphone Notification</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Web browsers require a standalone tab for your device to display the native <strong>&ldquo;FitBuddy wants to use your microphone: [Allow]&rdquo;</strong> prompt.
                </p>
              </div>
            </div>

            <div className="pt-1 flex items-center gap-2">
              <a
                href={standaloneUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs tracking-wide shadow-md transition-all cursor-pointer whitespace-nowrap"
              >
                <Mic className="h-4 w-4 text-slate-950" />
                <span>Launch in Full Tab (Shows Device Prompt)</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
              <button
                onClick={handleRequestMicrophoneAndConnect}
                className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
              >
                Try Here
              </button>
            </div>
          </div>
        )}

        {/* Visualizer & Audio Indicator */}
        <div className="flex flex-col items-center justify-center py-5 px-4 bg-[#080b11] border border-slate-800/80 rounded-2xl space-y-3 relative shrink-0">
          <div className="relative">
            {/* Animated Pulses */}
            {(isRecording || coachSpeechActive) && (
              <div
                className={`absolute inset-0 rounded-full animate-ping opacity-25 ${
                  coachSpeechActive ? 'bg-emerald-400' : 'bg-amber-400'
                }`}
              />
            )}
            <div
              className={`flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-full transition-all duration-300 shadow-xl ${
                coachSpeechActive
                  ? 'bg-emerald-500 text-slate-950 ring-8 ring-emerald-500/20 shadow-emerald-500/30'
                  : isRecording
                  ? 'bg-amber-400 text-slate-950 ring-8 ring-amber-400/20 shadow-amber-500/30'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {coachSpeechActive ? (
                <Volume2 className="h-9 w-9 sm:h-10 sm:w-10 animate-bounce" />
              ) : isRecording ? (
                <Mic className="h-9 w-9 sm:h-10 sm:w-10" />
              ) : (
                <VolumeX className="h-9 w-9 sm:h-10 sm:w-10" />
              )}
            </div>
          </div>

          {/* Animated audio bar waves */}
          <div className="flex items-center gap-1.5 h-6">
            {[40, 75, 55, 90, 60, 80, 45, 70, 50].map((h, i) => (
              <span
                key={i}
                style={{
                  height: isRecording || coachSpeechActive ? `${h}%` : '20%',
                  transition: 'height 0.2s ease',
                }}
                className={`w-1 rounded-full ${
                  coachSpeechActive
                    ? 'bg-emerald-400 animate-pulse'
                    : isRecording
                    ? 'bg-amber-400'
                    : 'bg-slate-700'
                }`}
              />
            ))}
          </div>

          <p className="text-xs text-center font-medium text-slate-200">
            {statusText}
          </p>

          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            {isRecording ? (
              <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Microphone Streaming Active (16kHz PCM)</span>
              </span>
            ) : (
              <span>FitBuddy Live Audio Coach ready</span>
            )}
          </div>
        </div>

        {/* Primary Action Button */}
        <div className="shrink-0">
          {connectionStatus === 'connected' && isRecording ? (
            <button
              onClick={stopVoiceSession}
              className="w-full py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs tracking-wide transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-rose-600/20 min-h-[46px]"
            >
              <MicOff className="h-4 w-4" />
              <span>Stop Voice Conversation</span>
            </button>
          ) : (
            <button
              onClick={handleRequestMicrophoneAndConnect}
              disabled={connectionStatus === 'connecting'}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-bold text-xs tracking-wide transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-500/20 disabled:opacity-75 min-h-[46px]"
            >
              {connectionStatus === 'connecting' ? (
                <>
                  <div className="h-4 w-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Connecting to Live API...</span>
                </>
              ) : (
                <>
                  <Mic className="h-4 w-4" />
                  <span>Allow Microphone &amp; Start Live Coach</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Spoken Text & Prompt Guidance */}
        <div className="space-y-2 pt-2 border-t border-slate-800/80 shrink-0">
          <span className="text-[11px] font-semibold text-slate-400 block">
            Tap a quick question (Coach speaks back immediately):
          </span>
          <div className="flex flex-wrap gap-1.5 text-[11px]">
            <button
              onClick={() => handleSendTextPrompt('Coach, what are the top 3 form cues for Romanian Deadlifts?')}
              className="px-2.5 py-1.5 rounded-lg bg-[#141b2b] text-slate-200 hover:text-amber-300 hover:bg-slate-800 border border-slate-800 transition-colors cursor-pointer text-left"
            >
              &ldquo;Form cues for Romanian Deadlifts?&rdquo;
            </button>
            <button
              onClick={() => handleSendTextPrompt('Give me a 30-second motivation boost for my final set!')}
              className="px-2.5 py-1.5 rounded-lg bg-[#141b2b] text-slate-200 hover:text-amber-300 hover:bg-slate-800 border border-slate-800 transition-colors cursor-pointer text-left"
            >
              &ldquo;30s motivation for final set!&rdquo;
            </button>
            <button
              onClick={() => handleSendTextPrompt('My knees feel tight today. What should I swap for squats?')}
              className="px-2.5 py-1.5 rounded-lg bg-[#141b2b] text-slate-200 hover:text-amber-300 hover:bg-slate-800 border border-slate-800 transition-colors cursor-pointer text-left"
            >
              &ldquo;Swap squats due to knee tightness?&rdquo;
            </button>
          </div>

          {/* Text Input Row */}
          <div className="flex gap-2 pt-1">
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendTextPrompt()}
              placeholder="Or type a question to hear live spoken answer..."
              className="flex-1 bg-[#161d2d] border border-slate-700 rounded-xl px-3.5 py-2.5 text-base sm:text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 min-h-[44px]"
            />
            <button
              onClick={() => handleSendTextPrompt()}
              className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer min-h-[44px]"
            >
              <Send className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Ask Coach</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
