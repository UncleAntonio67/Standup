import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Speech from 'expo-speech';

import { APP_THEME } from '../../constants/app-theme';
import { EXERCISE_DATA } from '../../constants/data';
import { buildExerciseVoiceText } from '../../constants/exercise-media';
import { buildExerciseFrames, getExerciseVisualPart } from '../../constants/exercise-visuals';
import { CartoonActionPanel } from '../../components/CartoonActionPanel';
import { useStorage } from '../../hooks/useStorage';

type FilterType = 'all' | 'sitting' | 'standing';

const COLORS = {
  bg: '#050a10',
  card: '#0f1926',
  border: '#1e3a52',
  primary: '#00d4ff',
  text: '#ffffff',
  textDim: '#8ea3b7',
  danger: '#ff5d5d',
};

export default function LibraryScreen() {
  const { isSosMode, finishExercise, themeMode, lang } = useStorage();
  const { width } = useWindowDimensions();
  const theme = APP_THEME[themeMode];
  const [filter, setFilter] = useState<FilterType>('all');

  const isWide = width >= 900;
  const columns = isWide ? 2 : 1;

  const filteredData = useMemo(() => {
    return EXERCISE_DATA.filter((item) => {
      if (filter !== 'all' && item.posture !== filter) return false;
      if (isSosMode && !item.isSosSafe) return false;
      return true;
    });
  }, [filter, isSosMode]);

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

  const handleDoExercise = (item: typeof EXERCISE_DATA[0]) => {
    finishExercise(item.bodyPartSlug, item.targetSlug);
    Alert.alert('打卡成功', `部位 ${item.bodyPartSlug.join(', ')} 热力值已增加`);
  };

  const handleSpeak = (item: typeof EXERCISE_DATA[0]) => {
    Speech.stop();
    Speech.speak(buildExerciseVoiceText(item, lang), {
      language: lang === 'zh' ? 'zh-CN' : 'en-US',
      rate: 0.95,
      pitch: 1,
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.headerTitle, { color: theme.text }]}>动作库</Text>
          <Text style={[styles.headerSub, { color: theme.textDim }]}>按姿势筛选，快速完成一次激活</Text>
        </View>
        {isSosMode && (
          <View style={[styles.sosBadge, { borderColor: theme.danger }]}>
            <Text style={styles.sosText}>SOS MODE</Text>
          </View>
        )}
      </View>

      <View style={styles.filterRow}>
        {[
          { key: 'all', label: '全部' },
          { key: 'sitting', label: '坐姿' },
          { key: 'standing', label: '站姿' },
        ].map((item) => {
          const selected = filter === (item.key as FilterType);
          return (
            <TouchableOpacity
              key={item.key}
              onPress={() => setFilter(item.key as FilterType)}
              style={[
                styles.chip,
                { borderColor: theme.border, backgroundColor: theme.chipBg },
                selected && { borderColor: theme.primary, backgroundColor: 'rgba(0,212,255,0.15)' },
              ]}
            >
              <Text style={[styles.chipText, { color: theme.textDim }, selected && { color: theme.primary }]}>{item.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <FlatList
        data={filteredData}
        numColumns={columns}
        keyExtractor={(item) => item.id}
        key={`lib-${columns}`}
        renderItem={({ item }) => {
          return (
            <TouchableOpacity
              testID={`exercise-card-${item.id}`}
              onPress={() => handleDoExercise(item)}
              activeOpacity={0.85}
              style={[styles.cardWrap, isWide && { width: '50%' }]}>
              <View style={[styles.card, { backgroundColor: theme.surfaceAlt }]}>
              <View style={[StyleSheet.absoluteFill, { borderRadius: 14, borderWidth: 1, borderColor: theme.border }]} />
                <CartoonActionPanel
                  part={getExerciseVisualPart(item)}
                  frames={buildExerciseFrames(item)}
                  colors={panelColors}
                  compact
                  testIDBase={`exercise-visual-${item.id}`}
                  previewTrigger="button"
                  style={styles.cardImagePanel}
                />
                <View style={styles.cardHeader}>
                  <Text testID={`exercise-title-${item.id}`} style={[styles.cardTitle, { color: theme.text }]}>{item.title}</Text>
                  <View
                    style={[
                      styles.postureBadge,
                      item.posture === 'sitting' ? styles.badgeSit : styles.badgeStand,
                    ]}
                  >
                    <Text style={[styles.postureText, { color: theme.text }]}>{item.posture === 'sitting' ? '坐姿' : '站姿'}</Text>
                  </View>
                </View>

                <Text testID={`exercise-desc-${item.id}`} style={[styles.cardDesc, { color: theme.textDim }]}>{item.desc}</Text>

                <View style={styles.cardFooter}>
                  <Text testID={`exercise-tip-${item.id}`} style={[styles.tipText, { color: theme.textDim }]}>{item.tip}</Text>
                  <View style={styles.actionGroup}>
                    <TouchableOpacity style={[styles.actionBtn, { borderColor: theme.border, backgroundColor: theme.surface }]} onPress={() => handleSpeak(item)}>
                      <Text style={[styles.actionText, { color: theme.text }]}>语音</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      testID={`exercise-plus-${item.id}`}
                      style={[styles.actionBtn, { borderColor: theme.primary }]}
                      onPress={() => handleDoExercise(item)}>
                      <Text style={[styles.actionText, { color: theme.primary }]}>+1</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={<Text style={[styles.emptyText, { color: theme.textDim }]}>当前模式下暂无推荐动作</Text>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 24, fontWeight: '800' },
  headerSub: { marginTop: 4, fontSize: 12 },
  sosBadge: {
    borderWidth: 1,
    borderColor: COLORS.danger,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: 'rgba(255,93,93,0.1)',
  },
  sosText: { color: COLORS.danger, fontSize: 10, fontWeight: '700' },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 14,
    gap: 10,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipText: { fontSize: 12, fontWeight: '700' },
  listContent: { paddingHorizontal: 16, paddingBottom: 34 },
  cardWrap: { width: '100%', paddingHorizontal: 4 },
  card: {
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    overflow: 'hidden',
  },
  cardImagePanel: { marginBottom: 10 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 16, fontWeight: '700', flex: 1, paddingRight: 12 },
  postureBadge: { borderRadius: 8, paddingVertical: 4, paddingHorizontal: 8 },
  badgeSit: { backgroundColor: 'rgba(57,255,20,0.15)' },
  badgeStand: { backgroundColor: 'rgba(0,212,255,0.18)' },
  postureText: { fontSize: 10, fontWeight: '700' },
  cardDesc: { fontSize: 13, lineHeight: 19, marginTop: 10 },
  cardFooter: { marginTop: 12, flexDirection: 'row', alignItems: 'center' },
  tipText: { fontSize: 11, flex: 1, paddingRight: 12 },
  actionGroup: { flexDirection: 'row', gap: 8 },
  actionBtn: {
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: 'rgba(0,212,255,0.12)',
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  actionText: { fontWeight: '800', fontSize: 12 },
  emptyText: { textAlign: 'center', marginTop: 52 },
});
