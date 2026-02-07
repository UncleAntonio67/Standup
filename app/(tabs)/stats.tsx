import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PainChart } from '../../components/PainChart';
import { APP_THEME } from '../../constants/app-theme';
import { PART_META, PART_ORDER } from '../../constants/part-meta';
import { getWeekdayKey, useStorage } from '../../hooks/useStorage';

type HeatCell = {
  date: string;
  label: string;
  score: number;
  level: 0 | 1 | 2 | 3 | 4;
  standCount: number;
  breaks: number;
  sitMinutes: number;
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

function toISODate(input: Date) {
  return input.toISOString().slice(0, 10);
}

function formatMD(date: Date) {
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

export default function StatsScreen() {
  const { activityHistory, themeMode, muscleProgress, settings } = useStorage();
  const theme = APP_THEME[themeMode];

  const weekly = useMemo(() => activityHistory.slice(-7), [activityHistory]);
  const totalStands = useMemo(() => weekly.reduce((sum, item) => sum + (item.standCount || 0), 0), [weekly]);
  const totalBreaks = useMemo(() => weekly.reduce((sum, item) => sum + (item.sedentaryBreaks || 0), 0), [weekly]);
  const totalSitMinutes = useMemo(
    () => Math.round(weekly.reduce((sum, item) => sum + (item.sitSeconds || 0), 0) / 60),
    [weekly]
  );

  const todayKey = getWeekdayKey();
  const effectiveTargets = settings.useDailyPlan ? settings.dailyPlans[todayKey].targets : settings.targets;

  const recent28Days = useMemo<HeatCell[]>(() => {
    const map = new Map(activityHistory.map((item) => [item.date, item]));
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const cells: HeatCell[] = [];
    for (let offset = 27; offset >= 0; offset -= 1) {
      const day = new Date(today);
      day.setDate(today.getDate() - offset);

      const iso = toISODate(day);
      const source = map.get(iso);

      const standCount = source?.standCount || 0;
      const breaks = source?.sedentaryBreaks || 0;
      const sitMinutes = Math.round((source?.sitSeconds || 0) / 60);

      const standPart = clamp(standCount / 10, 0, 1) * 45;
      const breakPart = clamp(breaks / 6, 0, 1) * 35;
      const sitPart = (1 - clamp(sitMinutes / 360, 0, 1)) * 20;
      const score = Math.round(standPart + breakPart + sitPart);
      const level = clamp(Math.floor(score / 20), 0, 4) as 0 | 1 | 2 | 3 | 4;

      cells.push({
        date: iso,
        label: formatMD(day),
        score,
        level,
        standCount,
        breaks,
        sitMinutes,
      });
    }

    return cells;
  }, [activityHistory]);

  const heatRows = useMemo(() => {
    const rows: HeatCell[][] = [];
    for (let index = 0; index < recent28Days.length; index += 7) {
      rows.push(recent28Days.slice(index, index + 7));
    }
    return rows;
  }, [recent28Days]);

  const bestDay = useMemo(() => {
    if (!recent28Days.length) return null;
    return [...recent28Days].sort((a, b) => b.score - a.score)[0];
  }, [recent28Days]);

  const worstDay = useMemo(() => {
    if (!recent28Days.length) return null;
    return [...recent28Days].sort((a, b) => a.score - b.score)[0];
  }, [recent28Days]);

  const getHeatColor = (level: number) => {
    if (level <= 0) return theme.border;
    if (level === 1) return '#9ec5ff';
    if (level === 2) return '#6ea8fe';
    if (level === 3) return '#3d8bfd';
    return theme.primary;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}> 
      <Text style={[styles.title, { color: theme.text }]}>每日训练报表</Text>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 34 }}>
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { backgroundColor: theme.surface, borderColor: theme.border }]}> 
            <Text style={[styles.summaryLabel, { color: theme.textDim }]}>起立总次数</Text>
            <Text testID="stats-total-stands" style={[styles.summaryValue, { color: theme.primary }]}>{totalStands}</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: theme.surface, borderColor: theme.border }]}> 
            <Text style={[styles.summaryLabel, { color: theme.textDim }]}>久坐中断次数</Text>
            <Text testID="stats-total-breaks" style={[styles.summaryValue, { color: theme.primary }]}>{totalBreaks}</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: theme.surface, borderColor: theme.border }]}> 
            <Text style={[styles.summaryLabel, { color: theme.textDim }]}>累计久坐(分钟)</Text>
            <Text testID="stats-total-sit-minutes" style={[styles.summaryValue, { color: theme.primary }]}>{totalSitMinutes}</Text>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}> 
          <Text style={[styles.cardTitle, { color: theme.primary }]}>近 7 天活动趋势</Text>
          <PainChart
            data={activityHistory}
            emptyText="暂无历史数据，请先完成一次提醒训练。"
            activeColor={theme.primary}
            inactiveColor={theme.border}
            valueColor={theme.text}
            dateColor={theme.textDim}
            emptyColor={theme.textDim}
          />
        </View>

        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}> 
          <Text style={[styles.cardTitle, { color: theme.primary }]}>近 28 天活跃热力图</Text>

          <View style={styles.heatGridWrap}>
            {heatRows.map((row, rowIndex) => (
              <View key={`heat-row-${rowIndex}`} style={styles.heatRow}>
                {row.map((cell) => (
                  <View key={cell.date} style={styles.heatCellWrap}>
                    <View
                      testID={`stats-heat-${cell.date}`}
                      style={[
                        styles.heatCell,
                        {
                          backgroundColor: getHeatColor(cell.level),
                          borderColor: cell.level === 0 ? theme.border : 'transparent',
                        },
                      ]}
                    />
                    <Text style={[styles.heatCellLabel, { color: theme.textDim }]}>{cell.label}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>

          <View style={styles.legendRow}>
            {[0, 1, 2, 3, 4].map((level) => (
              <View key={`legend-${level}`} style={styles.legendItem}>
                <View
                  style={[
                    styles.legendDot,
                    {
                      backgroundColor: getHeatColor(level),
                      borderColor: level === 0 ? theme.border : 'transparent',
                    },
                  ]}
                />
                <Text style={[styles.legendText, { color: theme.textDim }]}>{level === 0 ? '低' : `${level}`}</Text>
              </View>
            ))}
          </View>

          <View style={styles.insightRow}>
            <View style={[styles.insightCard, { borderColor: theme.border, backgroundColor: theme.surfaceAlt }]}> 
              <Text style={[styles.insightTitle, { color: theme.text }]}>最佳一天</Text>
              <Text style={[styles.insightText, { color: theme.primary }]}>
                {bestDay ? `${bestDay.label} · 得分 ${bestDay.score}` : '--'}
              </Text>
              {!!bestDay && (
                <Text style={[styles.insightSub, { color: theme.textDim }]}>
                  起立 {bestDay.standCount} 次 · 中断 {bestDay.breaks} 次 · 久坐 {bestDay.sitMinutes} 分钟
                </Text>
              )}
            </View>

            <View style={[styles.insightCard, { borderColor: theme.border, backgroundColor: theme.surfaceAlt }]}> 
              <Text style={[styles.insightTitle, { color: theme.text }]}>待改善一天</Text>
              <Text style={[styles.insightText, { color: theme.warning }]}>
                {worstDay ? `${worstDay.label} · 得分 ${worstDay.score}` : '--'}
              </Text>
              {!!worstDay && (
                <Text style={[styles.insightSub, { color: theme.textDim }]}>
                  建议增加中断次数，减少连续久坐时长
                </Text>
              )}
            </View>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}> 
          <Text style={[styles.cardTitle, { color: theme.primary }]}>今日各部位完成情况</Text>
          {PART_ORDER.map((partKey) => {
            const current = muscleProgress[partKey] || 0;
            const target = effectiveTargets[partKey];
            const ratio = target > 0 ? current / target : 0;
            const barColor = ratio >= 1 ? theme.success : ratio > 0 ? theme.primary : '#c9d4e0';
            return (
              <View key={partKey} style={styles.partRow}>
                <Text style={[styles.partLabel, { color: theme.text }]}>{PART_META[partKey].label}</Text>
                <View style={[styles.track, { backgroundColor: theme.chipBg }]}> 
                  <View style={[styles.fill, { width: `${Math.min(ratio, 1) * 100}%`, backgroundColor: barColor }]} />
                </View>
                <Text style={[styles.partValue, { color: barColor }]}>{current}/{target}</Text>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { fontSize: 22, fontWeight: '800', paddingHorizontal: 20, paddingTop: 12 },
  summaryRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  summaryCard: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 10,
  },
  summaryLabel: { fontSize: 11, marginBottom: 6 },
  summaryValue: { fontSize: 20, fontWeight: '800' },
  card: { padding: 16, borderRadius: 12, borderWidth: 1, marginTop: 12 },
  cardTitle: { fontSize: 14, fontWeight: '800', marginBottom: 14 },
  heatGridWrap: { gap: 8 },
  heatRow: { flexDirection: 'row', gap: 8 },
  heatCellWrap: { alignItems: 'center', width: 40 },
  heatCell: { width: 22, height: 22, borderRadius: 6, borderWidth: 1 },
  heatCellLabel: { fontSize: 10, marginTop: 4 },
  legendRow: { flexDirection: 'row', marginTop: 10, gap: 12, alignItems: 'center', flexWrap: 'wrap' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 12, height: 12, borderRadius: 4, borderWidth: 1 },
  legendText: { fontSize: 10 },
  insightRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  insightCard: { flex: 1, borderRadius: 10, borderWidth: 1, padding: 10, gap: 4 },
  insightTitle: { fontSize: 12, fontWeight: '700' },
  insightText: { fontSize: 13, fontWeight: '800' },
  insightSub: { fontSize: 11, lineHeight: 16 },
  partRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  partLabel: { width: 92, fontSize: 12 },
  track: { flex: 1, height: 7, borderRadius: 999, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 999 },
  partValue: { width: 60, textAlign: 'right', fontWeight: '700', fontSize: 11, marginLeft: 8 },
});

