import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Loader2 } from 'lucide-react';

interface RecorderButtonProps {
  onRecordingComplete: (audioBlob: Blob) => void;
  isProcessing: boolean;
}

const RecorderButton: React.FC<RecorderButtonProps> = ({ onRecordingComplete, isProcessing }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        onRecordingComplete(blob);
        stream.getTracks().forEach(track => track.stop()); // Stop microphone use
      };

      mediaRecorder.start();
      setIsRecording(true);
      setDuration(0);
      
      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);

    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Could not access microphone. Please check permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  // Cleanup
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isProcessing) {
    return (
      <div className="flex flex-col items-center justify-center animate-pulse">
        <div className="w-36 h-36 rounded-full border border-violet-500/30 flex items-center justify-center bg-black/40 backdrop-blur-md shadow-[0_0_50px_rgba(139,92,246,0.3)]">
          <Loader2 className="w-14 h-14 text-violet-200 animate-spin" />
        </div>
        <p className="mt-8 text-violet-200 font-light tracking-widest text-lg drop-shadow-md font-['Cinzel']">DIVINING...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center relative z-10">
      <div className="relative group cursor-pointer tap-highlight-transparent" onClick={isRecording ? stopRecording : startRecording}>
        {/* Glow effect */}
        <div className={`absolute inset-0 rounded-full transition-all duration-1000 blur-3xl 
          ${isRecording ? 'bg-red-900/40 scale-125' : 'bg-violet-900/30 group-hover:bg-violet-800/40 scale-100 group-hover:scale-110'}`}>
        </div>
        
        {/* The Button */}
        <button 
          className={`relative w-44 h-44 rounded-full flex items-center justify-center border transition-all duration-700 shadow-2xl
            ${isRecording 
              ? 'border-red-900/50 bg-black text-red-100 scale-95 shadow-[0_0_40px_rgba(220,38,38,0.3)]' 
              : 'border-violet-500/20 bg-black/60 text-violet-100 hover:border-violet-400/40 hover:bg-black/80 hover:scale-105'
            } backdrop-blur-lg touch-manipulation`}
        >
          {isRecording ? (
            <Square className="w-14 h-14 fill-current opacity-90" />
          ) : (
            <Mic className="w-16 h-16 opacity-80 drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]" />
          )}
        </button>
      </div>

      {/* Instructions / Timer */}
      <div className="mt-8 text-center h-16">
        {isRecording ? (
          <div className="flex flex-col items-center animate-in slide-in-from-bottom-2 fade-in">
            <span className="text-4xl font-light text-red-100 tracking-wider tabular-nums drop-shadow-md font-['Cinzel']">{formatTime(duration)}</span>
            <span className="text-xs text-red-400/80 mt-2 uppercase tracking-widest font-semibold">Recording...</span>
          </div>
        ) : (
          <span className="text-xl text-violet-200/60 font-light tracking-widest drop-shadow-sm font-['Cinzel']">Tap to Capture</span>
        )}
      </div>
    </div>
  );
};

export default RecorderButton;