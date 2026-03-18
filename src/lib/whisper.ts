// Whisper-based speech-to-text fallback for browsers without Web Speech API
// Works on Safari iOS, Firefox, and all mobile browsers

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || '';

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

      // Use webm if available, fall back to mp4
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

      this.mediaRecorder.start(250); // Collect data every 250ms
      this.onStateChange?.('recording');
      this.onInterim?.('🎙️ Recording...');

      // Auto-stop after 15 seconds
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

          // Skip if too small (likely empty recording)
          if (audioBlob.size < 1000) {
            this.cleanup();
            resolve('');
            return;
          }

          const transcript = await this.transcribeWithWhisper(audioBlob);
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

  private async transcribeWithWhisper(audioBlob: Blob): Promise<string> {
    if (!OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }

    // Determine file extension from mime type
    const ext = audioBlob.type.includes('webm') ? 'webm' 
      : audioBlob.type.includes('mp4') ? 'mp4' 
      : 'wav';

    const formData = new FormData();
    formData.append('file', audioBlob, `recording.${ext}`);
    formData.append('model', 'whisper-1');
    formData.append('language', 'hi'); // Hindi + English mixed works well with Hindi setting
    formData.append('response_format', 'text');

    const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: formData,
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('Whisper API error:', errText);
      throw new Error('Transcription failed');
    }

    const text = await res.text();
    return text.trim();
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