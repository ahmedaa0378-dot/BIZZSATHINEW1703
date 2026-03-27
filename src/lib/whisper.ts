// Whisper-based speech-to-text fallback for browsers without Web Speech API
// Routes through Supabase Edge Function — no API key in browser

import { proxyWhisper } from './api-proxy';

export function isWebSpeechSupported(): boolean {
  return !!(
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
  );
}

export class WhisperRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;
  private timeoutId: any = null;

  onInterim?: (text: string) => void;
  onStateChange?: (state: 'idle' | 'recording' | 'processing') => void;

  async startRecording(language: string = 'hi'): Promise<void> {
    try {
      this.audioChunks = [];
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
        }
      });

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : 'audio/wav';

      this.mediaRecorder = new MediaRecorder(this.stream, { mimeType });

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.start(250);
      this.onStateChange?.('recording');
      this.onInterim?.('🎙️ Recording...');

      this.timeoutId = setTimeout(() => {
        this.stopRecording();
      }, 15000);

    } catch (err: any) {
      console.error('Microphone access error:', err);
      throw new Error(
        err.name === 'NotAllowedError'
          ? 'Microphone permission denied. Please allow mic access.'
          : 'Could not access microphone. Please try again.'
      );
    }
  }

  async stopRecording(): Promise<string> {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }

    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
        this.cleanup();
        resolve('');
        return;
      }

      this.mediaRecorder.onstop = async () => {
        this.onStateChange?.('processing');
        this.onInterim?.('Processing...');

        try {
          const audioBlob = new Blob(this.audioChunks, {
            type: this.mediaRecorder?.mimeType || 'audio/webm'
          });

          if (audioBlob.size < 1000) {
            this.cleanup();
            resolve('');
            return;
          }

          // Use proxy instead of direct API call
          const transcript = await proxyWhisper(audioBlob, language);
          this.cleanup();
          resolve(transcript);
        } catch (err) {
          this.cleanup();
          reject(err);
        }
      };

      this.mediaRecorder.stop();
    });
  }

  cancel(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      try { this.mediaRecorder.stop(); } catch {}
    }
    this.cleanup();
  }

  private cleanup(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.onStateChange?.('idle');
  }

  isRecording(): boolean {
    return this.mediaRecorder?.state === 'recording';
  }
}