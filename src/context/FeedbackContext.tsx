import { createContext, useCallback, useContext, useEffect, useRef, useState, type ComponentRef, type PropsWithChildren } from 'react';
import { AccessibilityInfo, findNodeHandle, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, ui } from '@/components/ui';
import { palette as c } from '@/constants/theme';

type Confirmation = { title: string; message: string; onConfirm: () => void };
type Feedback = { confirm: (title: string, message: string, onConfirm: () => void) => void; notify: (message: string) => void };
const Context = createContext<Feedback | null>(null);

export function FeedbackModal({ visible, title, onClose, children }: PropsWithChildren<{ visible: boolean; title: string; onClose: () => void }>) {
  const heading = useRef<ComponentRef<typeof Text>>(null);
  function focusHeading() {
    if (Platform.OS === 'web') heading.current?.focus();
    else {
      const node = findNodeHandle(heading.current);
      if (node) AccessibilityInfo.setAccessibilityFocus(node);
    }
  }
  return <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} onShow={focusHeading}>
    <SafeAreaView style={styles.backdrop}>
      <View accessibilityViewIsModal style={styles.dialog}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.dialogContent}>
          <Text ref={heading} tabIndex={-1} accessible accessibilityRole="header" style={ui.section}>{title}</Text>
          {children}
          <Button secondary title="Batal" onPress={onClose} />
        </ScrollView>
      </View>
    </SafeAreaView>
  </Modal>;
}

export function FeedbackProvider({ children }: PropsWithChildren) {
  const insets = useSafeAreaInsets();
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const pending = useRef<Confirmation | null>(null);
  const [snackbar, setSnackbar] = useState<{ message: string } | null>(null);
  const confirm = useCallback<Feedback['confirm']>((title, message, onConfirm) => {
    pending.current = { title, message, onConfirm };
    setConfirmation(pending.current);
  }, []);
  const notify = useCallback((message: string) => {
    setSnackbar({ message });
    if (Platform.OS !== 'web') AccessibilityInfo.announceForAccessibility(message);
  }, []);
  const cancel = useCallback(() => { pending.current = null; setConfirmation(null); }, []);
  useEffect(() => {
    if (!snackbar) return;
    const timeout = setTimeout(() => setSnackbar(null), 4000);
    return () => clearTimeout(timeout);
  }, [snackbar]);
  return <Context.Provider value={{ confirm, notify }}>
    {children}
    {snackbar ? <View pointerEvents="box-none" style={[styles.snackbarPosition, { top: insets.top + 16, left: insets.left + 16, right: insets.right + 16 }]}>
      <View style={styles.snackbar}>
        <Text accessibilityLiveRegion="polite" role="status" style={styles.snackbarText}>{snackbar.message}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Tutup notifikasi" onPress={() => setSnackbar(null)} style={styles.dismiss}><View style={{ width: 14, height: 14, alignItems: 'center', justifyContent: 'center' }}><View style={{ position: 'absolute', width: 14, height: 1.5, backgroundColor: c.surface, borderRadius: 1, transform: [{ rotate: '45deg' }] }} /><View style={{ position: 'absolute', width: 14, height: 1.5, backgroundColor: c.surface, borderRadius: 1, transform: [{ rotate: '-45deg' }] }} /></View></Pressable>
      </View>
    </View> : null}
    <FeedbackModal visible={confirmation !== null} title={confirmation?.title ?? ''} onClose={cancel}>
      <Text style={ui.body}>{confirmation?.message}</Text>
      <Button title="Konfirmasi" onPress={() => { const request = pending.current; cancel(); request?.onConfirm(); }} />
    </FeedbackModal>
  </Context.Provider>;
}

export function useFeedback() {
  const value = useContext(Context);
  if (!value) throw new Error('FeedbackProvider belum tersedia.');
  return value;
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.35)', justifyContent: 'center', padding: 20 },
  dialog: { backgroundColor: c.surface, borderRadius: 22, width: '100%', maxWidth: 420, maxHeight: '90%', alignSelf: 'center', overflow: 'hidden' },
  dialogContent: { padding: 20, gap: 16 },
  snackbarPosition: { position: 'absolute', zIndex: 10, alignItems: 'center' },
  snackbar: { width: '100%', maxWidth: 560, backgroundColor: c.foreground, borderRadius: 16, paddingLeft: 16, paddingRight: 8, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 12 },
  snackbarText: { color: c.surface, fontSize: 14, lineHeight: 21, flexShrink: 1 },
  dismiss: { minWidth: 44, minHeight: 44, padding: 8, alignItems: 'center', justifyContent: 'center', marginLeft: 'auto' },
});
