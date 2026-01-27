import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Modal, TextInput, Platform, ScrollView, Animated, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Audio } from 'expo-av';
import BodyHighlighter from 'react-native-body-highlighter';
import * as Notifications from 'expo-notifications';
import { EXERCISE_DATA, Exercise } from '../../constants/data';
import { useStorage, BodyPartSlug } from '../../hooks/useStorage';

const TRANSLATIONS = {
  zh: {
    brand: "BIOMECH GUARD",
    subtitle: "机能监控在线",
    settings: "控制台",
    heatmapTitle: "肌群激活状态",
    rotate: "切换视角",
    timerTitle: "久坐计时",
    sitting: "静止时间",
    alarm: "超负荷警告",
    stands: "今日起立",
    target: "目标",
    missionNext: "推荐任务",
    missionAlarm: "立即执行",
    missionDone: "我已完成",
    missionStop: "停止报警 & 打卡",
    progress: "进度",
    modalTitle: "系统控制台",
    limitLabel: "久坐阈值 (分钟)",
    targetLabel: "每日部位目标 (次)",
    btnCancel: "取消",
    btnSave: "保存配置",
    parts: { neck: "颈部", shoulder: "肩部", "lower-back": "腰背", core: "核心", gluteal: "臀部", leg: "腿部" },
    tips: { tip: "战术提示" },
    muscleModal: { title: "机能诊断报告", count: "分类总进度", actions: "推荐方案", empty: "暂无针对此部位的特定动作" }
  },
  en: {
    brand: "BIOMECH GUARD",
    subtitle: "SYSTEM ONLINE",
    settings: "CONSOLE",
    heatmapTitle: "MUSCLE STATUS",
    rotate: "ROTATE VIEW",
    timerTitle: "SESSION TIMER",
    sitting: "SITTING TIME",
    alarm: "CRITICAL OVERLOAD",
    stands: "STANDS",
    target: "TARGET",
    missionNext: "NEXT PROTOCOL",
    missionAlarm: "IMMINENT THREAT",
    missionDone: "EXECUTE PROTOCOL",
    missionStop: "DISENGAGE & LOG",
    progress: "PROGRESS",
    modalTitle: "SYSTEM CONSOLE",
    limitLabel: "SITTING LIMIT (MIN)",
    targetLabel: "DAILY TARGETS (REPS)",
    btnCancel: "CANCEL",
    btnSave: "SAVE CHANGES",
    parts: { neck: "NECK", shoulder: "SHLDR", "lower-back": "BACK", core: "CORE", gluteal: "GLUTE", leg: "LEGS" },
    tips: { tip: "TACTICAL TIP" },
    muscleModal: { title: "DIAGNOSTIC REPORT", count: "CATEGORY PROGRESS", actions: "RECOMMENDED PROTOCOLS", empty: "No specific protocols for this sector." }
  }
};

const THEME = {
  bg: '#050a10',
  cardBg: 'rgba(21, 32, 48, 0.9)',
  primary: '#00f3ff',    // 进行中 (青色)
  completed: '#39ff14',  // 已达标 (荧光绿)
  primaryDim: 'rgba(0, 243, 255, 0.15)',
  danger: '#ff2a2a',
  text: '#ffffff',
  textDim: '#8b9bb4',
  border: 'rgba(0, 243, 255, 0.3)',
};

if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({ shouldShowAlert: true, shouldPlaySound: true, shouldSetBadge: false } as any),
  });
}

// [核心修复] 肌肉 -> 大类指标 映射表
// 确保人体图上的每一个色块都能找到对应的 KPI
const MUSCLE_MAP: Record<string, BodyPartSlug> = {
  // 颈部
  'neck': 'neck',
  'sternocleidomastoid': 'neck',
  'trapezius': 'neck', // 斜方肌上束归为颈部压力
  // 肩部
  'deltoids': 'shoulder',
  'pectorals': 'shoulder', // 胸肌紧会导致圆肩，归为肩部管理
  // 腰背
  'upper-back': 'lower-back', // 简化处理，统称背部
  'lower-back': 'lower-back',
  // 核心
  'rectus-abdominis': 'core',
  'obliques': 'core',
  // 臀部
  'gluteal': 'gluteal',
  'abductors': 'gluteal',
  // 腿部
  'hamstring': 'leg',
  'quadriceps': 'leg',
  'calves': 'leg',
  'tibialis': 'leg'
};

