import { ui } from "@/components/ui";
import { palette as c } from "@/constants/theme";
import { StyleSheet, Text, View, useWindowDimensions } from "react-native";

// Tampilan visual hitung mundur dengan dial radial dan persentase sesi.
export function TimerDisplay({
  seconds,
  duration,
  label,
}: {
  seconds: number;
  duration: number;
  label: string;
}) {
  const { width, fontScale } = useWindowDimensions();
  const size = Math.min(width - 80, 240);
  const expanded = fontScale > 1.3;
  const progress = Math.max(
    0,
    Math.min(1, 1 - seconds / Math.max(1, duration)),
  );
  const minutes = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const remainder = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return (
    <View
      accessibilityLabel={`${label}, tersisa ${minutes} menit ${remainder} detik`}
      style={{
        width: expanded ? "100%" : size,
        minHeight: size,
        paddingVertical: expanded ? 24 : 0,
        alignSelf: "center",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {/* Tampilkan 60 indikator detik melingkar bila skala font normal */}
      {!expanded ? (
        <View
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={StyleSheet.absoluteFill}
        >
          {Array.from({ length: 60 }, (_, index) => (
            <View
              key={index}
              style={{
                position: "absolute",
                width: 2,
                height: size,
                left: size / 2 - 1,
                top: 0,
                transform: [{ rotate: `${index * 6}deg` }],
              }}
            >
              <View
                style={{
                  width: 2,
                  height: index % 5 === 0 ? 20 : 12,
                  backgroundColor: index / 60 < progress ? "#B69730" : c.border,
                  borderRadius: 1,
                }}
              />
            </View>
          ))}
        </View>
      ) : null}
      <Text style={[ui.caption, { marginBottom: 8 }]}>{label}</Text>
      <Text
        style={{
          color: c.foreground,
          fontSize: size < 280 ? 44 : 52,
          fontWeight: "500",
          letterSpacing: -2,
          fontVariant: ["tabular-nums"],
        }}
      >
        {minutes}:{remainder}
      </Text>
      <Text style={[ui.muted, { marginTop: 8 }]}>
        {Math.round(progress * 100)}% selesai
      </Text>
    </View>
  );
}

// Diagram batang horizontal sederhana untuk melihat riwayat fokus 7 hari terakhir.
export function WeeklyChart({
  week,
}: {
  week: { key: string; label: string; seconds: number }[];
}) {
  const highest = Math.max(60, ...week.map((day) => day.seconds));
  return (
    <View style={{ gap: 16 }}>
      <View style={ui.wrap}>
        <Text style={ui.section}>Waktu fokus</Text>
        <Text
          style={[ui.caption, { alignSelf: "center", color: c.foreground }]}
        >
          7 hari · menit
        </Text>
      </View>
      <View style={{ flexDirection: "row", gap: 8, alignItems: "flex-end" }}>
        {week.map((day, index) => (
          <View
            key={day.key}
            accessibilityLabel={`${day.label}: ${Math.round(day.seconds / 60)} menit`}
            style={{ flex: 1, alignItems: "center", gap: 8 }}
          >
            <Text
              style={[
                ui.caption,
                { color: c.foreground, fontVariant: ["tabular-nums"] },
              ]}
            >
              {Math.round(day.seconds / 60)}
            </Text>
            <View
              style={{ height: 112, width: "100%", justifyContent: "flex-end" }}
            >
              <View
                style={{
                  height: Math.max(2, (day.seconds / highest) * 112),
                  backgroundColor:
                    index === week.length - 1 ? c.foreground : c.surface,
                  borderTopLeftRadius: 7,
                  borderTopRightRadius: 7,
                }}
              />
            </View>
            <Text style={[ui.caption, { color: c.foreground }]}>
              {day.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// Baris daftar sesi riwayat yang memuat nama aktivitas, durasi fokus, dan waktu selesai.
export function SessionRow({
  name,
  seconds,
  completedAt,
}: {
  name: string;
  seconds: number;
  completedAt: number;
}) {
  const date = new Date(completedAt);
  return (
    <View
      style={{
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: c.border,
        gap: 4,
      }}
    >
      <View style={ui.between}>
        <Text style={[ui.section, { flex: 1, fontSize: 16 }]}>{name}</Text>
        <Text style={ui.label}>{Math.round(seconds / 60)} menit</Text>
      </View>
      <View style={ui.between}>
        <Text style={ui.caption}>
          {date.toLocaleDateString("id-ID", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}{" "}
          ·{" "}
          {date.toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>
        <Text style={[ui.caption, { color: "#276347" }]}>Selesai</Text>
      </View>
    </View>
  );
}
