import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import Body, { ExtendedBodyPart, Slug } from 'react-native-body-highlighter';
import Svg, { Circle } from 'react-native-svg';
import { useRouter } from 'expo-router';

import { TimerWidget } from '../../components/TimerWidget';
import { CartoonActionPanel } from '../../components/CartoonActionPanel';
import { APP_THEME } from '../../constants/app-theme';
import { EXERCISE_DATA } from '../../constants/data';
import { buildExerciseVoiceText, buildGuideVoiceText } from '../../constants/exercise-media';
import { buildExerciseFrames, buildGuideFrames, getExerciseVisualPart, getGuideVisualPart } from '../../constants/exercise-visuals';
import { PART_TRAINING_GUIDES, SEDENTARY_RECOVERY_GUIDES, TrainingGuide } from '../../constants/part-guides';
import { PART_META, PART_ORDER } from '../../constants/part-meta';
import { BodyPartSlug, HomeLayoutSectionId, WeekdayKey, getWeekdayKey, useStorage } from '../../hooks/useStorage';

type PartProgress = {
  slug: BodyPartSlug;
  done: number;
  target: number;
  ratio: number;
  remain: number;
  status: 'todo' | 'partial' | 'done';
};

type PartNudge = {
  slug: BodyPartSlug;
  score: number;
  reason: string;
  level: 'soft' | 'confirm';
  at: number;
};

type ReminderExercise = (typeof EXERCISE_DATA)[number];

const DAY_LABEL: Record<WeekdayKey, string> = {
  mon: '周一',
  tue: '周二',
  wed: '周三',
  thu: '周四',
  fri: '周五',
  sat: '周六',
  sun: '周日',
};

const BODY_TO_TARGET: Partial<Record<Slug, BodyPartSlug>> = {
  neck: 'neck',
  trapezius: 'shoulder',
  deltoids: 'shoulder',
  triceps: 'shoulder',
  'lower-back': 'lower-back',
  abs: 'core',
  obliques: 'core',
  gluteal: 'gluteal',
  quadriceps: 'leg',
  hamstring: 'leg',
  calves: 'leg',
  tibialis: 'leg',
  knees: 'leg',
};

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

function ProgressRing({
  progress,
  size,
  stroke,
  color,
  track,
}: {
  progress: number;
  size: number;
  stroke: number;
  color: string;
  track: string;
}) {
  const safe = clamp(progress, 0, 1);
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - safe);

  return (
    <Svg width={size} height={size}>
      <Circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={stroke} fill="none" />
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke={color}
        strokeWidth={stroke}
        fill="none"
        strokeDasharray={`${c} ${c}`}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </Svg>
  );
}

