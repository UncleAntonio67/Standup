import { Exercise } from './data';
import { TrainingGuide } from './part-guides';

export type VisualPart = 'neck' | 'shoulder' | 'lower-back' | 'core' | 'gluteal' | 'leg' | 'sedentary';
export type FramePhase = 'start' | 'move' | 'hold';

export type CartoonFrame = {
  id: string;
  phase: FramePhase;
  title: string;
  caption: string;
  keyPoint: string;
};

const PART_ICON: Record<VisualPart, string> = {
  neck: '🧠',
  shoulder: '💪',
  'lower-back': '🦴',
  core: '🛡️',
  gluteal: '🍑',
  leg: '🦵',
  sedentary: '🧍',
};

const PART_LABEL: Record<VisualPart, string> = {
  neck: '颈部',
  shoulder: '肩部',
  'lower-back': '下背',
  core: '核心',
  gluteal: '臀部',
  leg: '腿部',
  sedentary: '久坐恢复',
};

const GUIDE_PREFIX_TO_PART: Record<string, VisualPart> = {
  neck: 'neck',
  shoulder: 'shoulder',
  lb: 'lower-back',
  core: 'core',
  glute: 'gluteal',
  leg: 'leg',
  sed: 'sedentary',
};

const splitSentence = (text: string) =>
  text
    .replace(/[。！？!?；;]/g, '。')
    .split('。')
    .map((item) => item.trim())
    .filter(Boolean);

const pick = (source: string[], index: number, fallback: string) => source[index] || fallback;

const toVisualPart = (raw: string | undefined): VisualPart => {
  if (raw === 'neck') return 'neck';
  if (raw === 'shoulder') return 'shoulder';
  if (raw === 'lower-back') return 'lower-back';
  if (raw === 'core') return 'core';
  if (raw === 'gluteal') return 'gluteal';
  if (raw === 'leg') return 'leg';
  return 'core';
};

export const getPartIcon = (part: VisualPart) => PART_ICON[part];
export const getPartLabel = (part: VisualPart) => PART_LABEL[part];

export const getExerciseVisualPart = (exercise: Pick<Exercise, 'targetSlug'>): VisualPart => toVisualPart(exercise.targetSlug);

export const getGuideVisualPart = (guide: Pick<TrainingGuide, 'id' | 'title'>, fallback: VisualPart = 'core'): VisualPart => {
  const prefix = guide.id.split('-')[0];
  if (GUIDE_PREFIX_TO_PART[prefix]) {
    return GUIDE_PREFIX_TO_PART[prefix];
  }

  if (guide.title.includes('颈')) return 'neck';
  if (guide.title.includes('肩')) return 'shoulder';
  if (guide.title.includes('背') || guide.title.includes('腰')) return 'lower-back';
  if (guide.title.includes('腹') || guide.title.includes('核心')) return 'core';
  if (guide.title.includes('臀')) return 'gluteal';
  if (guide.title.includes('腿')) return 'leg';

  return fallback;
};

export const buildExerciseFrames = (exercise: Exercise): CartoonFrame[] => {
  const desc = splitSentence(exercise.desc);
  const tips = splitSentence(exercise.tip);
  const part = getExerciseVisualPart(exercise);

  return [
    {
      id: `${exercise.id}-start`,
      phase: 'start',
      title: '步骤 1 · 准备',
      caption: pick(desc, 0, '进入稳定姿势，保持脊柱中立位。'),
      keyPoint: `目标部位：${getPartLabel(part)}`,
    },
    {
      id: `${exercise.id}-move`,
      phase: 'move',
      title: '步骤 2 · 发力',
      caption: pick(desc, 1, pick(desc, 0, '沿动作轨迹缓慢发力，避免借力。')),
      keyPoint: pick(tips, 0, '节奏平稳，呼吸自然。'),
    },
    {
      id: `${exercise.id}-hold`,
      phase: 'hold',
      title: '步骤 3 · 保持与复位',
      caption: pick(desc, 2, '顶点短暂停留后缓慢回到起始位。'),
      keyPoint: pick(tips, 1, pick(tips, 0, '动作范围以舒适、可控为准。')),
    },
  ];
};

export const buildGuideFrames = (guide: TrainingGuide, part?: VisualPart): CartoonFrame[] => {
  const resolvedPart = part || getGuideVisualPart(guide, 'core');
  const s0 = guide.steps[0] || '进入起始姿势';
  const s1 = guide.steps[1] || '按照动作轨迹缓慢移动';
  const s2 = guide.steps[2] || '回到起始位并重复';

  return [
    {
      id: `${guide.id}-start`,
      phase: 'start',
      title: '步骤 1 · 起始',
      caption: s0,
      keyPoint: `目标部位：${getPartLabel(resolvedPart)}`,
    },
    {
      id: `${guide.id}-move`,
      phase: 'move',
      title: '步骤 2 · 动作',
      caption: s1,
      keyPoint: '保持动作可控，不追求速度。',
    },
    {
      id: `${guide.id}-hold`,
      phase: 'hold',
      title: '步骤 3 · 结束',
      caption: s2,
      keyPoint: guide.cue || '完成后短暂停顿，恢复自然呼吸。',
    },
  ];
};

