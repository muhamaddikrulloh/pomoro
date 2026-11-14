import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

// Menyetel volume notifikasi chime agar nyaman di telinga.
function setChimeVolume(player: ReturnType<typeof useAudioPlayer>) {
  player.volume = 0.35;
}

// Hook untuk mengelola pemutaran audio lonceng saat sesi selesai.
export function useCompletionChime() {
  const player = useAudioPlayer(require('../../assets/sounds/complete.wav'));
  const status = useAudioPlayerStatus(player);
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [foreground, setForeground] = useState(AppState.currentState === 'active');
  const lastSession = useRef<string | null>(null);
  const attempted = useRef<string | null>(null);
  const mounted = useRef(false);

  // Pantau transisi foreground/background aplikasi.
  useEffect(() => {
    mounted.current = true;
    const subscription = AppState.addEventListener('change', next => setForeground(next === 'active'));
    return () => { mounted.current = false; subscription.remove(); };
  }, []);

  // Putar chime jika audio siap dan aplikasi berada di foreground.
  useEffect(() => {
    if (!pending || !status.isLoaded || !foreground || attempted.current === pending) return;
    attempted.current = pending;
    async function play() {
      try {
        setChimeVolume(player);
        await player.seekTo(0);
        if (mounted.current) player.play();
      } catch {
        // Kegagalan audio tidak boleh menghentikan fungsionalitas utama timer.
        if (mounted.current) setError('Suara timer tidak dapat diputar. Status timer tetap tersimpan.');
      }
    }
    void play();
  }, [pending, status.isLoaded, foreground, player]);

  // Pemicu pemutaran audio dengan validasi ID sesi agar tidak berbunyi berulang.
  function playCompletion(sessionId: string | null) {
    if (!sessionId || lastSession.current === sessionId) return;
    lastSession.current = sessionId;
    setError(null);
    setPending(sessionId);
  }

  return { playCompletion, error: status.error ? 'Suara timer tidak dapat diputar. Status timer tetap tersimpan.' : error };
}

