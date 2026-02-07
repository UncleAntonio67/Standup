import React, { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DraggableFlatList, { RenderItemParams } from 'react-native-draggable-flatlist';

import { APP_THEME } from '../../constants/app-theme';
import { PART_ORDER, PART_META } from '../../constants/part-meta';
import { useAuth } from '../../hooks/auth-context';
import { AlertLevel, HomeLayoutSectionId, PartNudgeProfile, UserSettings, WEEKDAY_KEYS, WeekdayKey, getWeekdayKey, useStorage } from '../../hooks/useStorage';

const DAY_LABEL: Record<WeekdayKey, string> = {
  mon: '周一',
  tue: '周二',
  wed: '周三',
  thu: '周四',
  fri: '周五',
  sat: '周六',
  sun: '周日',
};

const LAYOUT_LABEL: Record<HomeLayoutSectionId, string> = {
  sedentary: '久坐提醒',
  partReminder: '部位提醒',
  summary: '今日总览',
  bodyOverview: '体态与进度',
  workspaceInsight: '工作状态分析',
  quickActions: '快速操作',
};

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
const toNumber = (v: string, fallback: number) => {
  const n = Number(v.replace(/[^\d]/g, ''));
  return Number.isFinite(n) ? n : fallback;
};

const NUDGE_PROFILE_LABEL: Record<PartNudgeProfile, string> = {
  gentle: '保守',
  balanced: '平衡',
  active: '积极',
};

export default function SettingsScreen() {
  const { user, logout } = useAuth();
  const {
    settings,
    saveSettings,
    themeMode,
    toggleThemeMode,
    isSosMode,
    toggleSosMode,
    lang,
    toggleLang,
    clearTodayProgress,
    homeLayoutOrder,
    saveHomeLayoutOrder,
  } = useStorage();
  const theme = APP_THEME[themeMode];

  const [draft, setDraft] = useState<UserSettings>(settings);
  const [selectedDay, setSelectedDay] = useState<WeekdayKey>(getWeekdayKey());
  const [layoutDraft, setLayoutDraft] = useState<HomeLayoutSectionId[]>(homeLayoutOrder);

  useEffect(() => {
    setDraft(settings);
  }, [settings]);

  useEffect(() => {
    setLayoutDraft(homeLayoutOrder);
  }, [homeLayoutOrder]);

  const partRows = useMemo(() => PART_ORDER.map((key) => ({ key, label: PART_META[key].label })), []);

  const currentPlan = draft.useDailyPlan
    ? draft.dailyPlans[selectedDay]
    : { limitMin: draft.limitMin, targets: draft.targets };

  const updateCurrentPlanLimit = (value: string) => {
    const limitMin = clamp(toNumber(value, currentPlan.limitMin), 10, 180);

    if (!draft.useDailyPlan) {
      setDraft((p) => ({ ...p, limitMin }));
      return;
    }

    setDraft((p) => ({
      ...p,
      dailyPlans: {
        ...p.dailyPlans,
        [selectedDay]: {
          ...p.dailyPlans[selectedDay],
          limitMin,
        },
      },
    }));
  };

  const updateCurrentPlanTarget = (part: (typeof PART_ORDER)[number], value: string) => {
    const normalized = clamp(toNumber(value, currentPlan.targets[part]), 1, 30);

    if (!draft.useDailyPlan) {
      setDraft((p) => ({
        ...p,
        targets: {
          ...p.targets,
          [part]: normalized,
        },
      }));
      return;
    }

    setDraft((p) => ({
      ...p,
      dailyPlans: {
        ...p.dailyPlans,
        [selectedDay]: {
          ...p.dailyPlans[selectedDay],
          targets: {
            ...p.dailyPlans[selectedDay].targets,
            [part]: normalized,
          },
        },
      },
    }));
  };

  const applyCurrentToAllDays = () => {
    const source = draft.useDailyPlan ? draft.dailyPlans[selectedDay] : { limitMin: draft.limitMin, targets: draft.targets };

    setDraft((p) => ({
      ...p,
      limitMin: source.limitMin,
      targets: { ...source.targets },
      dailyPlans: WEEKDAY_KEYS.reduce((acc, day) => {
        acc[day] = {
          limitMin: source.limitMin,
          targets: { ...source.targets },
        };
        return acc;
      }, {} as UserSettings['dailyPlans']),
    }));

    Alert.alert('已复制', '当前日配置已复制到全部日期。');
  };

  const saveAllSettings = async () => {
    const normalized: UserSettings = {
      ...draft,
      partReminderMin: clamp(toNumber(String(draft.partReminderMin), settings.partReminderMin), 1, 60),
      partNudgeProfile: draft.partNudgeProfile,
      partNudgeSoftThreshold: clamp(toNumber(String(draft.partNudgeSoftThreshold), settings.partNudgeSoftThreshold), 20, 95),
      partNudgeConfirmThreshold: clamp(
        toNumber(String(draft.partNudgeConfirmThreshold), settings.partNudgeConfirmThreshold),
        clamp(toNumber(String(draft.partNudgeSoftThreshold), settings.partNudgeSoftThreshold), 20, 95) + 8,
        100
      ),
      workStartHour: clamp(toNumber(String(draft.workStartHour), settings.workStartHour), 0, 23),
      workEndHour: clamp(toNumber(String(draft.workEndHour), settings.workEndHour), 0, 23),
      alertLevel: draft.alertLevel,
      remindersInWorkOnly: draft.remindersInWorkOnly,
      useDailyPlan: draft.useDailyPlan,
      limitMin: clamp(toNumber(String(draft.limitMin), settings.limitMin), 10, 180),
      targets: {
        neck: clamp(toNumber(String(draft.targets.neck), settings.targets.neck), 1, 30),
        shoulder: clamp(toNumber(String(draft.targets.shoulder), settings.targets.shoulder), 1, 30),
        'lower-back': clamp(toNumber(String(draft.targets['lower-back']), settings.targets['lower-back']), 1, 30),
        core: clamp(toNumber(String(draft.targets.core), settings.targets.core), 1, 30),
        gluteal: clamp(toNumber(String(draft.targets.gluteal), settings.targets.gluteal), 1, 30),
        leg: clamp(toNumber(String(draft.targets.leg), settings.targets.leg), 1, 30),
      },
      dailyPlans: WEEKDAY_KEYS.reduce((acc, day) => {
        const source = draft.dailyPlans[day];
        acc[day] = {
          limitMin: clamp(toNumber(String(source.limitMin), settings.dailyPlans[day].limitMin), 10, 180),
          targets: {
            neck: clamp(toNumber(String(source.targets.neck), settings.dailyPlans[day].targets.neck), 1, 30),
            shoulder: clamp(toNumber(String(source.targets.shoulder), settings.dailyPlans[day].targets.shoulder), 1, 30),
            'lower-back': clamp(
              toNumber(String(source.targets['lower-back']), settings.dailyPlans[day].targets['lower-back']),
              1,
              30
            ),
            core: clamp(toNumber(String(source.targets.core), settings.dailyPlans[day].targets.core), 1, 30),
            gluteal: clamp(toNumber(String(source.targets.gluteal), settings.dailyPlans[day].targets.gluteal), 1, 30),
            leg: clamp(toNumber(String(source.targets.leg), settings.dailyPlans[day].targets.leg), 1, 30),
          },
        };
        return acc;
      }, {} as UserSettings['dailyPlans']),
    };

    await saveSettings(normalized);
    await saveHomeLayoutOrder(layoutDraft);
    setDraft(normalized);
    Alert.alert('设置已保存', '每日与全局参数已更新。');
  };

  const onLayoutDragEnd = ({ data }: { data: HomeLayoutSectionId[] }) => {
    setLayoutDraft(data);
    void saveHomeLayoutOrder(data);
  };

  const resetToday = () => {
    const hasWebDialog = typeof globalThis.confirm === 'function' && typeof globalThis.alert === 'function';

    if (hasWebDialog) {
      const ok = globalThis.confirm('将清空今日久坐、起立与部位进度，是否继续？');
      if (!ok) return;

      void (async () => {
        await clearTodayProgress();
        globalThis.alert('今日进度已清空。');
      })();
      return;
    }

    Alert.alert('重置今日数据', '将清空今日久坐、起立与部位进度，是否继续？', [
      { text: '取消', style: 'cancel' },
      {
        text: '确认重置',
        style: 'destructive',
        onPress: async () => {
          await clearTodayProgress();
          Alert.alert('已重置', '今日进度已清空。');
        },
      },
    ]);
  };

  const confirmLogout = () => {
    Alert.alert('退出登录', '退出后将返回登录页。', [
      { text: '取消', style: 'cancel' },
      {
        text: '退出',
        style: 'destructive',
        onPress: async () => {
          await logout();
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}> 
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.title, { color: theme.text }]}>设置</Text>
        <Text style={[styles.subTitle, { color: theme.textDim }]}>当前用户：{user?.username || '-'} · 支持按星期灵活设置久坐阈值与各部位每日目标</Text>

        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}> 
          <Text style={[styles.cardTitle, { color: theme.text }]}>提醒通用参数</Text>

          <View style={styles.formRow}>
            <Text style={[styles.formLabel, { color: theme.textDim }]}>部位提醒间隔(分钟)</Text>
            <TextInput
              value={String(draft.partReminderMin)}
              keyboardType="number-pad"
              onChangeText={(v) => setDraft((p) => ({ ...p, partReminderMin: clamp(toNumber(v, p.partReminderMin), 1, 60) }))}
              style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.surfaceAlt }]}
            />
          </View>

          <View style={styles.formRow}>
            <Text style={[styles.formLabel, { color: theme.textDim }]}>提醒强度</Text>
            <View style={styles.levelRow}>
              {(['normal', 'high', 'critical'] as AlertLevel[]).map((lv) => {
                const active = draft.alertLevel === lv;
                return (
                  <TouchableOpacity
                    key={lv}
                    style={[
                      styles.levelChip,
                      {
                        borderColor: active ? theme.primary : theme.border,
                        backgroundColor: active ? theme.chipBg : 'transparent',
                      },
                    ]}
                    onPress={() => setDraft((p) => ({ ...p, alertLevel: lv }))}>
                    <Text style={[styles.levelText, { color: active ? theme.primary : theme.textDim }]}>
                      {lv === 'normal' ? '普通' : lv === 'high' ? '强提醒' : '紧急'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.formRow}>
            <Text style={[styles.formLabel, { color: theme.textDim }]}>部位提醒积极度</Text>
            <View style={styles.levelRow}>
              {(['gentle', 'balanced', 'active'] as PartNudgeProfile[]).map((profile) => {
                const active = draft.partNudgeProfile === profile;
                return (
                  <TouchableOpacity
                    key={profile}
                    style={[
                      styles.levelChip,
                      {
                        borderColor: active ? theme.primary : theme.border,
                        backgroundColor: active ? theme.chipBg : 'transparent',
                      },
                    ]}
                    onPress={() => setDraft((p) => ({ ...p, partNudgeProfile: profile }))}>
                    <Text style={[styles.levelText, { color: active ? theme.primary : theme.textDim }]}>{NUDGE_PROFILE_LABEL[profile]}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.formRow}>
            <Text style={[styles.formLabel, { color: theme.textDim }]}>弱提醒阈值(20-95)</Text>
            <TextInput
              value={String(draft.partNudgeSoftThreshold)}
              keyboardType="number-pad"
              onChangeText={(v) =>
                setDraft((p) => ({
                  ...p,
                  partNudgeSoftThreshold: clamp(toNumber(v, p.partNudgeSoftThreshold), 20, 95),
                }))
              }
              style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.surfaceAlt }]}
            />
          </View>

          <View style={styles.formRow}>
            <Text style={[styles.formLabel, { color: theme.textDim }]}>强提醒阈值(&gt;=弱提醒+8)</Text>
            <TextInput
              value={String(draft.partNudgeConfirmThreshold)}
              keyboardType="number-pad"
              onChangeText={(v) =>
                setDraft((p) => ({
                  ...p,
                  partNudgeConfirmThreshold: clamp(
                    toNumber(v, p.partNudgeConfirmThreshold),
                    (p.partNudgeSoftThreshold || 20) + 8,
                    100
                  ),
                }))
              }
              style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.surfaceAlt }]}
            />
          </View>

          <View style={styles.formRow}>
            <Text style={[styles.formLabel, { color: theme.textDim }]}>仅工作时段提醒</Text>
            <Switch value={draft.remindersInWorkOnly} onValueChange={(v) => setDraft((p) => ({ ...p, remindersInWorkOnly: v }))} />
          </View>

          <View style={styles.formRow}>
            <Text style={[styles.formLabel, { color: theme.textDim }]}>工作开始小时</Text>
            <TextInput
              value={String(draft.workStartHour)}
              keyboardType="number-pad"
              onChangeText={(v) => setDraft((p) => ({ ...p, workStartHour: clamp(toNumber(v, p.workStartHour), 0, 23) }))}
              style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.surfaceAlt }]}
            />
          </View>

          <View style={styles.formRow}>
            <Text style={[styles.formLabel, { color: theme.textDim }]}>工作结束小时</Text>
            <TextInput
              value={String(draft.workEndHour)}
              keyboardType="number-pad"
              onChangeText={(v) => setDraft((p) => ({ ...p, workEndHour: clamp(toNumber(v, p.workEndHour), 0, 23) }))}
              style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.surfaceAlt }]}
            />
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}> 
          <Text style={[styles.cardTitle, { color: theme.text }]}>模式与数据</Text>

          <View style={styles.formRow}>
            <Text style={[styles.formLabel, { color: theme.textDim }]}>主题模式</Text>
            <TouchableOpacity
              style={[styles.compactActionBtn, { borderColor: theme.border, backgroundColor: theme.surfaceAlt }]}
              onPress={toggleThemeMode}>
              <Text style={[styles.compactActionText, { color: theme.text }]}>{themeMode === 'dark' ? '深色' : '浅色'}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.formRow}>
            <Text style={[styles.formLabel, { color: theme.textDim }]}>语言</Text>
            <TouchableOpacity
              style={[styles.compactActionBtn, { borderColor: theme.border, backgroundColor: theme.surfaceAlt }]}
              onPress={toggleLang}>
              <Text style={[styles.compactActionText, { color: theme.text }]}>{lang === 'zh' ? '中文' : 'English'}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.formRow}>
            <Text style={[styles.formLabel, { color: theme.textDim }]}>SOS 安全动作模式</Text>
            <Switch value={isSosMode} onValueChange={toggleSosMode} />
          </View>

          <TouchableOpacity testID="clear-today-progress" style={[styles.resetBtn, { borderColor: theme.danger, backgroundColor: theme.alarmBg }]} onPress={resetToday}>
            <Text style={[styles.resetBtnText, { color: theme.danger }]}>清空今日进度</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}> 
          <Text style={[styles.cardTitle, { color: theme.text }]}>每日训练与久坐阈值</Text>

          <View style={styles.formRow}>
            <Text style={[styles.formLabel, { color: theme.textDim }]}>按星期分别设置</Text>
            <Switch value={draft.useDailyPlan} onValueChange={(v) => setDraft((p) => ({ ...p, useDailyPlan: v }))} />
          </View>

          {draft.useDailyPlan && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayRow}>
              {WEEKDAY_KEYS.map((day) => {
                const active = day === selectedDay;
                return (
                  <TouchableOpacity
                    key={day}
                    style={[
                      styles.dayChip,
                      {
                        borderColor: active ? theme.primary : theme.border,
                        backgroundColor: active ? theme.chipBg : theme.surfaceAlt,
                      },
                    ]}
                    onPress={() => setSelectedDay(day)}>
                    <Text style={[styles.dayText, { color: active ? theme.primary : theme.textDim }]}>{DAY_LABEL[day]}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}

          <View style={styles.formRow}>
            <Text style={[styles.formLabel, { color: theme.textDim }]}>当前编辑</Text>
            <Text style={[styles.currentPlanTag, { color: theme.primary }]}>
              {draft.useDailyPlan ? DAY_LABEL[selectedDay] : '全局统一'}
            </Text>
          </View>

          <View style={styles.formRow}>
            <Text style={[styles.formLabel, { color: theme.textDim }]}>久坐阈值(分钟)</Text>
            <TextInput
              value={String(currentPlan.limitMin)}
              keyboardType="number-pad"
              onChangeText={updateCurrentPlanLimit}
              style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.surfaceAlt }]}
            />
          </View>

          {partRows.map((row) => (
            <View key={row.key} style={styles.formRow}>
              <Text style={[styles.formLabelLarge, { color: theme.text }]}>{row.label}目标</Text>
              <TextInput
                value={String(currentPlan.targets[row.key])}
                keyboardType="number-pad"
                onChangeText={(v) => updateCurrentPlanTarget(row.key, v)}
                style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.surfaceAlt }]}
              />
            </View>
          ))}

          <TouchableOpacity style={[styles.copyBtn, { borderColor: theme.border, backgroundColor: theme.surfaceAlt }]} onPress={applyCurrentToAllDays}>
            <Text style={[styles.copyBtnText, { color: theme.text }]}>将当前配置复制到全部日期</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}> 
          <Text style={[styles.cardTitle, { color: theme.text }]}>首页排版（长按拖拽）</Text>
          <DraggableFlatList
            data={layoutDraft}
            keyExtractor={(item) => item}
            onDragEnd={onLayoutDragEnd}
            activationDistance={8}
            scrollEnabled={false}
            renderItem={({ item, drag, isActive }: RenderItemParams<HomeLayoutSectionId>) => (
              <TouchableOpacity
                onLongPress={drag}
                style={[
                  styles.layoutItem,
                  {
                    borderColor: isActive ? theme.primary : theme.border,
                    backgroundColor: theme.surfaceAlt,
                  },
                ]}>
                <Text style={[styles.layoutItemText, { color: theme.text }]}>{LAYOUT_LABEL[item]}</Text>
                <Text style={[styles.layoutHint, { color: theme.textDim }]}>长按拖动</Text>
              </TouchableOpacity>
            )}
          />
        </View>

        <TouchableOpacity style={[styles.saveBtn, { backgroundColor: theme.primary }]} onPress={saveAllSettings}>
          <Text style={styles.saveBtnText}>保存设置</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.logoutBtn, { borderColor: theme.danger, backgroundColor: theme.alarmBg }]} onPress={confirmLogout}>
          <Text style={[styles.logoutBtnText, { color: theme.danger }]}>退出登录</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 30, gap: 12 },
  title: { fontSize: 24, fontWeight: '800' },
  subTitle: { fontSize: 12 },
  card: { borderWidth: 1, borderRadius: 14, padding: 14, gap: 10 },
  cardTitle: { fontSize: 16, fontWeight: '800' },

  formRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 10,
  },
  formLabel: { flex: 1, fontSize: 13 },
  formLabelLarge: { flex: 1, fontSize: 15, fontWeight: '700' },
  input: {
    width: 88,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    textAlign: 'center',
    fontWeight: '700',
  },

  levelRow: { flexDirection: 'row', gap: 8 },
  levelChip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  levelText: { fontSize: 12, fontWeight: '700' },

  dayRow: { gap: 8, paddingBottom: 2 },
  dayChip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  dayText: { fontSize: 12, fontWeight: '700' },
  currentPlanTag: { fontSize: 13, fontWeight: '800' },

  copyBtn: { borderWidth: 1, borderRadius: 10, paddingVertical: 10, alignItems: 'center', marginTop: 2 },
  copyBtnText: { fontSize: 13, fontWeight: '700' },

  compactActionBtn: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    minWidth: 72,
    alignItems: 'center',
  },
  compactActionText: { fontSize: 12, fontWeight: '700' },
  resetBtn: { borderWidth: 1, borderRadius: 10, paddingVertical: 10, alignItems: 'center', marginTop: 2 },
  resetBtnText: { fontSize: 13, fontWeight: '800' },

  layoutItem: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  layoutItemText: { fontSize: 13, fontWeight: '700' },
  layoutHint: { fontSize: 12 },

  saveBtn: { borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  logoutBtn: { borderWidth: 1, borderRadius: 12, paddingVertical: 11, alignItems: 'center' },
  logoutBtnText: { fontWeight: '800', fontSize: 14 },
});
