import { Tabs } from 'expo-router';
import { View } from 'react-native';
import { palette as c } from '@/constants/theme';

// Ikon tab berbasis elemen grafis vektor sederhana sesuai desain token.
function TabIcon({ name, color }: { name: string; color: string }) {
  if (name === 'focus') return <View style={{ width: 20, height: 20, borderWidth: 1.7, borderColor: color, borderRadius: 10, alignItems: 'center', justifyContent: 'center' }}><View style={{ width: 2, height: 7, backgroundColor: color, marginTop: -5 }} /></View>;
  if (name === 'progress') return <View style={{ flexDirection: 'row', gap: 3, height: 20, alignItems: 'flex-end' }}>{[9, 18, 13].map((height, index) => <View key={index} style={{ width: 4, height, borderRadius: 1, backgroundColor: color }} />)}</View>;
  if (name === 'history') return <View style={{ width: 19, height: 20, borderColor: color, borderWidth: 1.7, borderRadius: 3, padding: 4, gap: 3 }}>{[0, 1, 2].map(value => <View key={value} style={{ height: 1, backgroundColor: color }} />)}</View>;
  return <View style={{ width: 20, height: 20, flexDirection: 'row', flexWrap: 'wrap', gap: 3 }}>{[0, 1, 2, 3].map(value => <View key={value} style={{ width: 8, height: 8, borderColor: color, borderWidth: 1.5, borderRadius: 2 }} />)}</View>;
}

// Layout navigasi tab bawah (bottom tabs) untuk 4 halaman utama.
export default function TabLayout() {
  return <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: c.foreground, tabBarInactiveTintColor: c.muted, tabBarStyle: { backgroundColor: c.surface, borderTopColor: c.border, minHeight: 64, paddingTop: 4, paddingBottom: 4 }, tabBarItemStyle: { minHeight: 44 }, tabBarLabelStyle: { fontSize: 11, fontWeight: '500' } }}>
    {([{ name: 'index', title: 'Beranda' }, { name: 'focus', title: 'Fokus' }, { name: 'progress', title: 'Progres' }, { name: 'history', title: 'Riwayat' }] as const).map(tab => <Tabs.Screen key={tab.name} name={tab.name} options={{ title: tab.title, tabBarIcon: ({ color }) => <TabIcon name={tab.name} color={typeof color === 'string' ? color : c.foreground} /> }} />)}
  </Tabs>;
}

