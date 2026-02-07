import { Slug } from 'react-native-body-highlighter';
import { BodyPartSlug } from '../hooks/useStorage';

export type PartMeta = {
  label: string;
  tag: string;
  bodySlugs: Slug[];
};

export const PART_META: Record<BodyPartSlug, PartMeta> = {
  neck: { label: '颈部', tag: 'N', bodySlugs: ['neck', 'trapezius'] },
  shoulder: { label: '肩部', tag: 'S', bodySlugs: ['deltoids', 'trapezius', 'triceps'] },
  'lower-back': { label: '下背', tag: 'B', bodySlugs: ['lower-back'] },
  core: { label: '核心', tag: 'C', bodySlugs: ['abs', 'obliques'] },
  gluteal: { label: '臀部', tag: 'G', bodySlugs: ['gluteal'] },
  leg: { label: '腿部', tag: 'L', bodySlugs: ['quadriceps', 'hamstring', 'calves', 'tibialis', 'knees'] },
};

export const PART_ORDER = Object.keys(PART_META) as BodyPartSlug[];
