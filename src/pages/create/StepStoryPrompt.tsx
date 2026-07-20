import { useEffect, useRef, useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useBookDraft } from '../../context/BookDraftContext';

const MAX_LENGTH = 400;
// A young child speaking slowly and deliberately still fills 400 characters
// (roughly 65-70 words) in well under a minute at even a cautious ~100
// words/minute pace — 60s leaves comfortable headroom for pauses without
// letting a recording run needlessly long (see worker/routes/transcribe.ts,
// which also bounds the upload size defensively on the server side).
const RECORDING_MAX_MS = 60000;

type MicState = 'idle' | 'recording' | 'transcribing';
type MicError = 'permission' | 'transcribe' | null;

// A young child (or a classroom pupil using the app independently) may not
// type well yet — this lets them speak their story idea instead, using the
// browser's own mic + OpenAI's speech-to-text (worker/audio-client.ts) to
// fill the same field a typed answer would.
function MicButton({ onTranscript }: { onTranscript: (text: string) => void }) {
  const { t, lang } = useLanguage();
  const [micState, setMicState] = useState<MicState>('idle');
  const [micError, setMicError] = useState<MicError>(null);
  const [secondsLeft, setSecondsLeft] = useState(RECORDING_MAX_MS / 1000);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
  };

  const startRecording = async () => {
    setMicError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        streamRef.current?.getTracks().forEach((track) => track.stop());
        if (timerRef.current) clearInterval(timerRef.current);
        setMicState('transcribing');

        try {
          const mimeType = mediaRecorder.mimeType || 'audio/webm';
          const blob = new Blob(chunksRef.current, { type: mimeType });
          const extension = mimeType.split('/')[1]?.split(';')[0] || 'webm';
          const form = new FormData();
          form.append('audio', blob, `recording.${extension}`);
          form.append('language', lang);

          const response = await fetch('/api/transcribe', { method: 'POST', body: form });
          const body = (await response.json().catch(() => null)) as { text?: string; error?: string } | null;
          if (!response.ok || !body?.text) throw new Error(body?.error ?? 'Transcription failed.');

          onTranscript(body.text.trim().slice(0, MAX_LENGTH));
          setMicState('idle');
        } catch {
          setMicError('transcribe');
          setMicState('idle');
        }
      };

      mediaRecorder.start();
      setMicState('recording');
      setSecondsLeft(RECORDING_MAX_MS / 1000);
      timerRef.current = setInterval(() => {
        setSecondsLeft((s) => {
          if (s <= 1) {
            stopRecording();
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    } catch {
      setMicError('permission');
    }
  };

  const handleClick = () => {
    if (micState === 'recording') stopRecording();
    else if (micState === 'idle') startRecording();
  };

  return (
    <div style={{ marginBottom: 14 }}>
      <button
        type="button"
        onClick={handleClick}
        disabled={micState === 'transcribing'}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          font: '700 13px Geist',
          color: micState === 'recording' ? '#fff' : 'var(--cyan)',
          background: micState === 'recording' ? '#e0433f' : 'rgba(10,102,255,.08)',
          border: micState === 'recording' ? 'none' : '1.5px solid var(--cyan)',
          borderRadius: 999,
          padding: '10px 18px',
          cursor: micState === 'transcribing' ? 'default' : 'pointer',
          opacity: micState === 'transcribing' ? 0.7 : 1,
        }}
      >
        {micState === 'recording' ? (
          t.wizard.step4.micStop(secondsLeft)
        ) : micState === 'transcribing' ? (
          <>
            <span
              className="spinner"
              style={{ width: 12, height: 12, borderRadius: '50%', border: '2px solid rgba(10,102,255,.25)', borderTopColor: 'var(--cyan)', display: 'inline-block' }}
            />
            {t.wizard.step4.micTranscribing}
          </>
        ) : (
          t.wizard.step4.micStart
        )}
      </button>
      {micError && (
        <p style={{ font: '600 12px/1.5 Geist', color: 'var(--red, #d33)', margin: '8px 0 0' }}>
          {micError === 'permission' ? t.wizard.step4.micPermissionError : t.wizard.step4.micTranscribeError}
        </p>
      )}
    </div>
  );
}

export function StepStoryPrompt() {
  const { t } = useLanguage();
  const { draft, update } = useBookDraft();

  return (
    <div style={{ width: '100%', maxWidth: 520, margin: '0 auto' }}>
      <div style={{ fontFamily: 'Geist, sans-serif', fontWeight: 800, fontSize: 26, color: 'var(--ink)', marginBottom: 10 }}>
        {t.wizard.step4.title}
      </div>
      <p style={{ font: '600 13px/1.5 Geist', color: 'var(--ink-soft)', margin: '0 0 16px' }}>{t.wizard.step4.helper}</p>

      <MicButton onTranscript={(text) => update({ storyPrompt: text })} />

      <textarea
        value={draft.storyPrompt}
        maxLength={MAX_LENGTH}
        onChange={(e) => update({ storyPrompt: e.target.value })}
        placeholder={t.wizard.step4.placeholder}
        rows={6}
        style={{
          width: '100%',
          font: '500 15px/1.6 Geist',
          color: 'var(--ink)',
          padding: '16px 18px',
          borderRadius: 14,
          border: '1.5px solid var(--border)',
          background: '#fff',
          outline: 'none',
          resize: 'vertical',
          minHeight: 140,
        }}
      />
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          font: '600 11px Geist',
          color: 'var(--muted)',
          marginTop: 6,
        }}
      >
        {draft.storyPrompt.length} / {MAX_LENGTH} {t.wizard.step4.charHint}
      </div>
    </div>
  );
}
