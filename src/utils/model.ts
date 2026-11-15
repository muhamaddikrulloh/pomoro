export type Mode = "focus" | "shortBreak" | "longBreak";
export type Settings = {
  focusMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  dailyGoalSessions: number;
};
export type Subject = { id: string; name: string; createdAt: number };
export type Session = {
  id: string;
  subjectId: string;
  subjectName: string;
  startedAt: number;
  completedAt: number;
  plannedDurationSeconds: number;
  actualFocusSeconds: number;
  type: "focus";
};
export type Timer = {
  mode: Mode;
  status: "idle" | "running" | "paused" | "completed";
  subjectId: string;
  subjectName: string;
  remainingSeconds: number;
  durationSeconds: number;
  endsAt: number | null;
  startedAt: number | null;
  sessionId: string | null;
};
export type AppState = {
  settings: Settings;
  subjects: Subject[];
  sessions: Session[];
  timer: Timer;
  cycle: number;
};
export type Action =
  | { type: "start" | "pause" | "reset" }
  | { type: "mode"; mode: Mode }
  | { type: "subject"; id: string }
  | { type: "saveSubject"; id?: string; name: string }
  | { type: "deleteSubject"; id: string }
  | { type: "settings"; settings: Settings };
export const defaultSettings: Settings = {
  focusMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  dailyGoalSessions: 4,
};

// Memvalidasi batas minimum dan maksimum durasi serta target harian.
export function validSettings(settings: Settings) {
  return (
    settings &&
    Object.entries(defaultSettings).every(([key]) => {
      const value = settings[key as keyof Settings];
      return (
        Number.isInteger(value) &&
        value >= 1 &&
        value <=
          (key === "focusMinutes" ? 180 : key === "dailyGoalSessions" ? 20 : 60)
      );
    })
  );
}

// Menghitung total durasi dalam detik berdasarkan mode yang dipilih.
export function duration(settings: Settings, mode: Mode) {
  return (
    settings[
      mode === "focus"
        ? "focusMinutes"
        : mode === "shortBreak"
          ? "shortBreakMinutes"
          : "longBreakMinutes"
    ] * 60
  );
}

// Menyiapkan objek timer baru dengan status diam (idle).
export function idleTimer(
  settings: Settings,
  subject: Pick<Subject, "id" | "name">,
  mode: Mode = "focus",
): Timer {
  const seconds = duration(settings, mode);
  return {
    mode,
    status: "idle",
    subjectId: subject.id,
    subjectName: subject.name,
    remainingSeconds: seconds,
    durationSeconds: seconds,
    endsAt: null,
    startedAt: null,
    sessionId: null,
  };
}

// Menghasilkan state awal aplikasi saat pertama kali dipasang atau direset.
export function initialState(): AppState {
  const subject = { id: "general", name: "Fokus umum", createdAt: Date.now() };
  return {
    settings: { ...defaultSettings },
    subjects: [subject],
    sessions: [],
    timer: idleTimer(defaultSettings, subject),
    cycle: 0,
  };
}

// Menghitung sisa detik berdasarkan target waktu akhir (endsAt) agar akurat saat aplikasi di-background.
export function remaining(timer: Timer, now: number) {
  return timer.status === "running" && timer.endsAt !== null
    ? Math.max(0, Math.ceil((timer.endsAt - now) / 1000))
    : timer.remainingSeconds;
}

// Menyelesaikan sesi yang jatuh tempo dan mencatat riwayat tanpa pencatatan ganda.
export function completeDue(state: AppState, now: number): AppState {
  const timer = state.timer;
  if (timer.status !== "running" || timer.endsAt === null || timer.endsAt > now)
    return state;
  // Sesi hanya dicatat jika bertipe fokus dan belum pernah tersimpan sebelumnya.
  const record =
    timer.mode === "focus" &&
    !state.sessions.some((session) => session.id === timer.sessionId);
  const sessions = record
    ? [
        {
          id: timer.sessionId!,
          subjectId: timer.subjectId,
          subjectName: timer.subjectName,
          startedAt: timer.startedAt!,
          completedAt: timer.endsAt,
          plannedDurationSeconds: timer.durationSeconds,
          actualFocusSeconds: timer.durationSeconds,
          type: "focus" as const,
        },
        ...state.sessions,
      ]
    : state.sessions;
  return {
    ...state,
    sessions,
    cycle: record
      ? state.cycle + 1
      : timer.mode === "longBreak"
        ? 0
        : state.cycle,
    timer: { ...timer, status: "completed", remainingSeconds: 0, endsAt: null },
  };
}

