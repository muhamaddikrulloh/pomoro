import { useState } from 'react';
import { Text, View } from 'react-native';
import { Button, Card, Field, Screen, ui } from '@/components/ui';
import { useFeedback } from '@/context/FeedbackContext';
import { useApp } from '@/context/AppContext';
import { defaultSettings } from '@/utils/model';

// Daftar konfigurasi pengaturan beserta batas nilai maksimal dan satuannya.
const fields = [
  { key: 'focusMinutes', label: 'Durasi fokus', max: 180, unit: 'menit' },
  { key: 'shortBreakMinutes', label: 'Istirahat singkat', max: 60, unit: 'menit' },
  { key: 'longBreakMinutes', label: 'Istirahat panjang', max: 60, unit: 'menit' },
  { key: 'dailyGoalSessions', label: 'Target harian', max: 20, unit: 'sesi' },
] as const;

// Halaman Pengaturan: mengonfigurasi durasi timer dan target harian sesi fokus.
export default function SettingsScreen() {
  const { state, busy, act } = useApp();
  const { confirm, notify } = useFeedback();
  const [values, setValues] = useState(() => Object.fromEntries(fields.map(field => [field.key, String(state.settings[field.key])])));
  const [validation, setValidation] = useState('');
  // Pengaturan dinonaktifkan ketika timer sedang berjalan atau dijeda.
  const active = state.timer.status === 'running' || state.timer.status === 'paused';

  // Validasi input angka bulat positif sebelum disimpan ke context dan storage.
  async function save() {
    const invalid = fields.find(field => !/^\d+$/.test(values[field.key]) || !Number.isInteger(Number(values[field.key])) || Number(values[field.key]) < 1 || Number(values[field.key]) > field.max);
    if (invalid) {
      setValidation(`${invalid.label} harus berupa bilangan bulat antara 1 dan ${invalid.max}.`);
      return;
    }
    setValidation('');
    const success = await act({ type: 'settings', settings: { focusMinutes: Number(values.focusMinutes), shortBreakMinutes: Number(values.shortBreakMinutes), longBreakMinutes: Number(values.longBreakMinutes), dailyGoalSessions: Number(values.dailyGoalSessions) } });
    if (success) notify('Pengaturan tersimpan.');
  }

  // Mengembalikan preferensi durasi dan target ke nilai default Pomoro.
  async function resetPreferences() {
    setValidation('');
    const success = await act({ type: 'settings', settings: { ...defaultSettings } });
    if (success === true) {
      setValues(Object.fromEntries(fields.map(field => [field.key, String(defaultSettings[field.key])])));
      notify('Pengaturan dikembalikan ke awal.');
    }
  }
  return <Screen top={false}>
    <Text style={[ui.muted, { marginTop: -10 }]}>Sesuaikan waktu dengan kebutuhanmu.</Text>
    {active ? <Text style={ui.muted}>Pengaturan terkunci selama sesi aktif. Selesaikan atau atur ulang sesi terlebih dahulu.</Text> : null}
    <Card style={{ gap: 20 }}>
      {fields.map(field => <Field key={field.key} label={field.label} hint={`1–${field.max} ${field.unit}`} inlineHint value={values[field.key]} keyboardType="number-pad" maxLength={3} editable={!busy && !active} onChangeText={value => { setValues(previous => ({ ...previous, [field.key]: value })); }} />)}
    </Card>
    <View style={ui.group}>
    {validation ? <Text accessibilityRole="alert" style={ui.error}>{validation}</Text> : null}
    <Button title="Simpan pengaturan" disabled={busy || active} onPress={() => { void save(); }} />
    <Button secondary title="Atur ulang pengaturan" disabled={busy || active} onPress={() => confirm('Atur ulang pengaturan?', 'Kembalikan durasi fokus ke 25 menit, istirahat ke 5 dan 15 menit, serta target harian ke 4 sesi. Riwayat dan aktivitas tetap tersimpan.', () => { void resetPreferences(); })} />
    </View>
  </Screen>;
}

