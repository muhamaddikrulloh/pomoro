import { PropsWithChildren } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, TextInputProps, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { palette as c, spacing } from '@/constants/theme';

// Komponen pembungkus halaman dengan penanganan area aman (safe area) dan keyboard.
export function Screen({ children, scroll = true, top = true }: PropsWithChildren<{ scroll?: boolean; top?: boolean }>) {
  return <SafeAreaView edges={top ? ['top', 'left', 'right'] : ['left', 'right', 'bottom']} style={ui.screen}>
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={ui.screen}>
      {scroll ? <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={ui.content}>{children}</ScrollView> : <View style={[ui.content, { flex: 1 }]}>{children}</View>}
    </KeyboardAvoidingView>
  </SafeAreaView>;
}

// Tombol standar aplikasi dengan dukungan varian primer, sekunder, dan status nonaktif.
export function Button({ title, onPress, disabled = false, secondary = false, compact = false }: { title: string; onPress: () => void; disabled?: boolean; secondary?: boolean; compact?: boolean }) {
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={onPress}
    style={({ pressed }) => [ui.button, secondary && ui.secondary, compact && { paddingHorizontal: 16 }, (pressed || disabled) && { opacity: disabled ? 0.4 : 0.7 }]}>
    <Text style={[ui.buttonText, secondary && { color: c.foreground }]}>{title}</Text>
  </Pressable>;
}

// Kontainer kartu dengan sudut melengkung untuk mengelompokkan informasi.
export function Card({ children, color = c.surface, style }: PropsWithChildren<{ color?: string; style?: ViewStyle }>) {
  return <View style={[ui.card, { backgroundColor: color }, style]}>{children}</View>;
}

// Komponen judul header halaman beserta subjudul dan aksi opsional.
export function Heading({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return <View style={ui.heading}><View style={{ flex: 1, gap: spacing.xs }}><Text accessibilityRole="header" style={ui.title}>{title}</Text>{subtitle ? <Text style={ui.muted}>{subtitle}</Text> : null}</View>{action}</View>;
}

// Tampilan informatif ketika daftar data masih kosong.
export function EmptyState({ title, description }: { title: string; description: string }) {
  return <View style={ui.empty}><Text style={ui.section}>{title}</Text><Text style={[ui.muted, { textAlign: 'center' }]}>{description}</Text></View>;
}

// Kartu metrik ringkas untuk menampilkan angka statistik dan label penjelas.
export function StatCard({ value, label, color }: { value: string; label: string; color?: string }) {
  return <Card color={color} style={{ flexGrow: 1, flexBasis: 120, gap: spacing.sm, justifyContent: 'space-between' }}><Text style={ui.muted}>{label}</Text><Text style={ui.stat}>{value}</Text></Card>;
}

// Input teks dengan label dan petunjuk batas karakter.
export function Field({ label, hint, inlineHint = false, ...props }: TextInputProps & { label: string; hint?: string; inlineHint?: boolean }) {
  return <View style={{ gap: 8 }}><Text style={ui.label}>{label}{inlineHint && hint ? <Text style={ui.caption}> ({hint})</Text> : null}</Text><TextInput accessibilityLabel={inlineHint && hint ? `${label} (${hint})` : label} placeholderTextColor={c.muted} {...props} style={[ui.input, props.editable === false && { opacity: 0.5 }, props.style]} />{hint && !inlineHint ? <Text style={ui.caption}>{hint}</Text> : null}</View>;
}


export const ui = StyleSheet.create({
  screen: { flex: 1, backgroundColor: c.background },
  content: { padding: 20, gap: spacing.xl, width: '100%', maxWidth: 600, alignSelf: 'center', paddingBottom: spacing.xxl },
  heading: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: 60 },
  group: { gap: spacing.md },
  title: { color: c.foreground, fontSize: 26, lineHeight: 32, fontWeight: '600', letterSpacing: -0.8 },
  section: { color: c.foreground, fontSize: 18, lineHeight: 25, fontWeight: '600' },
  body: { color: c.foreground, fontSize: 15, lineHeight: 23 },
  muted: { color: c.muted, fontSize: 14, lineHeight: 21 },
  caption: { color: c.muted, fontSize: 12, lineHeight: 18 },
  label: { color: c.foreground, fontSize: 14, fontWeight: '500' },
  card: { borderRadius: 22, padding: 16, gap: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  button: { backgroundColor: c.foreground, borderRadius: 30, maxWidth: '100%', minHeight: 48, paddingVertical: 14, paddingHorizontal: 24, alignItems: 'center', justifyContent: 'center' },
  secondary: { backgroundColor: c.surfaceMuted, borderWidth: 1, borderColor: c.border },
  buttonText: { color: c.surface, fontSize: 14, fontWeight: '600', textAlign: 'center' },
  stat: { color: c.foreground, fontSize: 28, fontWeight: '500', fontVariant: ['tabular-nums'] },
  empty: { paddingVertical: spacing.lg, gap: spacing.sm, alignItems: 'center' },
  input: { minHeight: 52, padding: 16, borderRadius: 14, borderWidth: 1, borderColor: c.border, backgroundColor: c.surface, color: c.foreground, fontSize: 16 },
  error: { color: c.danger, fontSize: 14, lineHeight: 21 },
  divider: { height: 1, backgroundColor: c.border },
});