export default function HomeScreen() {
  const {
    settings,
    todayActivity,
    muscleProgress,
    finishExercise,
    completeSedentaryBreak,
    themeMode,
    toggleThemeMode,
    lang,
    homeLayoutOrder,
  } = useStorage();
  const router = useRouter();
  const { width } = useWindowDimensions();

  const theme = APP_THEME[themeMode];
  const isWide = width >= 980;

  const [sitSeconds, setSitSeconds] = useState(0);
  const [showSedentaryModal, setShowSedentaryModal] = useState(false);
  const [showPartReminderModal, setShowPartReminderModal] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [selectedPart, setSelectedPart] = useState<BodyPartSlug | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<ReminderExercise | null>(null);
  const [selectedRecoveryGuide, setSelectedRecoveryGuide] = useState<TrainingGuide | null>(null);
  const [bodySide, setBodySide] = useState<'front' | 'back'>('front');
  const [partNudge, setPartNudge] = useState<PartNudge | null>(null);

  const lastPartReminderAtRef = useRef(0);
  const partSnoozeUntilRef = useRef(0);
  const partMuteDateRef = useRef<string | null>(null);
  const partIgnoreCountRef = useRef(0);
  const partCompleteCountRef = useRef(0);

  const todayKey = getWeekdayKey();
  const effectivePlan = settings.useDailyPlan ? settings.dailyPlans[todayKey] : { limitMin: settings.limitMin, targets: settings.targets };

  useEffect(() => {
    const timer = setInterval(() => setSitSeconds((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const sitLimitSeconds = useMemo(() => Math.max(1, effectivePlan.limitMin) * 60, [effectivePlan.limitMin]);
  const sedentaryAlarmOn = sitSeconds >= sitLimitSeconds;

  const pingByLevel = useCallback(async () => {
    if (settings.alertLevel === 'critical') {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    if (settings.alertLevel === 'high') {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [settings.alertLevel]);

  useEffect(() => {
    if (!sedentaryAlarmOn) return;

    const guide = SEDENTARY_RECOVERY_GUIDES[Math.floor(Math.random() * SEDENTARY_RECOVERY_GUIDES.length)];
    setSelectedRecoveryGuide(guide);
    setShowSedentaryModal(true);
    void pingByLevel();

    if (settings.alertLevel === 'normal') return;
    const ms = settings.alertLevel === 'critical' ? 4500 : 10000;
    const timer = setInterval(() => {
      void pingByLevel();
    }, ms);
    return () => clearInterval(timer);
  }, [pingByLevel, sedentaryAlarmOn, settings.alertLevel]);

  const isInWorkWindow = useCallback(() => {
    if (!settings.remindersInWorkOnly) return true;

    const now = new Date().getHours();
    const start = clamp(settings.workStartHour, 0, 23);
    const end = clamp(settings.workEndHour, 0, 23);

    if (start === end) return true;
    if (start < end) return now >= start && now < end;
    return now >= start || now < end;
  }, [settings.remindersInWorkOnly, settings.workStartHour, settings.workEndHour]);

  const partProgress = useMemo<PartProgress[]>(() => {
    return PART_ORDER.map((slug) => {
      const done = muscleProgress[slug] || 0;
      const target = Math.max(1, effectivePlan.targets[slug] || 1);
      const ratio = done / target;
      const remain = Math.max(target - done, 0);
      return {
        slug,
        done,
        target,
        ratio,
        remain,
        status: ratio >= 1 ? 'done' : ratio > 0 ? 'partial' : 'todo',
      };
    });
  }, [effectivePlan.targets, muscleProgress]);

  const nextRecommended = useMemo(() => {
    return partProgress
      .filter((item) => item.remain > 0)
      .sort((a, b) => {
        if (b.remain !== a.remain) return b.remain - a.remain;
        return a.ratio - b.ratio;
      })[0];
  }, [partProgress]);

  const getPartExercises = useCallback((slug: BodyPartSlug) => {
    return EXERCISE_DATA.filter((item) => item.targetSlug === slug).slice(0, 6);
  }, []);

  const openPartReminder = useCallback(
    (slug: BodyPartSlug) => {
      const pool = getPartExercises(slug);
      setSelectedPart(slug);
      setSelectedExercise(pool.length ? pool[Math.floor(Math.random() * pool.length)] : null);
      setShowPartReminderModal(true);
    },
    [getPartExercises]
  );

  const shouldMutePartNudgeToday = useCallback(() => {
    return partMuteDateRef.current === new Date().toISOString().slice(0, 10);
  }, []);

  const buildPartNudge = useCallback((): PartNudge | null => {
    if (!nextRecommended) return null;

    const now = Date.now();
    if (now < partSnoozeUntilRef.current) return null;
    if (shouldMutePartNudgeToday()) return null;

    const hour = new Date().getHours();
    const profileFactor =
      settings.partNudgeProfile === 'active' ? 1.2 : settings.partNudgeProfile === 'gentle' ? 0.88 : 1;
    const weightedBase =
      (Math.max(0, nextRecommended.remain) * 14 + Math.max(0, 1 - nextRecommended.ratio) * 50) * profileFactor;
    const weightedUrgency = hour >= 17 ? 20 : hour >= 15 ? 14 : hour >= 12 ? 8 : 0;
    const weightedFatiguePenalty = Math.min(partIgnoreCountRef.current * 12, 30);
    const weightedStreakBoost = Math.min(partCompleteCountRef.current * 3, 9);
    const weightedScore = Math.max(
      0,
      Math.round(weightedBase + weightedUrgency - weightedFatiguePenalty + weightedStreakBoost)
    );

    if (weightedScore < settings.partNudgeSoftThreshold) {
      return null;
    }

    const weightedLevel: PartNudge['level'] = weightedScore >= settings.partNudgeConfirmThreshold ? 'confirm' : 'soft';
    const weightedReason =
      weightedLevel === 'confirm'
        ? `该部位今天还差 ${nextRecommended.remain} 次，建议现在完成 1 次。`
        : `轻提醒：该部位还差 ${nextRecommended.remain} 次，可在空档完成。`;

    return {
      slug: nextRecommended.slug,
      score: weightedScore,
      reason: weightedReason,
      level: weightedLevel,
      at: now,
    };
  }, [
    nextRecommended,
    settings.partNudgeConfirmThreshold,
    settings.partNudgeProfile,
    settings.partNudgeSoftThreshold,
    shouldMutePartNudgeToday,
  ]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (sedentaryAlarmOn) return;
      if (!isInWorkWindow()) return;

      const intervalMs = Math.max(1, settings.partReminderMin) * 60 * 1000;
      if (Date.now() - lastPartReminderAtRef.current < intervalMs) return;

      const nudge = buildPartNudge();
      if (!nudge) return;

      lastPartReminderAtRef.current = Date.now();
      if (nudge.level === 'confirm') {
        openPartReminder(nudge.slug);
        setPartNudge(null);
        return;
      }

      setPartNudge(nudge);
    }, 15000);

    return () => clearInterval(timer);
  }, [buildPartNudge, isInWorkWindow, openPartReminder, sedentaryAlarmOn, settings.partReminderMin]);

  const highlights = useMemo<ExtendedBodyPart[]>(() => {
    const map = new Map<Slug, 1 | 2>();

    partProgress.forEach((item) => {
      if (item.status === 'todo') return;
      const intensity: 1 | 2 = item.status === 'done' ? 2 : 1;

      PART_META[item.slug].bodySlugs.forEach((bodySlug) => {
        const current = map.get(bodySlug);
        if (!current || intensity > current) map.set(bodySlug, intensity);
      });
    });

    return Array.from(map.entries()).map(([slug, intensity]) => ({ slug, intensity }));
  }, [partProgress]);

  const selectedExercises = useMemo(() => {
    if (!selectedPart) return [];
    const fromData = getPartExercises(selectedPart);
    const fromGuides = PART_TRAINING_GUIDES[selectedPart] || [];

    const transformed = fromGuides.map((guide) => ({
      id: guide.id,
      title: guide.title,
      desc: `${guide.goal} · ${guide.duration}`,
      tip: guide.cue,
      titleEn: '',
      descEn: '',
      tipEn: '',
      posture: 'standing' as const,
      isSosSafe: true,
      bodyPartSlug: [selectedPart],
      targetSlug: selectedPart,
    }));

    return [...fromData, ...transformed].slice(0, 8);
  }, [getPartExercises, selectedPart]);

  const panelColors = useMemo(
    () => ({
      surface: theme.surfaceAlt,
      border: theme.border,
      text: theme.text,
      textDim: theme.textDim,
      primary: theme.primary,
    }),
    [theme.border, theme.primary, theme.surfaceAlt, theme.text, theme.textDim]
  );

  const completeSedentary = useCallback(async () => {
    await completeSedentaryBreak(sitSeconds);
    setSitSeconds(0);
    setShowSedentaryModal(false);
  }, [completeSedentaryBreak, sitSeconds]);

  const completePart = useCallback(async () => {
    if (!selectedPart) return;

    if (selectedExercise) {
      await finishExercise(selectedExercise.bodyPartSlug, selectedExercise.targetSlug);
    } else {
      await finishExercise([selectedPart], selectedPart);
    }

    setShowPartReminderModal(false);
    setPartNudge(null);
    partIgnoreCountRef.current = Math.max(0, partIgnoreCountRef.current - 1);
    partCompleteCountRef.current += 1;
    Alert.alert('完成', `${PART_META[selectedPart].label} +1`);
  }, [finishExercise, selectedExercise, selectedPart]);

  const previewSedentary = useCallback(() => {
    const guide = SEDENTARY_RECOVERY_GUIDES[Math.floor(Math.random() * SEDENTARY_RECOVERY_GUIDES.length)];
    setSelectedRecoveryGuide(guide);
    setShowSedentaryModal(true);
    void pingByLevel();
  }, [pingByLevel]);

  const previewPartReminder = useCallback(() => {
    const next = nextRecommended?.slug || 'neck';
    openPartReminder(next);
  }, [nextRecommended?.slug, openPartReminder]);

  const remindPartNow = useCallback(() => {
    const slug = partNudge?.slug || nextRecommended?.slug;
    if (!slug) return;
    setPartNudge(null);
    openPartReminder(slug);
  }, [nextRecommended?.slug, openPartReminder, partNudge?.slug]);

  const snoozePartReminder = useCallback(() => {
    partSnoozeUntilRef.current = Date.now() + 10 * 60 * 1000;
    partIgnoreCountRef.current += 1;
    setPartNudge(null);
  }, []);

  const mutePartReminderToday = useCallback(() => {
    partMuteDateRef.current = new Date().toISOString().slice(0, 10);
    partIgnoreCountRef.current += 2;
    setPartNudge(null);
  }, []);

  const onBodyPress = useCallback((item: ExtendedBodyPart) => {
    if (!item.slug) return;
    const mapped = BODY_TO_TARGET[item.slug];
    if (!mapped) return;
    setSelectedPart(mapped);
    setShowGuideModal(true);
  }, []);

  const speakText = useCallback(
    (text: string) => {
      Speech.stop();
      Speech.speak(text, {
        language: lang === 'zh' ? 'zh-CN' : 'en-US',
        rate: 0.95,
        pitch: 1,
      });
    },
    [lang]
  );

  const mm = String(Math.floor(sitSeconds / 60)).padStart(2, '0');
  const ss = String(sitSeconds % 60).padStart(2, '0');
  const totalSitMinToday = Math.round((todayActivity.sitSeconds || 0) / 60);

  const workspaceInsight = useMemo(() => {
    const hour = new Date().getHours();
    const segment = hour < 11 ? '上午专注' : hour < 14 ? '午间过渡' : hour < 18 ? '下午专注' : '下班恢复';

    const avgProgress =
      partProgress.reduce((sum, item) => sum + Math.min(item.done / item.target, 1), 0) /
      Math.max(1, partProgress.length);

    const issues: string[] = [];
    const suggestions: string[] = [];

    if (sitSeconds > sitLimitSeconds * 0.8) {
      issues.push('本轮久坐接近阈值，颈腰负担明显增加。');
      suggestions.push('建议马上执行 1 分钟站立 + 2 轮踝泵。');
    }
    if ((todayActivity.sedentaryBreaks || 0) < 2 && hour >= 15) {
      issues.push('下午久坐打断次数偏少，易出现专注下降。');
      suggestions.push('把部位提醒间隔调整到 3~4 分钟。');
    }
    if (avgProgress < 0.4) {
      issues.push('部位训练完成度较低，刺激分配不均衡。');
      suggestions.push('优先完成“下一优先部位”，再补核心/腿部。');
    }
    if (!issues.length) {
      issues.push('当前节奏较稳定，但仍需防止长时间静坐。');
      suggestions.push('每 45~60 分钟至少离座活动一次。');
    }

    return {
      segment,
      issues,
      suggestions,
    };
  }, [partProgress, sitLimitSeconds, sitSeconds, todayActivity.sedentaryBreaks]);

  const orderedSectionIds = useMemo<HomeLayoutSectionId[]>(() => {
    const source = homeLayoutOrder?.length ? homeLayoutOrder : ['sedentary', 'part', 'summary', 'overview', 'settings', 'insight'];
    const normalized = source.map((item) => {
      if (item === 'part') return 'partReminder';
      if (item === 'overview') return 'bodyOverview';
      if (item === 'settings') return 'quickActions';
      if (item === 'insight') return 'workspaceInsight';
      return item;
    }) as HomeLayoutSectionId[];

    const merged = [...normalized];
    (['sedentary', 'partReminder', 'summary', 'bodyOverview', 'quickActions', 'workspaceInsight'] as HomeLayoutSectionId[]).forEach(
      (id) => {
        if (!merged.includes(id)) merged.push(id);
      }
    );
    return merged;
  }, [homeLayoutOrder]);

  const renderSectionById = (sectionId: HomeLayoutSectionId) => {
    if (sectionId === 'sedentary') {
      return (
        <View style={[styles.card, styles.gradientCard, { borderColor: sedentaryAlarmOn ? theme.danger : theme.border }]}> 
          <View style={styles.cardTitleRow}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>久坐提醒（最高优先级）</Text>
            <Text style={[styles.priorityText, { color: theme.danger }]}>PRIORITY</Text>
          </View>

          <TimerWidget
            styles={styles}
            title="本轮久坐时长"
            minutes={mm}
            seconds={ss}
            status={sedentaryAlarmOn ? '请立即起立活动，点击完成' : `今日阈值：${effectivePlan.limitMin} 分钟`}
            isAlarm={sedentaryAlarmOn}
            dangerColor={theme.danger}
            titleColor={theme.textDim}
            timeColor={theme.text}
            dimColor={theme.textDim}
            cardStyle={{ backgroundColor: theme.surfaceAlt, borderColor: theme.border }}
          />

          {!!selectedRecoveryGuide && (
            <View style={[styles.recoveryCard, { borderColor: theme.border, backgroundColor: theme.surfaceAlt }]}> 
              <CartoonActionPanel
                part="sedentary"
                frames={buildGuideFrames(selectedRecoveryGuide, 'sedentary')}
                colors={panelColors}
                compact
              />
              <Text style={[styles.recoveryTitle, { color: theme.text }]}>{selectedRecoveryGuide.title}</Text>
              <Text style={[styles.recoveryMeta, { color: theme.primary }]}> 
                {selectedRecoveryGuide.goal} · {selectedRecoveryGuide.duration}
              </Text>
              <Text style={[styles.recoveryTip, { color: theme.textDim }]}>{selectedRecoveryGuide.cue}</Text>
              <TouchableOpacity
                style={[styles.singleBtnSmall, { borderColor: theme.border, backgroundColor: theme.surface }]}
                onPress={() => speakText(buildGuideVoiceText(selectedRecoveryGuide, lang))}>
                <Text style={[styles.smallBtnText, { color: theme.text }]}>语音讲解</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.rowBtnWrap}>
            <TouchableOpacity style={[styles.rowBtn, { borderColor: theme.danger, backgroundColor: theme.alarmBg }]} onPress={previewSedentary}>
              <Text style={[styles.rowBtnText, { color: theme.danger }]}>预览久坐提醒</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.rowBtn, { borderColor: theme.primary, backgroundColor: theme.chipBg }]} onPress={completeSedentary}>
              <Text style={[styles.rowBtnText, { color: theme.primary }]}>我已起立完成</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    if (sectionId === 'partReminder') {
      return (
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}> 
          <Text style={[styles.cardTitle, { color: theme.text }]}>部位提醒（按目标动态）</Text>
          <Text style={[styles.noteText, { color: theme.textDim }]}>当前：{isInWorkWindow() ? '工作时段内，自动提醒开启' : '非工作时段，自动提醒暂停'}</Text>

          {!!nextRecommended && (
            <View style={[styles.nextCard, { borderColor: theme.border, backgroundColor: theme.surfaceAlt }]}> 
              <Text style={[styles.nextTitle, { color: theme.text }]}>下一优先部位：{PART_META[nextRecommended.slug].label}</Text>
              <Text style={[styles.nextDesc, { color: theme.textDim }]}>剩余 {nextRecommended.remain} 次，当前完成 {nextRecommended.done}/{nextRecommended.target}</Text>
            </View>
          )}

          {!!partNudge && (
            <View style={[styles.nudgeCard, { borderColor: theme.border, backgroundColor: theme.surfaceAlt }]}> 
              <Text style={[styles.nudgeTitle, { color: theme.primary }]}>机会型提醒 · {PART_META[partNudge.slug].label}</Text>
              <Text style={[styles.nudgeText, { color: theme.textDim }]}>{partNudge.reason}</Text>
              <View style={styles.nudgeBtnRow}>
                <TouchableOpacity style={[styles.nudgeBtn, { borderColor: theme.primary, backgroundColor: theme.chipBg }]} onPress={remindPartNow}>
                  <Text style={[styles.nudgeBtnText, { color: theme.primary }]}>现在做 1 次</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.nudgeBtn, { borderColor: theme.border, backgroundColor: theme.surface }]} onPress={snoozePartReminder}>
                  <Text style={[styles.nudgeBtnText, { color: theme.textDim }]}>稍后 10 分钟</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.nudgeBtn, { borderColor: theme.border, backgroundColor: theme.surface }]} onPress={mutePartReminderToday}>
                  <Text style={[styles.nudgeBtnText, { color: theme.textDim }]}>今天先不提醒</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <TouchableOpacity style={[styles.singleBtn, { borderColor: theme.primary, backgroundColor: theme.chipBg }]} onPress={previewPartReminder}>
            <Text style={[styles.rowBtnText, { color: theme.primary }]}>预览部位提醒</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (sectionId === 'summary') {
      return (
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { backgroundColor: theme.surface, borderColor: theme.border }]}> 
            <Text style={[styles.summaryLabel, { color: theme.textDim }]}>久坐中断</Text>
            <Text style={[styles.summaryValue, { color: theme.primary }]}>{todayActivity.sedentaryBreaks || 0}</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: theme.surface, borderColor: theme.border }]}> 
            <Text style={[styles.summaryLabel, { color: theme.textDim }]}>起立总次数</Text>
            <Text style={[styles.summaryValue, { color: theme.primary }]}>{todayActivity.standCount || 0}</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: theme.surface, borderColor: theme.border }]}> 
            <Text style={[styles.summaryLabel, { color: theme.textDim }]}>累计久坐(分)</Text>
            <Text style={[styles.summaryValue, { color: theme.primary }]}>{totalSitMinToday}</Text>
          </View>
        </View>
      );
    }

    if (sectionId === 'bodyOverview') {
      return (
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}> 
          <View style={styles.cardTitleRow}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>体态与进度总览（横向）</Text>
            <TouchableOpacity style={[styles.singleBtnSmall, { borderColor: theme.border, backgroundColor: theme.chipBg }]} onPress={() => setBodySide((p) => (p === 'front' ? 'back' : 'front'))}>
              <Text style={[styles.smallBtnText, { color: theme.textDim }]}>{bodySide === 'front' ? '切到背面' : '切到正面'}</Text>
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.overviewRow}>
            <View style={[styles.overviewPane, { borderColor: theme.border, backgroundColor: theme.surfaceAlt }]}> 
              <Text style={[styles.overviewTitle, { color: theme.text }]}>人体图</Text>
              <View style={styles.bodyWrap}>
                <Body
                  data={highlights}
                  side={bodySide}
                  scale={0.9}
                  border={theme.border}
                  colors={[theme.primary, theme.success]}
                  onBodyPartPress={onBodyPress}
                />
              </View>
              <View style={styles.legendRow}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: theme.success }]} />
                  <Text style={[styles.legendText, { color: theme.textDim }]}>完成</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: theme.primary }]} />
                  <Text style={[styles.legendText, { color: theme.textDim }]}>部分</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: theme.border }]} />
                  <Text style={[styles.legendText, { color: theme.textDim }]}>未开始</Text>
                </View>
              </View>
            </View>

            <View style={[styles.overviewPane, { borderColor: theme.border, backgroundColor: theme.surfaceAlt }]}> 
              <Text style={[styles.overviewTitle, { color: theme.text }]}>环形进度</Text>
              {partProgress.map((item) => {
                const color = item.status === 'done' ? theme.success : item.status === 'partial' ? theme.primary : theme.textDim;
                return (
                  <TouchableOpacity
                    key={item.slug}
                    style={[styles.ringRowItem, { borderColor: theme.border, backgroundColor: theme.surface }]}
                    onPress={() => {
                      setSelectedPart(item.slug);
                      setShowGuideModal(true);
                    }}>
                    <ProgressRing progress={Math.min(item.ratio, 1)} size={42} stroke={5} color={color} track={theme.border} />
                    <View style={styles.ringInfo}>
                      <Text style={[styles.ringName, { color: theme.text }]}>{PART_META[item.slug].label}</Text>
                      <Text style={[styles.ringDetail, { color: color }]}>完成 {item.done}/{item.target}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </View>
      );
    }

    if (sectionId === 'quickActions') {
      return (
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}> 
          <Text style={[styles.cardTitle, { color: theme.text }]}>设置入口</Text>
          <Text style={[styles.noteText, { color: theme.textDim }]}>支持按星期灵活设置久坐阈值与部位目标。</Text>
          <TouchableOpacity
            style={[styles.singleBtn, { borderColor: theme.primary, backgroundColor: theme.chipBg }]}
            onPress={() => router.push('/(tabs)/settings')}>
            <Text style={[styles.rowBtnText, { color: theme.primary }]}>进入设置页</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}> 
        <Text style={[styles.cardTitle, { color: theme.text }]}>工作状态分析（模拟）</Text>
        <Text style={[styles.noteText, { color: theme.textDim }]}>当前阶段：{workspaceInsight.segment}</Text>
        {workspaceInsight.issues.map((item, idx) => (
          <Text key={`issue-${idx}`} style={[styles.analysisIssue, { color: theme.warning }]}>• {item}</Text>
        ))}
        {workspaceInsight.suggestions.map((item, idx) => (
          <Text key={`action-${idx}`} style={[styles.analysisAction, { color: theme.text }]}>
            - {item}
          </Text>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}> 
      <ScrollView contentContainerStyle={[styles.scrollContent, isWide && styles.scrollContentWide]}>
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.pageTitle, { color: theme.text }]}>智能久坐与部位提醒</Text>
            <Text style={[styles.pageSubTitle, { color: theme.textDim }]}>今日方案：{DAY_LABEL[todayKey]} · 久坐阈值 {effectivePlan.limitMin} 分钟</Text>
          </View>
          <Pressable style={[styles.switchBtn, { borderColor: theme.border, backgroundColor: theme.surface }]} onPress={toggleThemeMode}>
            <Text style={[styles.switchBtnText, { color: theme.text }]}>{themeMode === 'dark' ? '深色' : '浅色'}</Text>
          </Pressable>
        </View>

        {orderedSectionIds.map((sectionId) => (
          <React.Fragment key={sectionId}>{renderSectionById(sectionId)}</React.Fragment>
        ))}
      </ScrollView>

      <Modal transparent visible={showSedentaryModal} animationType="fade" onRequestClose={() => setShowSedentaryModal(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: theme.surface, borderColor: theme.danger }]}> 
            <Text style={[styles.modalTitle, { color: theme.danger }]}>久坐强提醒</Text>
            <Text style={[styles.modalText, { color: theme.text }]}>你已达到今日久坐阈值，请立刻起身活动 30-60 秒。</Text>

            {!!selectedRecoveryGuide && (
              <View style={[styles.exerciseBox, { borderColor: theme.border, backgroundColor: theme.surfaceAlt }]}> 
                <CartoonActionPanel
                  part="sedentary"
                  frames={buildGuideFrames(selectedRecoveryGuide, 'sedentary')}
                  colors={panelColors}
                />
                <Text style={[styles.exerciseTitle, { color: theme.text }]}>{selectedRecoveryGuide.title}</Text>
                <Text style={[styles.exerciseDesc, { color: theme.textDim }]}> 
                  {selectedRecoveryGuide.goal} · {selectedRecoveryGuide.duration}
                </Text>
                {selectedRecoveryGuide.steps.map((step, idx) => (
                  <Text key={`${selectedRecoveryGuide.id}-${idx}`} style={[styles.stepText, { color: theme.textDim }]}>
                    {idx + 1}. {step}
                  </Text>
                ))}
                <Text style={[styles.exerciseTip, { color: theme.primary }]}>{selectedRecoveryGuide.cue}</Text>
                <TouchableOpacity
                  style={[styles.singleBtnSmall, { borderColor: theme.border, backgroundColor: theme.surface }]}
                  onPress={() => speakText(buildGuideVoiceText(selectedRecoveryGuide, lang))}>
                  <Text style={[styles.smallBtnText, { color: theme.text }]}>语音讲解</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.modalBtnRow}>
              <TouchableOpacity style={[styles.modalBtn, { borderColor: theme.border, backgroundColor: theme.surfaceAlt }]} onPress={() => setShowSedentaryModal(false)}>
                <Text style={[styles.modalBtnText, { color: theme.textDim }]}>稍后处理</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { borderColor: theme.primary, backgroundColor: theme.chipBg }]} onPress={completeSedentary}>
                <Text style={[styles.modalBtnText, { color: theme.primary }]}>我已起立完成</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal transparent visible={showPartReminderModal} animationType="fade" onRequestClose={() => setShowPartReminderModal(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: theme.surface, borderColor: theme.primary }]}> 
            <Text style={[styles.modalTitle, { color: theme.primary }]}>部位训练提醒</Text>
            <Text style={[styles.modalText, { color: theme.text }]}>当前优先建议：{selectedPart ? PART_META[selectedPart].label : '-'}</Text>

            {!!selectedExercise && (
              <View style={[styles.exerciseBox, { borderColor: theme.border, backgroundColor: theme.surfaceAlt }]}> 
                <CartoonActionPanel
                  part={getExerciseVisualPart(selectedExercise)}
                  frames={buildExerciseFrames(selectedExercise)}
                  colors={panelColors}
                />
                <Text style={[styles.exerciseTitle, { color: theme.text }]}>{selectedExercise.title}</Text>
                <Text style={[styles.exerciseDesc, { color: theme.textDim }]}>{selectedExercise.desc}</Text>
                <Text style={[styles.exerciseTip, { color: theme.primary }]}>{selectedExercise.tip}</Text>
                <TouchableOpacity
                  style={[styles.singleBtnSmall, { borderColor: theme.border, backgroundColor: theme.surface }]}
                  onPress={() => speakText(buildExerciseVoiceText(selectedExercise, lang))}>
                  <Text style={[styles.smallBtnText, { color: theme.text }]}>语音讲解</Text>
                </TouchableOpacity>
              </View>
            )}

            {!!selectedPart && (
              <View style={[styles.exerciseBox, { borderColor: theme.border, backgroundColor: theme.surfaceAlt }]}> 
                <Text style={[styles.exerciseTitle, { color: theme.text }]}>该部位重点动作</Text>
                {(PART_TRAINING_GUIDES[selectedPart] || []).slice(0, 2).map((guide) => (
                  <View key={guide.id} style={styles.inlineGuideItem}>
                    <Text style={[styles.inlineGuideTitle, { color: theme.text }]}>{guide.title}</Text>
                    <Text style={[styles.inlineGuideMeta, { color: theme.textDim }]}>
                      {guide.goal} · {guide.duration}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            <View style={styles.modalBtnRow}>
              <TouchableOpacity style={[styles.modalBtn, { borderColor: theme.border, backgroundColor: theme.surfaceAlt }]} onPress={() => setShowPartReminderModal(false)}>
                <Text style={[styles.modalBtnText, { color: theme.textDim }]}>忽略本次</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { borderColor: theme.primary, backgroundColor: theme.chipBg }]} onPress={completePart}>
                <Text style={[styles.modalBtnText, { color: theme.primary }]}>完成该动作 +1</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal transparent visible={showGuideModal} animationType="slide" onRequestClose={() => setShowGuideModal(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCardLarge, { backgroundColor: theme.surface, borderColor: theme.border }]}> 
            <Text style={[styles.modalTitle, { color: theme.text }]}>动作讲解：{selectedPart ? PART_META[selectedPart].label : '-'}</Text>
            <ScrollView style={{ maxHeight: 340 }}>
              {(selectedPart ? PART_TRAINING_GUIDES[selectedPart] || [] : []).map((guide) => (
                <View key={guide.id} style={[styles.guideItem, { borderColor: theme.border, backgroundColor: theme.surfaceAlt }]}> 
                  <CartoonActionPanel
                    part={selectedPart ? getExerciseVisualPart({ targetSlug: selectedPart }) : getGuideVisualPart(guide)}
                    frames={buildGuideFrames(guide, selectedPart ? getExerciseVisualPart({ targetSlug: selectedPart }) : undefined)}
                    colors={panelColors}
                  />
                  <Text style={[styles.exerciseTitle, { color: theme.text }]}>{guide.title}</Text>
                  <Text style={[styles.exerciseDesc, { color: theme.textDim }]}>{guide.goal} · {guide.duration}</Text>
                  {guide.steps.map((step, idx) => (
                    <Text key={`${guide.id}-${idx}`} style={[styles.stepText, { color: theme.textDim }]}>
                      {idx + 1}. {step}
                    </Text>
                  ))}
                  <Text style={[styles.exerciseTip, { color: theme.primary }]}>{guide.cue}</Text>
                  <TouchableOpacity
                    style={[styles.singleBtnSmall, { borderColor: theme.border, backgroundColor: theme.surface }]}
                    onPress={() => speakText(buildGuideVoiceText(guide, lang))}>
                    <Text style={[styles.smallBtnText, { color: theme.text }]}>语音讲解</Text>
                  </TouchableOpacity>
                </View>
              ))}

              {selectedExercises.map((item) => (
                <View key={item.id} style={[styles.guideItem, { borderColor: theme.border, backgroundColor: theme.surfaceAlt }]}> 
                  <CartoonActionPanel
                    part={getExerciseVisualPart(item)}
                    frames={buildExerciseFrames(item)}
                    colors={panelColors}
                  />
                  <Text style={[styles.exerciseTitle, { color: theme.text }]}>{item.title}</Text>
                  <Text style={[styles.exerciseDesc, { color: theme.textDim }]}>{item.desc}</Text>
                  <Text style={[styles.exerciseTip, { color: theme.primary }]}>{item.tip}</Text>
                  <TouchableOpacity
                    style={[styles.singleBtnSmall, { borderColor: theme.border, backgroundColor: theme.surface }]}
                    onPress={() => speakText(buildExerciseVoiceText(item, lang))}>
                    <Text style={[styles.smallBtnText, { color: theme.text }]}>语音讲解</Text>
                  </TouchableOpacity>
                </View>
              ))}

              {!selectedExercises.length && <Text style={[styles.emptyText, { color: theme.textDim }]}>该部位暂未配置动作。</Text>}
            </ScrollView>
            <View style={styles.modalBtnRow}>
              <TouchableOpacity style={[styles.modalBtn, { borderColor: theme.primary, backgroundColor: theme.chipBg }]} onPress={() => setShowGuideModal(false)}>
                <Text style={[styles.modalBtnText, { color: theme.primary }]}>关闭</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 30, gap: 12 },
  scrollContentWide: { maxWidth: 1160, width: '100%', alignSelf: 'center' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10 },
  pageTitle: { fontSize: 22, fontWeight: '800' },
  pageSubTitle: { marginTop: 4, fontSize: 12 },
  switchBtn: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  switchBtnText: { fontSize: 12, fontWeight: '700' },

  card: { borderWidth: 1, borderRadius: 16, padding: 14, gap: 10 },
  gradientCard: {
    boxShadow: '0px 4px 10px rgba(0,212,255,0.12)',
  },
  cardTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 16, fontWeight: '800' },
  priorityText: { fontSize: 11, fontWeight: '800' },
  noteText: { fontSize: 12 },

  timerCard: { borderWidth: 1, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 14 },
  cardLabel: { fontSize: 12, fontWeight: '600' },
  timerContainer: { marginTop: 6, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  timerValue: { fontSize: 42, fontWeight: '900' },
  timerColon: { fontSize: 34, fontWeight: '700', marginHorizontal: 6 },
  timerStatus: { marginTop: 6, textAlign: 'center', fontSize: 12, fontWeight: '600' },

  recoveryCard: { borderWidth: 1, borderRadius: 12, padding: 10, gap: 4 },
  recoveryTitle: { fontSize: 14, fontWeight: '800' },
  recoveryMeta: { fontSize: 12, fontWeight: '700' },
  recoveryTip: { fontSize: 12 },

  nextCard: { borderWidth: 1, borderRadius: 12, padding: 10, gap: 2 },
  nextTitle: { fontSize: 13, fontWeight: '700' },
  nextDesc: { fontSize: 12 },
  nudgeCard: { borderWidth: 1, borderRadius: 12, padding: 10, gap: 8 },
  nudgeTitle: { fontSize: 13, fontWeight: '800' },
  nudgeText: { fontSize: 12, lineHeight: 18 },
  nudgeBtnRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  nudgeBtn: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7 },
  nudgeBtnText: { fontSize: 11, fontWeight: '700' },

  rowBtnWrap: { flexDirection: 'row', gap: 10 },
  rowBtn: { flex: 1, borderWidth: 1, borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  rowBtnText: { fontWeight: '700', fontSize: 13 },
  singleBtn: { borderWidth: 1, borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  singleBtnSmall: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  smallBtnText: { fontSize: 11, fontWeight: '700' },

  summaryRow: { flexDirection: 'row', gap: 8 },
  summaryCard: { flex: 1, borderWidth: 1, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 10 },
  summaryLabel: { fontSize: 11, marginBottom: 6 },
  summaryValue: { fontSize: 20, fontWeight: '800' },

  overviewRow: { gap: 10, paddingBottom: 2 },
  overviewPane: {
    width: 300,
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    gap: 8,
  },
  overviewTitle: { fontSize: 14, fontWeight: '800' },
  bodyWrap: { alignItems: 'center', justifyContent: 'center' },
  legendRow: { flexDirection: 'row', gap: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 999 },
  legendText: { fontSize: 11 },

  ringRowItem: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  ringInfo: { flex: 1 },
  ringName: { fontSize: 13, fontWeight: '700' },
  ringDetail: { fontSize: 12, marginTop: 2, fontWeight: '700' },

  analysisIssue: { fontSize: 12, lineHeight: 18 },
  analysisAction: { fontSize: 12, lineHeight: 18 },

  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', paddingHorizontal: 18 },
  modalCard: { borderWidth: 1, borderRadius: 14, padding: 16, gap: 10 },
  modalCardLarge: { borderWidth: 1, borderRadius: 14, padding: 16, gap: 10, maxHeight: '82%' },
  modalTitle: { fontSize: 18, fontWeight: '800' },
  modalText: { fontSize: 14, lineHeight: 20 },
  modalBtnRow: { flexDirection: 'row', gap: 10, marginTop: 6 },
  modalBtn: { flex: 1, borderWidth: 1, borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  modalBtnText: { fontWeight: '700' },

  exerciseBox: { borderWidth: 1, borderRadius: 10, padding: 10, gap: 6 },
  exerciseTitle: { fontSize: 14, fontWeight: '700' },
  exerciseDesc: { fontSize: 12, lineHeight: 18 },
  exerciseTip: { fontSize: 12, fontWeight: '700' },
  stepText: { fontSize: 12, lineHeight: 18 },

  inlineGuideItem: { marginTop: 6 },
  inlineGuideTitle: { fontSize: 13, fontWeight: '700' },
  inlineGuideMeta: { fontSize: 12 },

  guideItem: { borderWidth: 1, borderRadius: 10, padding: 10, marginBottom: 8 },
  emptyText: { textAlign: 'center', marginVertical: 20 },
});
