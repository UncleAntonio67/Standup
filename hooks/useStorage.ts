import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, createElement, useContext, useMemo, useEffect, useState } from 'react';

import { ThemeMode } from '../constants/app-theme';
import { PainLog } from '../constants/types';
import { useAuth } from './auth-context';

export type BodyPartSlug = 'neck' | 'shoulder' | 'lower-back' | 'core' | 'gluteal' | 'leg';
export type AlertLevel = 'normal' | 'high' | 'critical';
export type PartNudgeProfile = 'gentle' | 'balanced' | 'active';
export type WeekdayKey = 'sun' | 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat';
export type HomeLayoutSectionId =
  | 'sedentary'
  | 'partReminder'
  | 'summary'
  | 'bodyOverview'
  | 'workspaceInsight'
  | 'quickActions';

export const WEEKDAY_KEYS: WeekdayKey[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
export const DEFAULT_HOME_LAYOUT_ORDER: HomeLayoutSectionId[] = [
  'sedentary',
  'partReminder',
  'summary',
  'bodyOverview',
  'workspaceInsight',
  'quickActions',
];

export const getWeekdayKey = (date = new Date()): WeekdayKey => {
  const map: WeekdayKey[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  return map[date.getDay()];
};

type Targets = Record<BodyPartSlug, number>;

type DailyPlan = {
  limitMin: number;
  targets: Targets;
};

type DailyActivity = {
  date: string;
  standCount: number;
  sitSeconds: number;
  sedentaryBreaks: number;
};

const STORAGE_KEYS = {
  PAIN: 'BIOMECH_PAIN_V1',
  SETTINGS: 'BIOMECH_SETTINGS_V3',
  ACTIVITY: 'BIOMECH_ACTIVITY_V2',
  SOS: 'BIOMECH_SOS_MODE',
  MUSCLE_PROGRESS: 'BIOMECH_MUSCLE_PROGRESS_TODAY',
  LANG: 'BIOMECH_LANG',
  THEME: 'BIOMECH_THEME_MODE',
  LAYOUT: 'BIOMECH_HOME_LAYOUT_V1',
};

const DEFAULT_TARGETS: Targets = {
  neck: 5,
  shoulder: 3,
  'lower-back': 5,
  core: 5,
  gluteal: 3,
  leg: 3,
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const numberOr = (value: unknown, fallback: number) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const normalizeTargets = (raw: Partial<Record<BodyPartSlug, unknown>> | undefined, fallback: Targets): Targets => {
  return {
    neck: clamp(numberOr(raw?.neck, fallback.neck), 1, 30),
    shoulder: clamp(numberOr(raw?.shoulder, fallback.shoulder), 1, 30),
    'lower-back': clamp(numberOr(raw?.['lower-back'], fallback['lower-back']), 1, 30),
    core: clamp(numberOr(raw?.core, fallback.core), 1, 30),
    gluteal: clamp(numberOr(raw?.gluteal, fallback.gluteal), 1, 30),
    leg: clamp(numberOr(raw?.leg, fallback.leg), 1, 30),
  };
};

const buildDailyPlans = (limitMin: number, targets: Targets): Record<WeekdayKey, DailyPlan> => {
  return WEEKDAY_KEYS.reduce((acc, day) => {
    acc[day] = {
      limitMin,
      targets: { ...targets },
    };
    return acc;
  }, {} as Record<WeekdayKey, DailyPlan>);
};

export interface UserSettings {
  limitMin: number;
  partReminderMin: number;
  partNudgeProfile: PartNudgeProfile;
  partNudgeSoftThreshold: number;
  partNudgeConfirmThreshold: number;
  alertLevel: AlertLevel;
  workStartHour: number;
  workEndHour: number;
  remindersInWorkOnly: boolean;
  useDailyPlan: boolean;
  targets: Targets;
  dailyPlans: Record<WeekdayKey, DailyPlan>;
}

const DEFAULT_SETTINGS: UserSettings = {
  limitMin: 45,
  partReminderMin: 4,
  partNudgeProfile: 'balanced',
  partNudgeSoftThreshold: 52,
  partNudgeConfirmThreshold: 78,
  alertLevel: 'high',
  workStartHour: 9,
  workEndHour: 18,
  remindersInWorkOnly: true,
  useDailyPlan: true,
  targets: { ...DEFAULT_TARGETS },
  dailyPlans: buildDailyPlans(45, DEFAULT_TARGETS),
};

const getToday = () => new Date().toISOString().split('T')[0];

const createEmptyTodayActivity = (): DailyActivity => ({
  date: getToday(),
  standCount: 0,
  sitSeconds: 0,
  sedentaryBreaks: 0,
});

const normalizeSettings = (loaded: any): UserSettings => {
  const baseTargets = normalizeTargets(loaded?.targets, DEFAULT_TARGETS);
  const baseLimitMin = clamp(numberOr(loaded?.limitMin, DEFAULT_SETTINGS.limitMin), 10, 180);

  const rawDailyPlans = loaded?.dailyPlans || {};
  const dailyPlans = WEEKDAY_KEYS.reduce((acc, day) => {
    const source = rawDailyPlans?.[day];
    const fallback = {
      limitMin: baseLimitMin,
      targets: baseTargets,
    };

    acc[day] = {
      limitMin: clamp(numberOr(source?.limitMin, fallback.limitMin), 10, 180),
      targets: normalizeTargets(source?.targets, fallback.targets),
    };

    return acc;
  }, {} as Record<WeekdayKey, DailyPlan>);

  const softThreshold = clamp(
    numberOr(loaded?.partNudgeSoftThreshold, DEFAULT_SETTINGS.partNudgeSoftThreshold),
    20,
    95
  );
  const confirmThreshold = clamp(
    numberOr(loaded?.partNudgeConfirmThreshold, DEFAULT_SETTINGS.partNudgeConfirmThreshold),
    softThreshold + 8,
    100
  );

  return {
    ...DEFAULT_SETTINGS,
    ...loaded,
    limitMin: baseLimitMin,
    partReminderMin: clamp(numberOr(loaded?.partReminderMin, DEFAULT_SETTINGS.partReminderMin), 1, 60),
    partNudgeProfile:
      loaded?.partNudgeProfile === 'gentle' || loaded?.partNudgeProfile === 'balanced' || loaded?.partNudgeProfile === 'active'
        ? loaded.partNudgeProfile
        : DEFAULT_SETTINGS.partNudgeProfile,
    partNudgeSoftThreshold: softThreshold,
    partNudgeConfirmThreshold: confirmThreshold,
    workStartHour: clamp(numberOr(loaded?.workStartHour, DEFAULT_SETTINGS.workStartHour), 0, 23),
    workEndHour: clamp(numberOr(loaded?.workEndHour, DEFAULT_SETTINGS.workEndHour), 0, 23),
    remindersInWorkOnly:
      typeof loaded?.remindersInWorkOnly === 'boolean'
        ? loaded.remindersInWorkOnly
        : DEFAULT_SETTINGS.remindersInWorkOnly,
    alertLevel:
      loaded?.alertLevel === 'normal' || loaded?.alertLevel === 'high' || loaded?.alertLevel === 'critical'
        ? loaded.alertLevel
        : DEFAULT_SETTINGS.alertLevel,
    useDailyPlan: typeof loaded?.useDailyPlan === 'boolean' ? loaded.useDailyPlan : DEFAULT_SETTINGS.useDailyPlan,
    targets: baseTargets,
    dailyPlans,
  };
};

const normalizeLayoutOrder = (raw: unknown): HomeLayoutSectionId[] => {
  if (!Array.isArray(raw)) return [...DEFAULT_HOME_LAYOUT_ORDER];

  const safe = raw.filter((item): item is HomeLayoutSectionId =>
    typeof item === 'string' && DEFAULT_HOME_LAYOUT_ORDER.includes(item as HomeLayoutSectionId)
  );

  if (!safe.length) return [...DEFAULT_HOME_LAYOUT_ORDER];

  const merged = [...safe];
  DEFAULT_HOME_LAYOUT_ORDER.forEach((section) => {
    if (!merged.includes(section)) merged.push(section);
  });

  return merged;
};

const useStorageInternal = () => {
  const { user } = useAuth();

  const [painLogs, setPainLogs] = useState<PainLog[]>([]);
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [todayActivity, setTodayActivity] = useState<DailyActivity>(createEmptyTodayActivity());
  const [activityHistory, setActivityHistory] = useState<DailyActivity[]>([]);
  const [isSosMode, setIsSosMode] = useState(false);
  const [muscleProgress, setMuscleProgress] = useState<Record<string, number>>({});
  const [lang, setLang] = useState<'zh' | 'en'>('zh');
  const [themeMode, setThemeMode] = useState<ThemeMode>('dark');
  const [homeLayoutOrder, setHomeLayoutOrder] = useState<HomeLayoutSectionId[]>([...DEFAULT_HOME_LAYOUT_ORDER]);

  const namespacedKey = (key: string) => (user ? `${key}::${user.id}` : key);

  useEffect(() => {
    if (!user) {
      setPainLogs([]);
      setSettings(DEFAULT_SETTINGS);
      setTodayActivity(createEmptyTodayActivity());
      setActivityHistory([]);
      setIsSosMode(false);
      setMuscleProgress({});
      setLang('zh');
      setThemeMode('dark');
      setHomeLayoutOrder([...DEFAULT_HOME_LAYOUT_ORDER]);
      return;
    }
    void loadAll();
  }, [user?.id]);

  const loadAll = async () => {
    if (!user) return;

    try {
      const userId = user.id;
      const painKey = `${STORAGE_KEYS.PAIN}::${userId}`;
      const settingsKey = `${STORAGE_KEYS.SETTINGS}::${userId}`;
      const activityKey = `${STORAGE_KEYS.ACTIVITY}::${userId}`;
      const sosKey = `${STORAGE_KEYS.SOS}::${userId}`;
      const progressKey = `${STORAGE_KEYS.MUSCLE_PROGRESS}::${userId}`;
      const langKey = `${STORAGE_KEYS.LANG}::${userId}`;
      const themeKey = `${STORAGE_KEYS.THEME}::${userId}`;
      const layoutKey = `${STORAGE_KEYS.LAYOUT}::${userId}`;

      const loaded = await AsyncStorage.multiGet([
        painKey,
        settingsKey,
        activityKey,
        sosKey,
        progressKey,
        langKey,
        themeKey,
        layoutKey,
      ]);

      const data: Record<string, any> = {};
      loaded.forEach(([key, value]) => {
        if (!value) return;
        try {
          data[key] = JSON.parse(value);
        } catch {
          data[key] = undefined;
        }
      });

      if (Array.isArray(data[painKey])) {
        setPainLogs(data[painKey]);
      }

      if (data[settingsKey]) {
        setSettings(normalizeSettings(data[settingsKey]));
      }

      const historyRaw = Array.isArray(data[activityKey]) ? data[activityKey] : [];
      const normalizedHistory: DailyActivity[] = historyRaw.map((entry: any) => ({
        date: entry?.date,
        standCount: entry?.standCount || 0,
        sitSeconds: entry?.sitSeconds || 0,
        sedentaryBreaks: entry?.sedentaryBreaks || 0,
      }));
      setActivityHistory(normalizedHistory);

      const today = getToday();
      const todayFromHistory = normalizedHistory.find((entry) => entry.date === today);
      if (todayFromHistory) {
        setTodayActivity(todayFromHistory);
      } else {
        setTodayActivity(createEmptyTodayActivity());
      }

      if (data[progressKey] && typeof data[progressKey] === 'object') {
        setMuscleProgress(data[progressKey]);
      }

      if (typeof data[sosKey] === 'boolean') {
        setIsSosMode(data[sosKey]);
      }

      if (data[langKey] === 'zh' || data[langKey] === 'en') {
        setLang(data[langKey]);
      }

      if (data[themeKey] === 'light' || data[themeKey] === 'dark') {
        setThemeMode(data[themeKey]);
      }

      setHomeLayoutOrder(normalizeLayoutOrder(data[layoutKey]));
    } catch (error) {
      console.error(error);
    }
  };

  const upsertTodayActivity = async (patch: Partial<DailyActivity>) => {
    if (!user) return;

    const today = getToday();
    const base = todayActivity.date === today ? todayActivity : createEmptyTodayActivity();
    const next: DailyActivity = {
      ...base,
      ...patch,
      date: today,
    };

    const safeHistory = activityHistory || [];
    const nextHistory = [...safeHistory.filter((entry) => entry.date !== today), next];

    setTodayActivity(next);
    setActivityHistory(nextHistory);
    await AsyncStorage.setItem(namespacedKey(STORAGE_KEYS.ACTIVITY), JSON.stringify(nextHistory));
  };

  const toggleLang = async () => {
    if (!user) return;

    const next = lang === 'zh' ? 'en' : 'zh';
    setLang(next);
    await AsyncStorage.setItem(namespacedKey(STORAGE_KEYS.LANG), JSON.stringify(next));
  };

  const toggleThemeMode = async () => {
    if (!user) return;

    const next: ThemeMode = themeMode === 'dark' ? 'light' : 'dark';
    setThemeMode(next);
    await AsyncStorage.setItem(namespacedKey(STORAGE_KEYS.THEME), JSON.stringify(next));
  };

  const finishExercise = async (bodyPartSlugs: string[], targetSlug: BodyPartSlug) => {
    if (!user) return;

    const nextProgress = { ...muscleProgress };

    bodyPartSlugs.forEach((slug) => {
      nextProgress[slug] = (nextProgress[slug] || 0) + 1;
    });

    if (!bodyPartSlugs.includes(targetSlug)) {
      nextProgress[targetSlug] = (nextProgress[targetSlug] || 0) + 1;
    }

    setMuscleProgress(nextProgress);
    await AsyncStorage.setItem(namespacedKey(STORAGE_KEYS.MUSCLE_PROGRESS), JSON.stringify(nextProgress));

    await upsertTodayActivity({
      standCount: (todayActivity.standCount || 0) + 1,
    });
  };

  const completeSedentaryBreak = async (elapsedSitSeconds: number) => {
    const sit = Math.max(0, elapsedSitSeconds || 0);
    await upsertTodayActivity({
      sitSeconds: (todayActivity.sitSeconds || 0) + sit,
      sedentaryBreaks: (todayActivity.sedentaryBreaks || 0) + 1,
      standCount: (todayActivity.standCount || 0) + 1,
    });
  };

  const saveSettings = async (nextSettings: UserSettings) => {
    if (!user) return;

    const normalized = normalizeSettings(nextSettings);
    setSettings(normalized);
    await AsyncStorage.setItem(namespacedKey(STORAGE_KEYS.SETTINGS), JSON.stringify(normalized));
  };

  const clearTodayProgress = async () => {
    if (!user) return;

    const today = getToday();
    const resetActivity: DailyActivity = {
      date: today,
      standCount: 0,
      sitSeconds: 0,
      sedentaryBreaks: 0,
    };

    const safeHistory = activityHistory || [];
    const nextHistory = [...safeHistory.filter((entry) => entry.date !== today), resetActivity];

    setTodayActivity(resetActivity);
    setActivityHistory(nextHistory);
    setMuscleProgress({});

    await AsyncStorage.multiSet([
      [namespacedKey(STORAGE_KEYS.ACTIVITY), JSON.stringify(nextHistory)],
      [namespacedKey(STORAGE_KEYS.MUSCLE_PROGRESS), JSON.stringify({})],
    ]);
  };

  const addPainLog = async (level: number) => {
    if (!user) return;

    const today = getToday();
    const nextLogs = [...painLogs.filter((item) => item.date !== today), { date: today, level }];
    setPainLogs(nextLogs);
    await AsyncStorage.setItem(namespacedKey(STORAGE_KEYS.PAIN), JSON.stringify(nextLogs));
  };

  const toggleSosMode = async () => {
    if (!user) return;

    const next = !isSosMode;
    setIsSosMode(next);
    await AsyncStorage.setItem(namespacedKey(STORAGE_KEYS.SOS), JSON.stringify(next));
  };

  const saveHomeLayoutOrder = async (nextOrder: HomeLayoutSectionId[]) => {
    if (!user) return;

    const normalized = normalizeLayoutOrder(nextOrder);
    setHomeLayoutOrder(normalized);
    await AsyncStorage.setItem(namespacedKey(STORAGE_KEYS.LAYOUT), JSON.stringify(normalized));
  };

  return {
    settings,
    saveSettings,
    clearTodayProgress,
    todayActivity,
    activityHistory,
    isSosMode,
    toggleSosMode,
    muscleProgress,
    finishExercise,
    completeSedentaryBreak,
    lang,
    toggleLang,
    themeMode,
    toggleThemeMode,
    homeLayoutOrder,
    saveHomeLayoutOrder,
    painLogs,
    addPainLog,
  };
};

type StorageValue = ReturnType<typeof useStorageInternal>;

const StorageContext = createContext<StorageValue | null>(null);

export function StorageProvider({ children }: { children: React.ReactNode }) {
  const value = useStorageInternal();
  const memoValue = useMemo(() => value, [value]);

  return createElement(StorageContext.Provider, { value: memoValue }, children);
}

export const useStorage = () => {
  const value = useContext(StorageContext);

  if (!value) {
    throw new Error('useStorage must be used within StorageProvider');
  }

  return value;
};