const ProgressBar = ({ label, current, target }: { label: string, current: number, target: number }) => {
  const isCompleted = current >= target;
  const progress = Math.min(current / target, 1) * 100;
  const color = isCompleted ? THEME.completed : THEME.primary;

  return (
      <View style={styles.progressRow}>
        <View style={styles.progressLabelBox}>
          <Text style={styles.progressLabel}>{label}</Text>
          <Text style={[styles.progressValue, { color: color }]}>{current}/{target}</Text>
        </View>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${progress}%`, backgroundColor: color }]} />
        </View>
      </View>
  );
};

export default function Dashboard() {
  const { settings, saveSettings, isSosMode, muscleProgress, finishExercise, lang, toggleLang } = useStorage();
  const t = TRANSLATIONS[lang];

  const [seconds, setSeconds] = useState(0);
  const [isAlarm, setIsAlarm] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showMuscleModal, setShowMuscleModal] = useState(false);
  const [bodySide, setBodySide] = useState<'front' | 'back'>('back');
  const [selectedMuscle, setSelectedMuscle] = useState<{slug: string, name: string} | null>(null);
  const [formLimit, setFormLimit] = useState('');
  const [formTargets, setFormTargets] = useState<Record<string, string>>({});

  const soundRef = useRef<Audio.Sound | null>(null);
  const pulseAnim = useRef(new Animated.Value(0)).current;

  // 1. 任务推荐
  const currentMission = useMemo(() => {
    const parts: BodyPartSlug[] = ['neck', 'shoulder', 'lower-back', 'core', 'gluteal', 'leg'];
    const sortedParts = parts.sort((a, b) => {
      const rateA = (muscleProgress[a] || 0) / (settings.targets[a] || 1);
      const rateB = (muscleProgress[b] || 0) / (settings.targets[b] || 1);
      return rateA - rateB;
    });
    const targetPart = sortedParts[0];
    const availableExercises = EXERCISE_DATA.filter(ex =>
        ex.targetSlug === targetPart && (!isSosMode || ex.isSosSafe)
    );
    return availableExercises[Math.floor(Math.random() * availableExercises.length)] || availableExercises[0];
  }, [muscleProgress, settings.targets, isSosMode]);

  // 2. [核心修复] 热力图逻辑：颜色与总指标严格同步
  const heatmapData = useMemo(() => {
    const map: any = [];

    // 遍历所有已定义的肌肉映射
    Object.keys(MUSCLE_MAP).forEach(muscleSlug => {
      const targetSlug = MUSCLE_MAP[muscleSlug];

      // 获取该大类（如颈部）的总进度
      const categoryTotal = muscleProgress[targetSlug] || 0;
      const categoryTarget = settings.targets[targetSlug] || 5;

      // 只要该大类有开始练 (>0)，相关的所有肌肉都应该亮起来
      if (categoryTotal > 0) {
        const isCompleted = categoryTotal >= categoryTarget;

        map.push({
          slug: muscleSlug,
          // 颜色：大类达标即全绿
          color: isCompleted ? THEME.completed : THEME.primary,
          // 亮度：未达标时随进度增加，达标后最亮
          intensity: isCompleted ? 1 : Math.max(0.4, Math.min(categoryTotal / categoryTarget, 0.9))
        });
      }
    });
    return map;
  }, [muscleProgress, settings.targets]);

  const selectedMuscleExercises = useMemo(() => {
    if (!selectedMuscle) return [];
    // 弹窗里的推荐动作：根据点击肌肉所属的大类来推荐，而不是仅限于该肌肉
    const target = MUSCLE_MAP[selectedMuscle.slug];
    if (target) {
      return EXERCISE_DATA.filter(ex => ex.targetSlug === target);
    }
    return EXERCISE_DATA.filter(ex => ex.bodyPartSlug.includes(selectedMuscle.slug));
  }, [selectedMuscle]);

  const limitSec = (settings.limitMin || 45) * 60;

  useEffect(() => {
    if (isAlarm) {
      Animated.loop(
          Animated.sequence([
            Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: false }),
            Animated.timing(pulseAnim, { toValue: 0, duration: 800, useNativeDriver: false }),
          ])
      ).start();
    } else {
      pulseAnim.setValue(0);
      pulseAnim.stopAnimation();
    }
  }, [isAlarm]);

  const backgroundColor = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [THEME.bg, '#310a0a']
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds(s => {
        const next = s + 1;
        if (next >= limitSec && !isAlarm) triggerAlarm();
        return next;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [limitSec, isAlarm]);

  const triggerAlarm = async () => {
    setIsAlarm(true);
    try {
      const { sound } = await Audio.Sound.createAsync(
          { uri: 'https://cdn.freesound.org/previews/337/337049_3232293-lq.mp3' } as any,
          { shouldPlay: true, isLooping: true } as any
      );
      soundRef.current = sound;
      await sound.playAsync();
    } catch(e) {}

    if (Platform.OS === 'web') {
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification(t.alarm, { body: t.missionAlarm });
      }
      return;
    }
    await Notifications.scheduleNotificationAsync({
      content: { title: t.alarm, body: t.missionAlarm, sound: true },
      trigger: null,
    });
  };

  const handleMusclePress = (muscle: { slug: string, name: string }) => {
    setSelectedMuscle(muscle);
    setShowMuscleModal(true);
  };

  const handleQuickComplete = (exercise: Exercise) => {
    finishExercise(exercise.bodyPartSlug, exercise.targetSlug);
    setShowMuscleModal(false);
  };

  const handleCompleteMission = () => {
    setIsAlarm(false);
    setSeconds(0);
    if (soundRef.current) (soundRef.current as any).stopAsync?.();
    if (currentMission) {
      finishExercise(currentMission.bodyPartSlug, currentMission.targetSlug);
    }
  };

  const openSettings = () => {
    setFormLimit(settings.limitMin.toString());
    const newTargets: any = {};
    Object.keys(settings.targets).forEach(key => {
      newTargets[key] = settings.targets[key as BodyPartSlug].toString();
    });
    setFormTargets(newTargets);
    setShowSettings(true);
  };

  const handleSaveSettings = () => {
    const parsedTargets: any = {};
    Object.keys(formTargets).forEach(key => {
      parsedTargets[key] = parseInt(formTargets[key]) || 3;
    });
    saveSettings({
      limitMin: parseInt(formLimit) || 45,
      targets: parsedTargets
    });
    setShowSettings(false);
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return { m, s };
  };
  const timeDisplay = formatTime(seconds);

  const partColors: Record<string, string> = {
    neck: '#00d4ff', shoulder: '#00d4ff', 'lower-back': '#00d4ff',
    core: '#00d4ff', gluteal: '#00d4ff', leg: '#00d4ff'
  };

  return (
      <Animated.View style={[styles.container, { backgroundColor: backgroundColor as any }]}>
        <SafeAreaView style={{flex: 1}}>
          <StatusBar barStyle="light-content" />

          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.brand}>{t.brand}</Text>
              <Text style={styles.brandSub}>{t.subtitle}</Text>
            </View>
            <View style={{flexDirection: 'row', gap: 10}}>
              <TouchableOpacity onPress={toggleLang} style={styles.langBtn}>
                <Text style={styles.btnTextSmall}>{lang === 'zh' ? 'EN' : 'CN'}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={openSettings} style={styles.settingBtn}>
                <Text style={styles.btnTextSmall}>{t.settings}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

            <View style={styles.dashboardRow}>
              {/* Heatmap Area */}
              <View style={styles.heatmapCard}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardLabel}>{t.heatmapTitle}</Text>
                  <TouchableOpacity onPress={() => setBodySide(prev => prev === 'front' ? 'back' : 'front')} style={styles.rotateBtn}>
                    <Text style={styles.rotateText}>↻ {t.rotate}</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.heatmapWrapper}>
                  <BodyHighlighter
                      data={heatmapData}
                      side={bodySide}
                      scale={1.35}
                      onMusclePress={handleMusclePress}
                  />
                </View>

                <View style={styles.legendContainer}>
                  <View style={{flexDirection:'row', alignItems:'center', gap:4}}>
                    <View style={{width:8, height:8, backgroundColor: THEME.primary, borderRadius:4}}/>
                    <Text style={{color: THEME.textDim, fontSize:9}}>Working</Text>
                  </View>
                  <View style={{flexDirection:'row', alignItems:'center', gap:4}}>
                    <View style={{width:8, height:8, backgroundColor: THEME.completed, borderRadius:4}}/>
                    <Text style={{color: THEME.textDim, fontSize:9}}>Target Met</Text>
                  </View>
                </View>
              </View>

              {/* Right Column */}
              <View style={styles.rightColumn}>
                <View style={styles.timerCard}>
                  <Text style={styles.cardLabel}>{t.timerTitle}</Text>
                  <View style={styles.timerContainer}>
                    <Text style={[styles.timerValue, isAlarm && {color: THEME.danger}]}>{timeDisplay.m}</Text>
                    <Text style={[styles.timerColon, isAlarm && {color: THEME.danger}]}>:</Text>
                    <Text style={[styles.timerValue, isAlarm && {color: THEME.danger}]}>{timeDisplay.s}</Text>
                  </View>
                  <Text style={[styles.timerStatus, isAlarm && {color: THEME.danger}]}>
                    {isAlarm ? t.alarm : t.sitting}
                  </Text>
                </View>

                <View style={styles.metricsCard}>
                  <Text style={[styles.cardLabel, {marginBottom: 10}]}>{t.targetLabel}</Text>
                  <View style={styles.metricsGrid}>
                    {Object.keys(settings.targets).map((key) => (
                        <View key={key} style={styles.metricItem}>
                          <ProgressBar
                              label={t.parts[key as BodyPartSlug]}
                              current={muscleProgress[key]||0}
                              target={settings.targets[key as BodyPartSlug]}
                          />
                        </View>
                    ))}
                  </View>
                </View>
              </View>
            </View>

            {/* Mission Card */}
            <View style={[styles.missionCard, isAlarm && styles.missionCardAlarm]}>
              <View style={[styles.decorLine, isAlarm && { backgroundColor: THEME.danger }]} />
              <View style={styles.missionHeader}>
                <View style={[styles.tag, isAlarm ? styles.tagDanger : styles.tagPrimary]}>
                  <Text style={[styles.tagText, isAlarm && { color: '#000' }]}>{isAlarm ? t.missionAlarm : t.missionNext}</Text>
                </View>
                <Text style={styles.missionProgress}>
                  {t.progress}: {muscleProgress[currentMission?.targetSlug] || 0} / {settings.targets[currentMission?.targetSlug] || 3}
                </Text>
              </View>

              {/* [UI升级] 字体再次加大 */}
              <Text style={styles.missionTitle}>
                {lang === 'zh' ? currentMission?.title : currentMission?.titleEn}
              </Text>
              <Text style={styles.missionDesc}>
                {lang === 'zh' ? currentMission?.desc : currentMission?.descEn}
              </Text>

              <View style={styles.tipBox}>
                <Text style={styles.tipLabel}>{t.tips.tip}:</Text>
                <Text style={styles.missionTip}>
                  {lang === 'zh' ? currentMission?.tip : currentMission?.tipEn}
                </Text>
              </View>
              <TouchableOpacity
                  style={[styles.actionBtn, isAlarm && styles.actionBtnAlarm]}
                  onPress={handleCompleteMission}
                  activeOpacity={0.8}
              >
                <Text style={[styles.actionBtnText, isAlarm && { color: THEME.danger }]}>
                  {isAlarm ? t.missionStop : t.missionDone}
                </Text>
              </TouchableOpacity>
            </View>

          </ScrollView>

          {/* Settings Modal */}
          <Modal visible={showSettings} transparent animationType="fade">
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>{t.modalTitle}</Text>
                <Text style={styles.inputLabel}>{t.limitLabel}</Text>
                <TextInput style={styles.input} value={formLimit} onChangeText={setFormLimit} keyboardType="numeric" />
                <Text style={styles.groupTitle}>{t.targetLabel}</Text>
                <View style={styles.grid}>
                  {Object.keys(formTargets).map(key => (
                      <View key={key} style={styles.gridItem}>
                        <Text style={styles.inputLabel}>{t.parts[key as BodyPartSlug]}</Text>
                        <TextInput style={styles.inputSmall} value={formTargets[key]} onChangeText={txt => setFormTargets({...formTargets, [key]: txt})} keyboardType="numeric" />
                      </View>
                  ))}
                </View>
                <View style={styles.modalBtns}>
                  <TouchableOpacity style={styles.btnCancel} onPress={()=>setShowSettings(false)}><Text style={{color: THEME.textDim, fontWeight: 'bold'}}>{t.btnCancel}</Text></TouchableOpacity>
                  <TouchableOpacity style={styles.btnSave} onPress={handleSaveSettings}><Text style={{color: '#000', fontWeight:'bold'}}>{t.btnSave}</Text></TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

          {/* Muscle Modal */}
          <Modal visible={showMuscleModal} transparent animationType="slide" onRequestClose={()=>setShowMuscleModal(false)}>
            <View style={styles.bottomSheetOverlay}>
              <View style={styles.bottomSheetContent}>
                <View style={styles.sheetHeader}>
                  <View>
                    <Text style={styles.sheetTitle}>{t.muscleModal.title}</Text>
                    <Text style={styles.sheetSub}>{selectedMuscle?.name.toUpperCase()}</Text>
                  </View>
                  <View style={styles.sheetStat}>
                    <Text style={styles.sheetStatLabel}>{t.muscleModal.count}</Text>
                    {/* 弹窗里也显示大类总进度，逻辑闭环 */}
                    <Text style={[styles.sheetStatValue, (muscleProgress[MUSCLE_MAP[selectedMuscle?.slug || ''] || ''] || 0) >= (settings.targets[MUSCLE_MAP[selectedMuscle?.slug || ''] as BodyPartSlug]||5) ? {color: THEME.completed} : {color: THEME.primary}]}>
                      {muscleProgress[MUSCLE_MAP[selectedMuscle?.slug || ''] || ''] || 0}
                    </Text>
                  </View>
                </View>
                <View style={styles.sheetDivider}/>
                <Text style={styles.sheetSectionTitle}>{t.muscleModal.actions}</Text>
                <FlatList
                    data={selectedMuscleExercises}
                    keyExtractor={item => item.id}
                    style={{maxHeight: 300}}
                    ListEmptyComponent={<Text style={styles.emptyText}>{t.muscleModal.empty}</Text>}
                    renderItem={({item}) => (
                        <TouchableOpacity style={styles.exerciseRow} onPress={() => handleQuickComplete(item)}>
                          <View style={{flex: 1}}>
                            <Text style={styles.exTitle}>{lang === 'zh' ? item.title : item.titleEn}</Text>
                            <Text style={styles.exDesc} numberOfLines={1}>{lang === 'zh' ? item.tip : item.tipEn}</Text>
                          </View>
                          <View style={styles.playIcon}>
                            <Text style={{color: THEME.primary, fontSize: 10, fontWeight: 'bold'}}>DO IT</Text>
                          </View>
                        </TouchableOpacity>
                    )}
                />
                <TouchableOpacity style={styles.closeSheetBtn} onPress={()=>setShowMuscleModal(false)}>
                  <Text style={styles.closeSheetText}>{t.btnCancel}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

        </SafeAreaView>
      </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.bg },
  header: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  brand: { color: THEME.primary, fontSize: 18, fontWeight: '900', letterSpacing: 1 },
  brandSub: { color: THEME.textDim, fontSize: 10, letterSpacing: 2, marginTop: 2 },
  langBtn: { paddingVertical: 6, paddingHorizontal: 12, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 4, borderWidth: 1, borderColor: THEME.border },
  settingBtn: { paddingVertical: 6, paddingHorizontal: 12, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 4, borderWidth: 1, borderColor: THEME.border },
  btnTextSmall: { color: THEME.primary, fontSize: 10, fontWeight: 'bold' },
  scrollContent: { padding: 20 },

  dashboardRow: { flexDirection: 'row', height: 400, marginBottom: 20, gap: 12 },

  heatmapCard: { flex: 1.5, backgroundColor: THEME.cardBg, borderRadius: 16, padding: 12, borderWidth: 1, borderColor: THEME.border, overflow: 'hidden' },
  heatmapWrapper: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: -20 },
  legendContainer: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginTop: -10 },
  cardLabel: { color: THEME.textDim, fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 10, zIndex: 10 },
  rotateBtn: { padding: 4, borderWidth: 1, borderColor: THEME.textDim, borderRadius: 4 },
  rotateText: { color: THEME.textDim, fontSize: 9, fontWeight: 'bold' },
  hintText: { color: THEME.textDim, fontSize: 9, textAlign: 'center', marginTop: 5, fontStyle: 'italic' },

  rightColumn: { flex: 1, gap: 12 },
  timerCard: { flex: 0.8, backgroundColor: THEME.cardBg, borderRadius: 16, padding: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: THEME.border },
  timerContainer: { flexDirection: 'row', alignItems: 'baseline', marginTop: 5 },
  timerValue: { fontSize: 36, fontWeight: 'bold', color: THEME.primary, fontVariant: ['tabular-nums'] },
  timerColon: { fontSize: 32, fontWeight: 'bold', color: THEME.textDim, marginHorizontal: 2 },
  timerStatus: { fontSize: 9, color: THEME.textDim, marginTop: 4, letterSpacing: 1 },
  metricsCard: { flex: 1.2, backgroundColor: THEME.cardBg, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: THEME.border },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 12 },
  metricItem: { width: '48%' },
  progressRow: { gap: 4 },
  progressLabelBox: { flexDirection: 'row', justifyContent: 'space-between' },
  progressLabel: { color: THEME.textDim, fontSize: 9 },
  progressValue: { color: THEME.text, fontSize: 9, fontWeight: 'bold' },
  track: { height: 4, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 2 },

  missionCard: { backgroundColor: THEME.cardBg, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: THEME.border, overflow: 'hidden', minHeight: 220 },
  missionCardAlarm: { borderColor: THEME.danger, backgroundColor: '#1f0a0a' },
  decorLine: { position: 'absolute', top: 0, left: 0, right: 0, height: 2, backgroundColor: THEME.primary },
  missionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  tag: { paddingVertical: 4, paddingHorizontal: 8, borderRadius: 4 },
  tagPrimary: { backgroundColor: THEME.primaryDim },
  tagDanger: { backgroundColor: THEME.danger },
  tagText: { color: THEME.primary, fontSize: 10, fontWeight: 'bold' },
  missionProgress: { color: THEME.textDim, fontSize: 10 },

  // [字体再次优化]
  missionTitle: { color: '#fff', fontSize: 28, fontWeight: 'bold', marginBottom: 12, lineHeight: 32 },
  missionDesc: { color: '#d0dbe6', fontSize: 17, lineHeight: 26, marginBottom: 20 },

  tipBox: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.03)', padding: 14, borderRadius: 8, marginBottom: 24, gap: 8 },
  tipLabel: { color: THEME.primary, fontSize: 12, fontWeight: 'bold' },
  missionTip: { color: THEME.textDim, fontSize: 12, fontStyle: 'italic', flex: 1, lineHeight: 18 },

  actionBtn: { backgroundColor: THEME.primary, paddingVertical: 18, borderRadius: 8, alignItems: 'center' },
  actionBtnAlarm: { backgroundColor: '#fff' },
  actionBtnText: { color: '#000', fontWeight: '900', fontSize: 18, letterSpacing: 1 },

  // Shared Modal (Styles unchanged)
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', padding: 24 },
  modalContent: { backgroundColor: '#0f1926', borderRadius: 16, padding: 24, borderWidth: 1, borderColor: THEME.border },
  modalTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  inputLabel: { color: THEME.primary, fontSize: 10, marginBottom: 5, fontWeight: 'bold' },
  input: { backgroundColor: '#050a10', color: '#fff', padding: 10, borderRadius: 6, marginBottom: 15, borderWidth: 1, borderColor: THEME.border },
  groupTitle: { color: '#fff', fontSize: 12, fontWeight: 'bold', marginTop: 10, marginBottom: 10, borderBottomWidth: 1, borderBottomColor: THEME.border, paddingBottom: 5 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  gridItem: { width: '48%', marginBottom: 12 },
  inputSmall: { backgroundColor: '#050a10', color: '#fff', padding: 10, borderRadius: 6, borderWidth: 1, borderColor: THEME.border, textAlign: 'center', fontWeight: 'bold' },
  modalBtns: { flexDirection: 'row', marginTop: 20, gap: 12 },
  btnCancel: { flex: 1, padding: 12, backgroundColor: '#050a10', borderRadius: 6, alignItems: 'center', borderWidth: 1, borderColor: THEME.border },
  btnSave: { flex: 1, padding: 12, backgroundColor: THEME.primary, borderRadius: 6, alignItems: 'center' },

  // Bottom Sheet Modal
  bottomSheetOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  bottomSheetContent: { backgroundColor: '#0f1926', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, borderWidth: 1, borderColor: THEME.border, minHeight: 400 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  sheetTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  sheetSub: { color: THEME.primary, fontSize: 12, fontWeight: 'bold', letterSpacing: 1 },
  sheetStat: { alignItems: 'flex-end' },
  sheetStatLabel: { color: THEME.textDim, fontSize: 10 },
  sheetStatValue: { color: THEME.primary, fontSize: 24, fontWeight: 'bold' },
  sheetDivider: { height: 1, backgroundColor: THEME.border, marginBottom: 20 },
  sheetSectionTitle: { color: THEME.textDim, fontSize: 10, marginBottom: 10, fontWeight: 'bold' },
  exerciseRow: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.03)', padding: 16, borderRadius: 8, marginBottom: 10, alignItems: 'center', justifyContent: 'space-between' },
  exTitle: { color: '#fff', fontSize: 14, fontWeight: 'bold', marginBottom: 4 },
  exDesc: { color: THEME.textDim, fontSize: 11 },
  playIcon: { paddingVertical: 6, paddingHorizontal: 10, backgroundColor: 'rgba(0, 243, 255, 0.1)', borderRadius: 4, borderWidth: 1, borderColor: THEME.primary },
  emptyText: { color: THEME.textDim, textAlign: 'center', marginTop: 20, fontStyle: 'italic' },
  closeSheetBtn: { marginTop: 20, padding: 16, backgroundColor: '#050a10', borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: THEME.border },
  closeSheetText: { color: THEME.textDim, fontWeight: 'bold' }
});