// Mengelola transisi state timer dan data berdasarkan aksi yang diberikan.
export function transition(
  current: AppState,
  action: Action,
  now = Date.now(),
  id = `${now}-${Math.random().toString(36).slice(2)}`,
): AppState {
  const state = completeDue(current, now);
  const timer = state.timer;
  const active = timer.status === "running" || timer.status === "paused";
  const selected = { id: timer.subjectId, name: timer.subjectName };
  if (action.type === "reset")
    return { ...state, timer: idleTimer(state.settings, selected, timer.mode) };
  if (action.type === "start") {
    if (timer.status !== "idle" && timer.status !== "paused") return state;
    // Hitung waktu jatuh tempo absolut dari sisa detik.
    return {
      ...state,
      timer: {
        ...timer,
        status: "running",
        endsAt: now + timer.remainingSeconds * 1000,
        startedAt: timer.startedAt ?? now,
        sessionId: timer.sessionId ?? id,
      },
    };
  }
  // Saat jeda, simpan sisa detik terkini dan kosongkan endsAt.
  if (action.type === "pause")
    return timer.status === "running"
      ? {
          ...state,
          timer: {
            ...timer,
            status: "paused",
            remainingSeconds: remaining(timer, now),
            endsAt: null,
          },
        }
      : state;
  if (action.type === "mode") {
    if (active || !["focus", "shortBreak", "longBreak"].includes(action.mode))
      throw new Error("Atur ulang timer sebelum mengganti mode.");
    return {
      ...state,
      timer: idleTimer(state.settings, selected, action.mode),
    };
  }
  if (action.type === "subject") {
    const subject = state.subjects.find((item) => item.id === action.id);
    if (active || !subject)
      throw new Error("Aktivitas tidak tersedia atau timer masih aktif.");
    return { ...state, timer: idleTimer(state.settings, subject, timer.mode) };
  }
  if (action.type === "settings") {
    if (active)
      throw new Error("Atur ulang timer sebelum mengubah pengaturan.");
    if (!validSettings(action.settings))
      throw new Error("Durasi atau target tidak valid.");
    return {
      ...state,
      settings: action.settings,
      timer: idleTimer(action.settings, selected, timer.mode),
    };
  }
  if (action.type === "saveSubject") {
    const name = action.name.trim();
    if (!name || name.length > 40)
      throw new Error("Nama aktivitas harus 1–40 karakter.");
    if (active && action.id === timer.subjectId)
      throw new Error("Aktivitas sedang digunakan timer.");
    if (
      action.id &&
      !state.subjects.some((subject) => subject.id === action.id)
    )
      throw new Error("Aktivitas tidak ditemukan.");
    const subjects = action.id
      ? state.subjects.map((subject) =>
          subject.id === action.id ? { ...subject, name } : subject,
        )
      : [...state.subjects, { id, name, createdAt: now }];
    return {
      ...state,
      subjects,
      timer:
        action.id === timer.subjectId ? { ...timer, subjectName: name } : timer,
    };
  }
  if (action.type !== "deleteSubject") return state;
  if (state.subjects.length <= 1)
    throw new Error("Sisakan minimal satu aktivitas.");
  if (active && action.id === timer.subjectId)
    throw new Error("Aktivitas sedang digunakan timer.");
  const subjects = state.subjects.filter((subject) => subject.id !== action.id);
  return {
    ...state,
    subjects,
    timer:
      timer.subjectId === action.id
        ? idleTimer(state.settings, subjects[0], timer.mode)
        : timer,
  };
}

// Menghasilkan string tanggal lokal YYYY-MM-DD sebagai kunci agregasi data.
export function localDateKey(timestamp: number) {
  const date = new Date(timestamp);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

// Mengubah detik menjadi teks format jam dan menit yang mudah dibaca.
export function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  return minutes >= 60
    ? `${Math.floor(minutes / 60)} jam ${minutes % 60} menit`
    : `${minutes} menit`;
}

// Menghitung statistik sesi hari ini, total durasi, streak harian, dan grafik 7 hari terakhir.
export function getStats(sessions: Session[], now = Date.now()) {
  const today = localDateKey(now);
  const days = new Set(
    sessions.map((session) => localDateKey(session.completedAt)),
  );
  const cursor = new Date(now);
  cursor.setHours(12, 0, 0, 0);
  if (!days.has(today)) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  // Hitung hari berturut-turut ke belakang selama tanggal ditemukan pada riwayat.
  while (days.has(localDateKey(cursor.getTime()))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  // Susun data fokus harian untuk 7 hari terakhir secara berurutan.
  const week = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(now);
    date.setDate(date.getDate() - 6 + index);
    const key = localDateKey(date.getTime());
    return {
      key,
      label: date.toLocaleDateString("id-ID", { weekday: "short" }),
      seconds: sessions
        .filter((session) => localDateKey(session.completedAt) === key)
        .reduce((total, session) => total + session.actualFocusSeconds, 0),
    };
  });
  return {
    todaySessions: sessions.filter(
      (session) => localDateKey(session.completedAt) === today,
    ).length,
    totalSeconds: sessions.reduce(
      (total, session) => total + session.actualFocusSeconds,
      0,
    ),
    streak,
    week,
  };
}
