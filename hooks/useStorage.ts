import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect } from 'react';
import { PainLog } from '../constants/types';

export type BodyPartSlug = 'neck' | 'shoulder' | 'lower-back' | 'core' | 'gluteal' | 'leg';

const STORAGE_KEYS = {
    PAIN: 'BIOMECH_PAIN_V1',
    SETTINGS: 'BIOMECH_SETTINGS_V3',
    ACTIVITY: 'BIOMECH_ACTIVITY_V1',
    SOS: 'BIOMECH_SOS_MODE',
    MUSCLE_PROGRESS: 'BIOMECH_MUSCLE_PROGRESS_TODAY',
    LANG: 'BIOMECH_LANG'
};

export interface UserSettings {
    limitMin: number;
    targets: {
        [key in BodyPartSlug]: number;
    };
}

export const useStorage = () => {
    const DEFAULT_SETTINGS: UserSettings = {
        limitMin: 45,
        targets: { 'neck': 5, 'shoulder': 3, 'lower-back': 5, 'core': 5, 'gluteal': 3, 'leg': 3 }
    };

    const [painLogs, setPainLogs] = useState<PainLog[]>([]);
    const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
    const [todayActivity, setTodayActivity] = useState<any>({ date: '', standCount: 0 });
    const [activityHistory, setActivityHistory] = useState<any[]>([]);
    const [isSosMode, setIsSosMode] = useState(false);
    const [muscleProgress, setMuscleProgress] = useState<Record<string, number>>({});
    const [lang, setLang] = useState<'zh' | 'en'>('zh');

    useEffect(() => {
        loadAll();
    }, []);

    const loadAll = async () => {
        try {
            const keys = await AsyncStorage.multiGet([
                STORAGE_KEYS.PAIN, STORAGE_KEYS.SETTINGS, STORAGE_KEYS.ACTIVITY, STORAGE_KEYS.SOS, STORAGE_KEYS.MUSCLE_PROGRESS, STORAGE_KEYS.LANG
            ]);

            const data: any = {};
            keys.forEach(([key, val]) => { if(val) data[key] = JSON.parse(val); });

            if (data[STORAGE_KEYS.SETTINGS]) {
                setSettings({
                    ...DEFAULT_SETTINGS,
                    ...data[STORAGE_KEYS.SETTINGS],
                    targets: { ...DEFAULT_SETTINGS.targets, ...data[STORAGE_KEYS.SETTINGS].targets }
                });
            }

            const history = Array.isArray(data[STORAGE_KEYS.ACTIVITY]) ? data[STORAGE_KEYS.ACTIVITY] : [];
            setActivityHistory(history);

            const today = new Date().toISOString().split('T')[0];
            const lastRec = history.length > 0 ? history[history.length - 1] : null;

            if (lastRec && lastRec.date === today) {
                setTodayActivity(lastRec);
                if (data[STORAGE_KEYS.MUSCLE_PROGRESS]) setMuscleProgress(data[STORAGE_KEYS.MUSCLE_PROGRESS]);
            } else {
                setTodayActivity({ date: today, standCount: 0 });
                setMuscleProgress({});
            }

            if (data[STORAGE_KEYS.SOS]) setIsSosMode(data[STORAGE_KEYS.SOS]);
            if (data[STORAGE_KEYS.LANG]) setLang(data[STORAGE_KEYS.LANG]);

        } catch (e) { console.error(e); }
    };

    // --- Actions ---
    const toggleLang = async () => {
        const newLang = lang === 'zh' ? 'en' : 'zh';
        setLang(newLang);
        await AsyncStorage.setItem(STORAGE_KEYS.LANG, JSON.stringify(newLang));
    };

    // [修复与升级] 合并原子操作，防止状态覆盖
    const finishExercise = async (bodyPartSlugs: string[], targetSlug: BodyPartSlug) => {
        const newProgress = { ...muscleProgress };

        // 1. 增加具体肌肉计数 (e.g., trapezius)
        bodyPartSlugs.forEach(s => { newProgress[s] = (newProgress[s] || 0) + 1; });

        // 2. 增加大类目标计数 (e.g., shoulder)
        // 注意：有些动作的 bodyPartSlug 包含 targetSlug，避免重复计数
        // 我们约定：muscleProgress 里既存具体的，也存大类的
        if (!bodyPartSlugs.includes(targetSlug)) {
            newProgress[targetSlug] = (newProgress[targetSlug] || 0) + 1;
        } else {
            // 如果包含，循环里已经加过了，不需要额外操作
            // 但为了保险（比如 neck 既是部位也是分类），我们信任循环里的计数
        }

        // 强制修正：确保 targetSlug 至少加了1 (兜底逻辑)
        // 实际场景：做 "Neck Tilt" (slugs: ['neck', 'trapezius'], target: 'neck')
        // 循环里 'neck' +1, 'trapezius' +1。此时 targetSlug 'neck' 已经加了。OK。

        setMuscleProgress(newProgress);
        await AsyncStorage.setItem(STORAGE_KEYS.MUSCLE_PROGRESS, JSON.stringify(newProgress));
        await recordStandUp();
    };

    const recordStandUp = async () => {
        const today = new Date().toISOString().split('T')[0];
        const newToday = { ...todayActivity, date: today, standCount: todayActivity.standCount + 1 };
        const safeHistory = activityHistory || [];
        const newHistory = [...safeHistory.filter(h => h.date !== today), newToday];

        setTodayActivity(newToday);
        setActivityHistory(newHistory);
        await AsyncStorage.setItem(STORAGE_KEYS.ACTIVITY, JSON.stringify(newHistory));
    };

    const saveSettings = async (s: UserSettings) => {
        setSettings(s);
        await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(s));
    };

    const addPainLog = async (level: number) => {
        const today = new Date().toISOString().split('T')[0];
        const newLogs = [...painLogs.filter(l => l.date !== today), { date: today, level }];
        setPainLogs(newLogs);
        await AsyncStorage.setItem(STORAGE_KEYS.PAIN, JSON.stringify(newLogs));
    };

    const toggleSosMode = async () => {
        const newVal = !isSosMode;
        setIsSosMode(newVal);
        await AsyncStorage.setItem(STORAGE_KEYS.SOS, JSON.stringify(newVal));
    };

    return {
        settings, saveSettings,
        todayActivity, activityHistory,
        isSosMode, toggleSosMode,
        muscleProgress, finishExercise, // 使用新的合并函数
        lang, toggleLang,
        painLogs, addPainLog
    };
};