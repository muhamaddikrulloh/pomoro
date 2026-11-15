import { SessionRow } from "@/components/focus-ui";
import {
  Button,
  Card,
  EmptyState,
  Heading,
  Screen,
  StatCard,
  ui,
} from "@/components/ui";
import { palette as c } from "@/constants/theme";
import { useApp } from "@/context/AppContext";
import { formatDuration, getStats } from "@/utils/model";
import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";

// Halaman Beranda: menampilkan target sesi hari ini, pintasan fokus, dan aktivitas terkini.
export default function HomeScreen() {
  const { state } = useApp();
  const stats = getStats(state.sessions);
  const todaySeconds = stats.week.at(-1)?.seconds ?? 0;
  const goal = state.settings.dailyGoalSessions;
  // Hitung persentase ketercapaian target harian (maksimal 100%).
  const percent = Math.min(100, Math.round((stats.todaySessions / goal) * 100));
  const active =
    state.timer.status === "running" || state.timer.status === "paused";
  // Ambil maksimal 2 sesi terakhir untuk cuplikan aktivitas terbaru.
  const recent = [...state.sessions]
    .sort((a, b) => b.completedAt - a.completedAt)
    .slice(0, 2);
  return (
    <Screen>
      <View style={ui.between}>
        <View
          style={{
            backgroundColor: c.surfaceMuted,
            borderWidth: 1,
            borderColor: c.border,
            borderRadius: 22,
            height: 44,
            paddingHorizontal: 16,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Text
            style={{
              color: c.foreground,
              fontSize: 23,
              fontWeight: "700",
              letterSpacing: -0.6,
              includeFontPadding: false,
              textAlignVertical: "center",
              transform: [{ translateY: -3 }],
            }}
          >
            pomoro<Text style={{ color: "#A88A2F" }}>.</Text>
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Pengaturan"
          onPress={() => router.push("/settings")}
          style={({ pressed }) => ({
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: c.surfaceMuted,
            borderWidth: 1,
            borderColor: c.border,
            alignItems: "center",
            justifyContent: "center",
            opacity: pressed ? 0.5 : 1,
          })}
        >
          <View
            style={{
              width: 24,
              height: 24,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {Array.from({ length: 8 }, (_, index) => (
              <View
                key={index}
                style={{
                  position: "absolute",
                  width: 4,
                  height: 22,
                  borderRadius: 1,
                  backgroundColor: c.foreground,
                  transform: [{ rotate: `${index * 45}deg` }],
                }}
              />
            ))}
            <View
              style={{
                width: 17,
                height: 17,
                borderRadius: 9,
                borderWidth: 2,
                borderColor: c.foreground,
                backgroundColor: c.surfaceMuted,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <View
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  borderWidth: 1.5,
                  borderColor: c.foreground,
                }}
              />
            </View>
          </View>
        </Pressable>
      </View>
      <Heading
        title={"Luangkan waktu.\nTemukan fokusmu."}
        subtitle={new Date().toLocaleDateString("id-ID", {
          weekday: "long",
          month: "long",
          day: "numeric",
        })}
      />
      <View style={ui.group}>
        <Card color={c.accentYellow}>
          <View style={ui.between}>
            <Text style={ui.label}>Target hari ini</Text>
            <Text style={ui.label}>
              {stats.todaySessions} / {goal} sesi
            </Text>
          </View>
          <View style={ui.between}>
            <Text
              style={[
                ui.section,
                { flex: 1, fontWeight: "400", fontSize: 23, lineHeight: 30 },
              ]}
            >
              {percent === 100
                ? "Target tercapai.\nFokusmu hebat."
                : "Satu sesi\ndemi satu sesi."}
            </Text>
            <Text
              style={{ color: c.foreground, fontSize: 48, letterSpacing: -2 }}
            >
              {percent}%
            </Text>
          </View>
          <View
            accessibilityRole="progressbar"
            accessibilityValue={{
              min: 0,
              max: goal,
              now: Math.min(stats.todaySessions, goal),
            }}
            style={{ height: 5, backgroundColor: "#D8C57F", borderRadius: 4 }}
          >
            <View
              style={{
                height: 5,
                width: `${percent}%`,
                backgroundColor: c.foreground,
                borderRadius: 4,
              }}
            />
          </View>
        </Card>
        <Button
          title={active ? "Lanjutkan sesi" : "Mulai fokus"}
          onPress={() => router.navigate("/focus")}
        />
      </View>
      <View style={ui.wrap}>
        <StatCard value={formatDuration(todaySeconds)} label="Fokus hari ini" />
        <StatCard value={String(stats.streak)} label="Hari berturut-turut" />
      </View>
      <View style={ui.group}>
        <View style={ui.between}>
          <Text style={ui.section}>Aktivitas terbaru</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Lihat riwayat"
            onPress={() => router.navigate("/history")}
            style={({ pressed }) => ({
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: c.surfaceMuted,
              borderWidth: 1,
              borderColor: c.border,
              alignItems: "center",
              justifyContent: "center",
              opacity: pressed ? 0.5 : 1,
            })}
          >
            <View
              style={{
                width: 8,
                height: 8,
                borderTopWidth: 2,
                borderRightWidth: 2,
                borderColor: c.foreground,
                transform: [{ rotate: "45deg" }],
                marginLeft: -2,
              }}
            />
          </Pressable>
        </View>
        {recent.length ? (
          <View>
            {recent.map((session) => (
              <SessionRow
                key={session.id}
                name={session.subjectName}
                seconds={session.actualFocusSeconds}
                completedAt={session.completedAt}
              />
            ))}
          </View>
        ) : (
          <EmptyState
            title="Sesi pertamamu dimulai di sini"
            description="Pilih aktivitas, siapkan diri, lalu selesaikan sesi fokus untuk melihat progresmu."
          />
        )}
        <Button
          secondary
          title="Kelola aktivitas"
          onPress={() => router.push("/subjects")}
        />
      </View>
    </Screen>
  );
}
