// All OpenAI calls go through Supabase Edge Function
// No API key exposed in the browser

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const PROXY_URL = `${SUPABASE_URL}/functions/v1/openai-proxy`;

// ===== CHAT COMPLETION (non-streaming) =====
export async function proxyChat(
  messages: { role: string; content: string }[],
  options?: { model?: string; temperature?: number; max_tokens?: number }
): Promise<any> {
  const res = await fetch(PROXY_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({
      messages,
      model: options?.model || 'gpt-4o',
      temperature: options?.temperature ?? 0.3,
      max_tokens: options?.max_tokens || 400,
      stream: false,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Proxy error: ${err}`);
  }

  return res.json();
}

// ===== CHAT COMPLETION (streaming) =====
export async function proxyChatStream(
  messages: { role: string; content: string }[],
  onChunk: (text: string) => void,
  options?: { model?: string; temperature?: number; max_tokens?: number }
): Promise<string> {
  const res = await fetch(PROXY_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({
      messages,
      model: options?.model || 'gpt-4o',
      temperature: options?.temperature ?? 0.3,
      max_tokens: options?.max_tokens || 400,
      stream: true,
    }),
  });

  const reader = res.body?.getReader();
  const decoder = new TextDecoder();
  let fullText = '';

  if (reader) {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter((l) => l.startsWith('data: '));
      for (const line of lines) {
        const json = line.replace('data: ', '').trim();
        if (json === '[DONE]') break;
        try {
          const parsed = JSON.parse(json);
          const delta = parsed.choices?.[0]?.delta?.content || '';
          fullText += delta;
          onChunk(fullText);
        } catch {}
      }
    }
  }

  return fullText;
}

// ===== WHISPER TRANSCRIPTION =====
export async function proxyWhisper(audioBlob: Blob, language: string = 'en'): Promise<string> {
  const ext = audioBlob.type.includes('webm') ? 'webm'
    : audioBlob.type.includes('mp4') ? 'mp4'
    : 'wav';

  const formData = new FormData();
  formData.append('file', audioBlob, `recording.${ext}`);
  formData.append('language', language);

  const res = await fetch(`${PROXY_URL}?action=whisper`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: formData,
  });

  if (!res.ok) {
    throw new Error('Transcription failed');
  }

  const data = await res.json();
  return data.text || '';
}