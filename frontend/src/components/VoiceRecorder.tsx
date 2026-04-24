import { useEffect, useRef, useState } from 'react';
import { Mic, Square, Loader2, AlertCircle } from 'lucide-react';
import { interviewApi } from '../services/api';

interface VoiceRecorderProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
}

type RecorderState = 'idle' | 'recording' | 'processing';

export default function VoiceRecorder({ onTranscript, disabled }: VoiceRecorderProps) {
  const [state, setState] = useState<RecorderState>('idle');
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState('');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const elapsedTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (elapsedTimerRef.current) clearInterval(elapsedTimerRef.current);
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, []);

  const formatElapsed = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const startRecording = async () => {
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : '';
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: mimeType || 'audio/webm' });
        streamRef.current?.getTracks().forEach(t => t.stop());
        streamRef.current = null;

        if (blob.size < 1000) {
          setState('idle');
          setError('Recording too short. Try again.');
          return;
        }

        setState('processing');
        try {
          const { text } = await interviewApi.transcribe(blob, 'answer.webm');
          if (text) {
            onTranscript(text);
          } else {
            setError('No speech detected.');
          }
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : 'Transcription failed';
          setError(msg);
        } finally {
          setState('idle');
        }
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setState('recording');
      setElapsed(0);
      elapsedTimerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Microphone access denied';
      setError(msg);
    }
  };

  const stopRecording = () => {
    if (elapsedTimerRef.current) {
      clearInterval(elapsedTimerRef.current);
      elapsedTimerRef.current = null;
    }
    mediaRecorderRef.current?.stop();
  };

  return (
    <div className="flex items-center space-x-3">
      {state === 'idle' && (
        <button
          type="button"
          onClick={startRecording}
          disabled={disabled}
          className="flex items-center space-x-2 px-4 py-2 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-red-200 dark:border-red-800"
        >
          <Mic className="h-5 w-5" />
          <span className="text-sm font-medium">Record answer</span>
        </button>
      )}

      {state === 'recording' && (
        <button
          type="button"
          onClick={stopRecording}
          className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors animate-pulse"
        >
          <Square className="h-5 w-5 fill-current" />
          <span className="text-sm font-medium">Stop ({formatElapsed(elapsed)})</span>
        </button>
      )}

      {state === 'processing' && (
        <div className="flex items-center space-x-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg border border-blue-200 dark:border-blue-800">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm font-medium">Transcribing...</span>
        </div>
      )}

      {error && (
        <span className="flex items-center text-xs text-red-600 dark:text-red-400">
          <AlertCircle className="h-4 w-4 mr-1" />
          {error}
        </span>
      )}
    </div>
  );
}
