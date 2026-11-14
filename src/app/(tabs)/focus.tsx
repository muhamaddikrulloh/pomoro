import { useState } from 'react';
import { router } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Button, Card, Heading, Screen, ui } from '@/components/ui';
import { FeedbackModal, useFeedback } from '@/context/FeedbackContext';
import { TimerDisplay } from '@/components/focus-ui';
import { useApp } from '@/context/AppContext';
import { palette as c } from '@/constants/theme';

// Opsi mode timer Pomodoro beserta label bahasa Indonesia.
const modes = [{ mode: 'focus', label: 'Fokus' }, { mode: 'shortBreak', label: 'Istirahat singkat' }, { mode: 'longBreak', label: 'Istirahat panjang' }] as const;

// Halaman Fokus: pusat kendali timer Pomodoro, pemilihan aktivitas, dan transisi istirahat.
export default function FocusScreen() {
  const { state, remainingSeconds, busy, act } = useApp();
  const { confirm, notify } = useFeedback();
  const [selectingSubject, setSelectingSubject] = useState(false);
  const timer = state.timer;
  const active = timer.status === 'running' || timer.status === 'paused';
  const completed = timer.status === 'completed';
  // Tentukan mode berikutnya: istirahat panjang setelah 4 siklus fokus, atau istirahat singkat.
  const nextMode = timer.mode === 'focus' ? (state.cycle >= 4 ? 'longBreak' : 'shortBreak') : 'focus';
  return <Screen>
    <Heading title="Sesi fokus" subtitle={timer.mode === 'focus' ? 'Fokus pada satu hal yang berarti.' : 'Berhenti sejenak. Beri pikiranmu ruang.'} />
    <View style={ui.group}>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }} style={{ flexGrow: 0 }}>
      {modes.map(({ mode, label }) => <Pressable key={mode} accessibilityRole="button" accessibilityState={{ selected: timer.mode === mode, disabled: busy || active }} disabled={busy || active} onPress={() => { void act({ type: 'mode', mode }); }} style={({ pressed }) => ({ minHeight: 44, paddingHorizontal: 10, justifyContent: 'center', borderRadius: 22, backgroundColor: timer.mode === mode ? c.foreground : c.surfaceMuted, opacity: busy || active ? 0.4 : pressed ? 0.7 : 1 })}><Text style={{ fontSize: 12, fontWeight: '600', color: timer.mode === mode ? c.surface : c.foreground }}>{label}</Text></Pressable>)}
    </ScrollView>
    <View style={{ paddingVertical: 16 }}>
      <TimerDisplay seconds={remainingSeconds} duration={timer.durationSeconds} label={timer.status === 'paused' ? 'Dijeda' : completed ? 'Selesai' : timer.mode === 'focus' ? 'Saatnya fokus' : 'Saatnya beristirahat'} />
    </View>
    <Pressable accessibilityRole="button" accessibilityLabel={`Pilih aktivitas. ${timer.subjectName}`} accessibilityState={{ disabled: busy || active, expanded: selectingSubject }} disabled={busy || active} onPress={() => setSelectingSubject(true)} style={[ui.card, { backgroundColor: c.surface, minHeight: 64, paddingVertical: 12 }]}>
      <View style={ui.between}><View style={{ flex: 1, gap: 4 }}><Text style={ui.caption}>Aktivitas</Text><Text style={ui.label}>{timer.subjectName}</Text></View><View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: c.surfaceMuted, borderWidth: 1, borderColor: c.border, alignItems: 'center', justifyContent: 'center' }}><View style={{ width: 8, height: 8, borderRightWidth: 2, borderBottomWidth: 2, borderColor: active ? c.muted : c.foreground, transform: [{ rotate: '45deg' }], marginTop: -2 }} /></View></View>
    </Pressable>
    </View>
    {/* Modal pemilih aktivitas yang hanya dapat diubah saat timer diam */}
    <FeedbackModal visible={selectingSubject} title="Pilih aktivitas" onClose={() => setSelectingSubject(false)}>
      <View style={{ gap: 8 }}>
        {state.subjects.map(subject => {
          const selected = timer.subjectId === subject.id;
          return <Pressable key={subject.id} accessibilityRole="button" accessibilityState={{ selected }} onPress={() => { void act({ type: 'subject', id: subject.id }).then(success => { if (success) setSelectingSubject(false); }); }} style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, paddingHorizontal: 16, borderRadius: 14, backgroundColor: selected ? c.surfaceMuted : c.surface, borderWidth: 1, borderColor: selected ? c.foreground : c.border, opacity: pressed ? 0.7 : 1 })}><Text style={{ fontSize: 15, fontWeight: selected ? '600' : '400', color: c.foreground }}>{subject.name}</Text>{selected ? <View style={{ width: 6, height: 11, borderRightWidth: 2, borderBottomWidth: 2, borderColor: c.foreground, transform: [{ rotate: '45deg' }], marginRight: 4, marginTop: -2 }} /> : null}</Pressable>;
        })}
      </View>
      <View style={{ height: 1, backgroundColor: c.border, marginVertical: 4 }} />
      <Button secondary title="Kelola aktivitas" disabled={busy || active} onPress={() => { setSelectingSubject(false); router.push('/subjects'); }} />
    </FeedbackModal>
    <View style={ui.group}>
    {completed ? <Card color={c.accentYellow}><Text style={ui.section}>{timer.mode === 'focus' ? 'Fokus selesai. Kerja bagus.' : 'Istirahat selesai. Siap mulai lagi.'}</Text><Text style={ui.body}>{timer.mode === 'focus' ? 'Sesimu tersimpan. Saatnya beristirahat.' : 'Mulai saat kamu siap. Sesi fokus berikutnya tinggal satu ketukan.'}</Text><Button disabled={busy} title={nextMode === 'longBreak' ? 'Siapkan istirahat panjang' : nextMode === 'shortBreak' ? 'Siapkan istirahat singkat' : 'Siapkan fokus'} onPress={() => { void act({ type: 'mode', mode: nextMode }); }} /></Card> : <Button disabled={busy} title={timer.status === 'running' ? 'Jeda' : timer.status === 'paused' ? 'Lanjutkan' : timer.mode === 'focus' ? 'Mulai fokus' : 'Mulai istirahat'} onPress={() => { void act({ type: timer.status === 'running' ? 'pause' : 'start' }); }} />}
    {/* Tombol atur ulang memerlukan konfirmasi jika ada sesi berjalan */}
    <Button secondary disabled={busy || timer.status === 'idle'} title="Atur ulang" onPress={() => confirm('Atur ulang sesi?', 'Progres sesi ini akan dibuang. Sesi yang belum selesai tidak masuk riwayat.', () => { void act({ type: 'reset' }).then(success => { if (success) notify('Sesi diatur ulang.'); }); })} />
    </View>
  </Screen>;
}
