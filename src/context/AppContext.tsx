import { createContext, useContext, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import { AppState as NativeAppState, Platform } from 'react-native';
import { useCompletionChime } from '../hooks/use-completion-chime';
import { loadState, saveState } from '../storage/storage';
import { type Action, type AppState, completeDue, initialState, remaining, transition } from '../utils/model';

type AppValue = { state: AppState; ready: boolean; error: string | null; busy: boolean; remainingSeconds: number; act: (action: Action) => Promise<boolean>; retryLoad: () => Promise<void> };
const Context = createContext<AppValue | null>(null);
const subscribeToClient = () => () => {};
const clientSnapshot = () => true;
const serverSnapshot = () => false;

export function AppProvider({ children }: { children: ReactNode }) {
  const clientReady = useSyncExternalStore(subscribeToClient, clientSnapshot, serverSnapshot);
  if (Platform.OS === 'web' && !clientReady) return null;
  return <ClientAppProvider>{children}</ClientAppProvider>;
}

function ClientAppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(initialState);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now);
  const current = useRef(state);
  const locked = useRef(false);
  const hydrated = useRef(false);
  const chime = useCompletionChime();
  const audio = useRef(chime.playCompletion);
  useEffect(() => { audio.current = chime.playCompletion; }, [chime.playCompletion]);

  async function retryLoad() {
    if (locked.current) return;
    locked.current = true;
    setBusy(true);
    try {
      const loaded = (await loadState()) ?? initialState();
      const restored = completeDue(loaded, Date.now());
      if (restored !== loaded) await saveState(restored);
      current.current = restored;
      setState(restored);
      hydrated.current = true;
      setReady(true);
      setError(null);
      if (restored !== loaded) audio.current(restored.timer.sessionId);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Data gagal dimuat. Coba lagi.');
    } finally { locked.current = false; setBusy(false); }
  }

  async function update(action?: Action) {
    if (!hydrated.current || locked.current) return false;
    const timestamp = Date.now();
    locked.current = true;
    setBusy(true);
    try {
      const previous = current.current;
      const completed = completeDue(previous, timestamp);
      const next = action ? transition(completed, action, timestamp) : completed;
      if (next !== current.current) {
        await saveState(next);
        current.current = next;
        setState(next);
      }
      setError(null);
      if (completed !== previous) audio.current(completed.timer.sessionId);
      return true;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Penyimpanan gagal. Perubahan belum disimpan; coba lagi.');
      return false;
    } finally { locked.current = false; setBusy(false); setNow(Date.now()); }
  }

  useEffect(() => {
    void Promise.resolve().then(retryLoad);
    const interval = setInterval(() => {
      setNow(Date.now());
      const timer = current.current.timer;
      if (timer.status === 'running' && timer.endsAt !== null && timer.endsAt <= Date.now()) void update();
    }, 500);
    const subscription = NativeAppState.addEventListener('change', status => {
      if (status === 'active') { setNow(Date.now()); void update(); }
    });
    return () => { clearInterval(interval); subscription.remove(); };
  }, []);

  return <Context.Provider value={{ state, ready, error: error ?? chime.error, busy, remainingSeconds: remaining(state.timer, now), act: update, retryLoad }}>{children}</Context.Provider>;
}
export function useApp() {
  const value = useContext(Context);
  if (!value) throw new Error('AppProvider belum tersedia.');
  return value;
}
