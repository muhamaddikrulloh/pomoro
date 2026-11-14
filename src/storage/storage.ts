import AsyncStorage from '@react-native-async-storage/async-storage';
import { type AppState, validSettings } from '../utils/model';

const key = '@pomoro/state/v1';
const finite = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value) && value >= 0;
const text = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;
export function validateState(value: unknown): value is AppState {
  if (!value || typeof value !== 'object') return false;
  const state = value as AppState;
  if (!validSettings(state.settings) || !Number.isInteger(state.cycle) || state.cycle < 0) return false;
  if (!Array.isArray(state.subjects) || !state.subjects.length || !state.subjects.every(s => s && text(s.id) && text(s.name) && s.name.length <= 40 && finite(s.createdAt))) return false;
  if (new Set(state.subjects.map(s => s.id)).size !== state.subjects.length) return false;
  if (!Array.isArray(state.sessions) || !state.sessions.every(s => s && text(s.id) && text(s.subjectId) && text(s.subjectName) && s.type === 'focus' && finite(s.startedAt) && finite(s.completedAt) && s.completedAt >= s.startedAt && finite(s.plannedDurationSeconds) && s.plannedDurationSeconds > 0 && s.actualFocusSeconds === s.plannedDurationSeconds)) return false;
  if (new Set(state.sessions.map(s => s.id)).size !== state.sessions.length) return false;
  const t = state.timer;
  if (!t || !['focus', 'shortBreak', 'longBreak'].includes(t.mode) || !['idle', 'running', 'paused', 'completed'].includes(t.status) || !text(t.subjectName) || !state.subjects.some(s => s.id === t.subjectId)) return false;
  if (!finite(t.remainingSeconds) || !finite(t.durationSeconds) || t.durationSeconds <= 0 || t.remainingSeconds > t.durationSeconds) return false;
  if (t.status === 'running' && (!finite(t.endsAt) || !finite(t.startedAt) || !text(t.sessionId))) return false;
  if (t.status === 'paused' && (!finite(t.startedAt) || !text(t.sessionId) || t.endsAt !== null)) return false;
  return true;
}
export async function loadState(): Promise<AppState | null> {
  const raw = await AsyncStorage.getItem(key);
  if (raw === null) return null;
  const parsed: unknown = JSON.parse(raw);
  if (!validateState(parsed)) throw new Error('Data lokal tidak valid. Data tidak ditimpa; coba muat ulang.');
  return parsed;
}
export async function saveState(state: AppState) {
  await AsyncStorage.setItem(key, JSON.stringify(state));
}
