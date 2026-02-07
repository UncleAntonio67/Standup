import React, { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleProp, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';

import { CartoonFrame, FramePhase, VisualPart, getPartIcon, getPartLabel } from '../constants/exercise-visuals';

type ThemeColors = {
  surface: string;
  border: string;
  text: string;
  textDim: string;
  primary: string;
};

type CartoonActionPanelProps = {
  part: VisualPart;
  frames: CartoonFrame[];
  colors: ThemeColors;
  style?: StyleProp<ViewStyle>;
  compact?: boolean;
  testIDBase?: string;
  previewTrigger?: 'tap' | 'button';
};

const PHASE_LABEL: Record<FramePhase, string> = {
  start: '准备',
  move: '动作',
  hold: '保持',
};

const PHASE_POSE: Record<VisualPart, Record<FramePhase, string>> = {
  neck: { start: '🧍', move: '🙆', hold: '🧘' },
  shoulder: { start: '🧍', move: '🏋️', hold: '💪' },
  'lower-back': { start: '🧍', move: '🤸', hold: '🧘' },
  core: { start: '🧍', move: '🤺', hold: '🛡️' },
  gluteal: { start: '🧍', move: '🏃', hold: '🦿' },
  leg: { start: '🧍', move: '🚶', hold: '🏃' },
  sedentary: { start: '🪑', move: '🧍', hold: '🚶' },
};

const COLOR_PALETTE: Record<FramePhase, { bg: string; border: string }> = {
  start: { bg: '#EAF5FF', border: '#A9D6FF' },
  move: { bg: '#EEFCEE', border: '#ABE6B6' },
  hold: { bg: '#FFF4EA', border: '#FFCFA6' },
};

export function CartoonActionPanel({
  part,
  frames,
  colors,
  style,
  compact = false,
  testIDBase,
  previewTrigger = 'tap',
}: CartoonActionPanelProps) {
  const [zoomVisible, setZoomVisible] = useState(false);

  const safeFrames = useMemo(
    () =>
      frames.length
        ? frames
        : [
            {
              id: 'fallback-start',
              phase: 'start' as const,
              title: '步骤 1 · 准备',
              caption: '保持自然姿势并准备动作。',
              keyPoint: '动作应全程保持可控。',
            },
            {
              id: 'fallback-move',
              phase: 'move' as const,
              title: '步骤 2 · 动作',
              caption: '缓慢完成动作，不借力。',
              keyPoint: '配合呼吸，均匀发力。',
            },
            {
              id: 'fallback-hold',
              phase: 'hold' as const,
              title: '步骤 3 · 保持',
              caption: '顶点停顿并回到起始位。',
              keyPoint: '以舒适范围为准。',
            },
          ],
    [frames]
  );

  const content = (
    <View style={[styles.longImageWrap, { borderColor: colors.border, backgroundColor: colors.surface }]}> 
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <Text style={styles.partIcon}>{getPartIcon(part)}</Text>
          <Text style={[styles.partLabel, { color: colors.text }]}>{getPartLabel(part)} 长图分镜</Text>
        </View>
        <Text style={[styles.hintText, { color: colors.textDim }]}>共 {safeFrames.length} 步</Text>
      </View>

      {safeFrames.map((frame, index) => {
        const phaseColor = COLOR_PALETTE[frame.phase];
        return (
          <View key={frame.id} style={styles.stepWrap} testID={testIDBase ? `${testIDBase}-step-${index + 1}` : undefined}>
            {index > 0 && <View style={[styles.stepConnector, { borderColor: colors.border }]} />}
            <View style={[styles.stepCard, { borderColor: phaseColor.border, backgroundColor: phaseColor.bg }]}> 
              <View style={styles.stepHeader}>
                <Text style={[styles.stepIndex, { color: colors.primary }]}>#{index + 1}</Text>
                <Text style={[styles.stepTitle, { color: '#14253A' }]}>{frame.title}</Text>
                <View style={[styles.phaseTag, { borderColor: '#14253A' }]}> 
                  <Text style={styles.phaseTagText}>{PHASE_LABEL[frame.phase]}</Text>
                </View>
              </View>

              <View style={styles.poseRow}>
                <Text style={styles.poseEmoji}>{PHASE_POSE[part][frame.phase]}</Text>
                <View style={styles.textCol}>
                  <Text testID={testIDBase ? `${testIDBase}-step-${index + 1}-caption` : undefined} style={styles.captionText}>
                    {frame.caption}
                  </Text>
                  <Text testID={testIDBase ? `${testIDBase}-step-${index + 1}-keypoint` : undefined} style={styles.keyPointText}>
                    要点：{frame.keyPoint}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );

  return (
    <>
      <View style={style}>
        {previewTrigger === 'tap' ? (
          <TouchableOpacity
            testID={testIDBase ? `${testIDBase}-preview` : undefined}
            activeOpacity={0.9}
            onPress={() => setZoomVisible(true)}>
            {content}
            <Text style={[styles.tapHint, { color: colors.textDim }]}>{compact ? '点击查看长图详情' : '点击放大查看整套分镜'}</Text>
          </TouchableOpacity>
        ) : (
          <>
            {content}
            <View style={styles.previewBtnRow}>
              <TouchableOpacity
                testID={testIDBase ? `${testIDBase}-preview` : undefined}
                onPress={() => setZoomVisible(true)}
                style={[styles.previewBtn, { borderColor: colors.border, backgroundColor: colors.surface }]}>
                <Text style={[styles.previewBtnText, { color: colors.text }]}>查看长图</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>

      <Modal visible={zoomVisible} transparent animationType="fade" onRequestClose={() => setZoomVisible(false)}>
        <Pressable style={styles.overlay} onPress={() => setZoomVisible(false)}>
          <Pressable
            testID={testIDBase ? `${testIDBase}-modal` : undefined}
            style={[styles.zoomCard, { borderColor: colors.border, backgroundColor: colors.surface }]}
            onPress={() => undefined}>
            <View style={styles.zoomHeader}>
              <Text testID={testIDBase ? `${testIDBase}-modal-title` : undefined} style={[styles.zoomTitle, { color: colors.text }]}>
                {getPartLabel(part)} 分镜长图
              </Text>
              <TouchableOpacity onPress={() => setZoomVisible(false)} style={[styles.closeBtn, { borderColor: colors.border }]}>
                <Text style={[styles.closeText, { color: colors.text }]}>关闭</Text>
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator>
              {content}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  longImageWrap: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    gap: 8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  partIcon: {
    fontSize: 17,
  },
  partLabel: {
    fontSize: 12,
    fontWeight: '800',
  },
  hintText: {
    fontSize: 11,
  },
  stepWrap: {
    gap: 6,
  },
  stepConnector: {
    marginLeft: 11,
    height: 10,
    width: 1,
    borderLeftWidth: 1,
  },
  stepCard: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 9,
    gap: 8,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepIndex: {
    fontSize: 12,
    fontWeight: '800',
    width: 24,
  },
  stepTitle: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
  },
  phaseTag: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  phaseTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#14253A',
  },
  poseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  poseEmoji: {
    fontSize: 30,
    width: 42,
    textAlign: 'center',
  },
  textCol: {
    flex: 1,
    gap: 4,
  },
  captionText: {
    color: '#14253A',
    fontSize: 12,
    lineHeight: 18,
  },
  keyPointText: {
    color: '#35506C',
    fontSize: 11,
    lineHeight: 16,
  },
  tapHint: {
    marginTop: 6,
    fontSize: 10,
    textAlign: 'right',
  },
  previewBtnRow: {
    marginTop: 6,
    alignItems: 'flex-end',
  },
  previewBtn: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  previewBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 24,
  },
  zoomCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    maxHeight: '88%',
  },
  zoomHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  zoomTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  closeBtn: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  closeText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
