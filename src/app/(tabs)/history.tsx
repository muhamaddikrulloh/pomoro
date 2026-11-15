import { SessionRow } from "@/components/focus-ui";
import { EmptyState, Heading, Screen } from "@/components/ui";
import { useApp } from "@/context/AppContext";
import { FlatList, View } from "react-native";

// Halaman Riwayat: menampilkan daftar kronologis sesi fokus yang telah diselesaikan.
export default function HistoryScreen() {
  const { state } = useApp();
  // Urutkan sesi dari yang paling baru diselesaikan.
  const sessions = [...state.sessions].sort(
    (a, b) => b.completedAt - a.completedAt,
  );
  return (
    <Screen scroll={false}>
      <Heading title="Riwayat sesi" subtitle="Catatan waktu yang bermanfaat." />
      <FlatList
        data={sessions}
        keyExtractor={(session) => session.id}
        contentContainerStyle={{ paddingBottom: 24 }}
        renderItem={({ item }) => (
          <SessionRow
            name={item.subjectName}
            seconds={item.actualFocusSeconds}
            completedAt={item.completedAt}
          />
        )}
        ListEmptyComponent={
          <View style={{ marginTop: 24 }}>
            <EmptyState
              title="Belum ada riwayat"
              description="Sesi fokus yang selesai otomatis muncul di sini. Mulai sesi pertamamu di halaman Fokus."
            />
          </View>
        }
      />
    </Screen>
  );
}
