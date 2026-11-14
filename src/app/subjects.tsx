import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Button, Card, Field, Screen, ui } from '@/components/ui';
import { useFeedback } from '@/context/FeedbackContext';
import { useApp } from '@/context/AppContext';
import { palette as c } from '@/constants/theme';

function PencilIcon({ color }: { color: string }) {
  return <View style={{ width: 14, height: 14, alignItems: 'center', justifyContent: 'center' }}><View style={{ width: 10, height: 4, borderWidth: 1.5, borderColor: color, borderRadius: 1, transform: [{ rotate: '-45deg' }] }} /><View style={{ position: 'absolute', bottom: 1, left: 1, width: 3, height: 3, borderLeftWidth: 1.5, borderBottomWidth: 1.5, borderColor: color }} /></View>;
}

function TrashIcon({ color }: { color: string }) {
  return <View style={{ width: 14, height: 14, alignItems: 'center', justifyContent: 'center' }}><View style={{ width: 5, height: 1.5, borderTopWidth: 1.5, borderLeftWidth: 1.5, borderRightWidth: 1.5, borderColor: color, borderTopLeftRadius: 1, borderTopRightRadius: 1 }} /><View style={{ width: 12, height: 1.5, backgroundColor: color }} /><View style={{ width: 9, height: 8, borderLeftWidth: 1.5, borderRightWidth: 1.5, borderBottomWidth: 1.5, borderColor: color, borderBottomLeftRadius: 2, borderBottomRightRadius: 2, marginTop: 1 }} /></View>;
}

export default function SubjectsScreen() {
  const { state, busy, act } = useApp();
  const { confirm, notify } = useFeedback();
  const [editingId, setEditingId] = useState<string | undefined>();
  const [name, setName] = useState('');
  const [validation, setValidation] = useState('');
  const active = state.timer.status === 'running' || state.timer.status === 'paused';
  const trimmedName = name.trim();
  async function save() {
    if (!trimmedName || trimmedName.length > 40) {
      setValidation('Masukkan nama aktivitas sepanjang 1–40 karakter.');
      return;
    }
    setValidation('');
    if (await act({ type: 'saveSubject', id: editingId, name: trimmedName })) {
      notify(editingId ? 'Aktivitas diperbarui.' : 'Aktivitas ditambahkan.');
      setName('');
      setEditingId(undefined);
    }
  }
  return <Screen top={false}>
    <Text style={[ui.muted, { marginTop: -10 }]}>Beri nama aktivitasmu. Buat daftar sederhana.</Text>
    {active ? <Text style={ui.muted}>Selesaikan atau atur ulang sesi aktif sebelum mengubah aktivitas.</Text> : null}
    <Card>
      <Field label={editingId ? 'Ubah aktivitas' : 'Aktivitas baru'} value={name} onChangeText={setName} maxLength={40} placeholder="Contoh: Baca satu bab" editable={!busy && !active} returnKeyType="done" onSubmitEditing={() => { if (!busy && !active) void save(); }} hint={`${name.length}/40 karakter`} />
      {validation ? <Text accessibilityRole="alert" style={ui.error}>{validation}</Text> : null}
      <Button title={editingId ? 'Simpan perubahan' : 'Tambah aktivitas'} disabled={busy || active} onPress={() => { void save(); }} />
      {editingId ? <Button secondary title="Batal mengubah" disabled={busy} onPress={() => { setEditingId(undefined); setName(''); setValidation(''); }} /> : null}
    </Card>
    <View style={ui.group}>
    <Text style={ui.section}>Aktivitasmu</Text>
    {state.subjects.map(subject => <View key={subject.id} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: c.border }}>
      <View style={{ flex: 1, gap: 4, marginRight: 12 }}>
        <Text style={[ui.section, { fontSize: 16 }]}>{subject.name}</Text>
        {subject.id === state.timer.subjectId ? <Text style={ui.caption}>Dipilih untuk sesi berikutnya</Text> : null}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Pressable accessibilityRole="button" accessibilityLabel={`Ubah ${subject.name}`} disabled={busy || active} onPress={() => { setEditingId(subject.id); setName(subject.name); setValidation(''); }} style={({ pressed }) => ({ width: 38, height: 38, borderRadius: 19, backgroundColor: c.surfaceMuted, borderWidth: 1, borderColor: c.border, alignItems: 'center', justifyContent: 'center', opacity: busy || active ? 0.3 : pressed ? 0.5 : 1 })}>
          <PencilIcon color={c.foreground} />
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel={`Hapus ${subject.name}`} disabled={busy || active || state.subjects.length <= 1} onPress={() => confirm('Hapus aktivitas?', `“${subject.name}” akan dihapus. Nama aktivitas pada sesi yang tersimpan tidak berubah.`, () => { void act({ type: 'deleteSubject', id: subject.id }).then(success => { if (success) notify('Aktivitas dihapus.'); }); })} style={({ pressed }) => ({ width: 38, height: 38, borderRadius: 19, backgroundColor: c.surfaceMuted, borderWidth: 1, borderColor: c.border, alignItems: 'center', justifyContent: 'center', opacity: busy || active || state.subjects.length <= 1 ? 0.3 : pressed ? 0.5 : 1 })}>
          <TrashIcon color={state.subjects.length <= 1 ? c.muted : c.danger} />
        </Pressable>
      </View>
    </View>)}
    </View>
  </Screen>;
}
