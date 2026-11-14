import { Text, View } from 'react-native';
import { Card, EmptyState, Heading, Screen, StatCard, ui } from '@/components/ui';
import { WeeklyChart } from '@/components/focus-ui';
import { useApp } from '@/context/AppContext';
import { formatDuration, getStats } from '@/utils/model';
import { palette as c } from '@/constants/theme';

// Halaman Progres: menampilkan total akumulasi fokus, streak hari, dan grafik mingguan.
export default function ProgressScreen() {
  const { state } = useApp();
  // Agregasi metrik berdasarkan seluruh sesi yang tersimpan.
  const stats = getStats(state.sessions);
  return <Screen>
    <Heading title="Progresmu" subtitle="Sesi singkat. Kemajuan berarti." />
    <View style={ui.group}>
      <Card><Text style={ui.muted}>Total fokus</Text><Text style={ui.stat}>{formatDuration(stats.totalSeconds)}</Text></Card>
      <View style={ui.wrap}><StatCard value={String(state.sessions.length)} label="Sesi selesai" /><StatCard value={`${stats.streak} hari`} label="Hari berturut-turut" /></View>
    </View>
    <View style={ui.group}>
      {/* Visualisasi riwayat fokus 7 hari dalam kartu beraksen kuning lembut */}
      <Card color={c.accentYellow}><WeeklyChart week={stats.week} /></Card>
    </View>
    {state.sessions.length === 0 ? <EmptyState title="Setiap menit punya awal" description="Selesaikan sesi fokus pertamamu untuk melihat progres mingguan." /> : <Card><Text style={ui.section}>Terus jaga kebiasaanmu</Text><Text style={ui.body}>Kamu telah menyelesaikan {state.sessions.length} sesi fokus. Fokus pada sesi berikutnya, bukan angkanya.</Text></Card>}
  </Screen>;
}

