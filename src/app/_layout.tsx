import { Button, Screen, ui } from "@/components/ui";
import { palette as c } from "@/constants/theme";
import { AppProvider, useApp } from "@/context/AppContext";
import { FeedbackProvider } from "@/context/FeedbackContext";
import { router, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

// Tombol kembali khusus pada header dengan dukungan aksesibilitas dan fallback rute.
function HeaderBackButton() {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Kembali"
      onPress={() => {
        if (router.canGoBack()) router.back();
        else router.replace("/");
      }}
      style={({ pressed }) => ({
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: c.surfaceMuted,
        borderWidth: 1,
        borderColor: c.border,
        alignItems: "center",
        justifyContent: "center",
        marginLeft: 20,
        marginRight: 14,
        opacity: pressed ? 0.6 : 1,
      })}
    >
      <View
        style={{
          width: 10,
          height: 10,
          borderLeftWidth: 2,
          borderBottomWidth: 2,
          borderColor: c.foreground,
          transform: [{ rotate: "45deg" }],
          marginLeft: 3,
        }}
      />
    </Pressable>
  );
}

// Navigasi utama dengan proteksi status pemuatan (hydration) data lokal.
function AppNavigation() {
  const { ready, error, retryLoad, busy } = useApp();
  // Tampilkan layar persiapan data sebelum merender navigasi aplikasi.
  if (!ready)
    return (
      <Screen>
        <View style={{ paddingVertical: 80, gap: 24 }}>
          <Text style={ui.title}>Pomoro</Text>
          {error ? (
            <>
              <Text accessibilityRole="alert" style={ui.error}>
                {error}
              </Text>
              <Button
                title="Coba lagi"
                disabled={busy}
                onPress={() => {
                  void retryLoad();
                }}
              />
            </>
          ) : (
            <>
              <ActivityIndicator color={c.foreground} />
              <Text style={ui.muted}>Menyiapkan ruang fokusmu…</Text>
            </>
          )}
        </View>
      </Screen>
    );
  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      {error ? (
        <View
          accessibilityRole="alert"
          style={{ backgroundColor: "#FCE8E3", padding: 16 }}
        >
          <Text style={ui.error}>{error}</Text>
        </View>
      ) : null}
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: c.background },
          headerTintColor: c.foreground,
          headerShadowVisible: false,
          headerTitleStyle: { fontSize: 26, fontWeight: "600" },
          contentStyle: { backgroundColor: c.background },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="subjects"
          options={{
            title: "Aktivitas",
            headerBackVisible: false,
            headerLeft: () => <HeaderBackButton />,
          }}
        />
        <Stack.Screen
          name="settings"
          options={{
            title: "Pengaturan",
            headerBackVisible: false,
            headerLeft: () => <HeaderBackButton />,
          }}
        />
      </Stack>
    </View>
  );
}

// Layout akar aplikasi yang menyediakan context global dan status bar.
export default function RootLayout() {
  return (
    <AppProvider>
      <FeedbackProvider>
        <StatusBar style="dark" />
        <AppNavigation />
      </FeedbackProvider>
    </AppProvider>
  );
}
