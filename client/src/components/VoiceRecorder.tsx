import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Loader2, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { motion } from 'framer-motion';

interface VoiceRecorderProps {
  conversationId: string;
  onRecorded: (url: string, duration: number) => void;
  onCancel: () => void;
}

export function VoiceRecorder({ conversationId, onRecorded, onCancel }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [duration, setDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    startRecording();
    return () => stopRecording(false); // Cleanup on unmount
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
        if (chunksRef.current.length === 0) return;

        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        await uploadAudio(blob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Error starting recording:', err);
      onCancel();
    }
  };

  const stopRecording = (save = true) => {
    if (timerRef.current) clearInterval(timerRef.current);
    
    if (mediaRecorderRef.current && isRecording) {
      if (!save) chunksRef.current = []; // Clear chunks if cancelling
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    } else if (!save) {
      onCancel();
    }
  };

  const uploadAudio = async (blob: Blob) => {
    setIsUploading(true);
    try {
      const filename = `voice/${conversationId}/${Date.now()}.webm`;
      const { data, error } = await supabase.storage
        .from('chat-attachments')
        .upload(filename, blob, { contentType: 'audio/webm' });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('chat-attachments')
        .getPublicUrl(data.path);

      onRecorded(publicUrl, duration);
    } catch (err) {
      console.error('Upload failed:', err);
      onCancel();
    } finally {
      setIsUploading(false);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-slate-800 rounded-lg flex-1">
      <div className="flex items-center gap-2">
        <div className={`w-3 h-3 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-slate-500'}`} />
        <span className="text-sm font-mono text-red-400">{formatTime(duration)}</span>
      </div>

      <div className="flex-1 flex justify-center items-center gap-1">
        {isRecording && [0,1,2,3,4].map(i => (
          <motion.div
            key={i}
            animate={{ height: ['10px', '24px', '10px'] }}
            transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
            className="w-1 bg-red-400 rounded-full"
          />
        ))}
      </div>

      <div className="flex items-center gap-2">
        {isUploading ? (
          <Loader2 className="w-6 h-6 text-cyan-500 animate-spin" />
        ) : (
          <>
            <button
              onClick={() => stopRecording(false)}
              className="p-2 text-slate-400 hover:text-slate-200 bg-slate-700/50 hover:bg-slate-700 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <button
              onClick={() => stopRecording(true)}
              className="p-2 text-white bg-red-500 hover:bg-red-600 rounded-full shadow-lg transition-colors"
            >
              <Square className="w-5 h-5 fill-current" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
