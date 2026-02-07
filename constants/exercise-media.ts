import { Exercise } from './data';
import { TrainingGuide } from './part-guides';

const DB_BASE = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises';

const dbGif = (dbId: string) => ({
  uri: `${DB_BASE}/${dbId}/0.jpg`,
});

const dbMotion = (dbId: string) => [
  { uri: `${DB_BASE}/${dbId}/0.jpg` },
  { uri: `${DB_BASE}/${dbId}/1.jpg` },
];

const EXERCISE_TO_DB_ID: Record<string, string> = {
  neck_tuck: 'Chin_To_Chest_Stretch',
  neck_tilt: 'Side_Neck_Stretch',
  neck_rotate: 'Neck-SMR',
  neck_iso_front: 'Isometric_Neck_Exercise_-_Front_And_Back',
  neck_iso_back: 'Isometric_Neck_Exercise_-_Front_And_Back',
  neck_yf: 'Neck_Press',

  sh_shrugs: 'Dumbbell_Shrug',
  sh_circles: 'Shoulder_Circles',
  sh_w: 'Band_Pull_Apart',
  sh_wall: 'One_Arm_Against_Wall',
  sh_door: 'Behind_Head_Chest_Stretch',
  sh_eagle: 'Reverse_Flyes_With_External_Rotation',

  bk_mckenzie: 'Hyperextensions_Back_Extensions',
  bk_cat: 'Cat_Stretch',
  bk_twist: 'Seated_Barbell_Twist',
  bk_lat: 'Dumbbell_Side_Bend',
  bk_hinge: 'Romanian_Deadlift',
  bk_child: 'Childs_Pose',

  cr_vacuum: 'Stomach_Vacuum',
  cr_brace: 'Plank',
  cr_leg_lift: 'Flat_Bench_Lying_Leg_Raise',
  cr_press: 'Pallof_Press',
  cr_rotate: 'Russian_Twist',
  cr_plank_desk: 'Push_Up_to_Side_Plank',
  cr_side_bend: 'Dumbbell_Side_Bend',
  cr_deadbug_stand: 'Dead_Bug',
  cr_kegel: 'Stomach_Vacuum',
  cr_woodchop: 'Standing_Cable_Wood_Chop',

  gl_squeeze: 'Barbell_Glute_Bridge',
  gl_kick: 'Glute_Kickback',
  gl_abduct: 'Side_Leg_Raises',
  gl_squat: 'Bodyweight_Squat',
  gl_lunge: 'Crossover_Reverse_Lunge',
  gl_hip_thrust: 'Barbell_Hip_Thrust',

  lg_calf: 'Standing_Calf_Raises',
  lg_quad: 'Quad_Stretch',
  lg_ham: 'Hamstring_Stretch',
  lg_sit_ext: 'Leg_Extensions',
  lg_march: 'Step-up_with_Knee_Raise',
  lg_wall_sit: 'Chair_Squat',
};

const GUIDE_TO_DB_ID: Record<string, string> = {
  'neck-1': 'Chin_To_Chest_Stretch',
  'neck-2': 'Side_Neck_Stretch',
  'neck-3': 'Isometric_Neck_Exercise_-_Front_And_Back',

  'shoulder-1': 'Band_Pull_Apart',
  'shoulder-2': 'Behind_Head_Chest_Stretch',
  'shoulder-3': 'Shoulder_Circles',

  'lb-1': 'Hyperextensions_Back_Extensions',
  'lb-2': 'Cat_Stretch',
  'lb-3': 'Romanian_Deadlift',

  'core-1': 'Stomach_Vacuum',
  'core-2': 'Pallof_Press',
  'core-3': 'Dumbbell_Side_Bend',

  'glute-1': 'Barbell_Glute_Bridge',
  'glute-2': 'Glute_Kickback',
  'glute-3': 'Side_Leg_Raises',

  'leg-1': 'Standing_Calf_Raises',
  'leg-2': 'Bodyweight_Squat',
  'leg-3': 'Hamstring_Stretch',

  'sed-1': 'Plank',
  'sed-2': 'Standing_Calf_Raises',
  'sed-3': 'Band_Pull_Apart',
};

const DEFAULT_DB_ID = 'Plank';

const resolveDbId = (id: string, mapping: Record<string, string>) => mapping[id] || DEFAULT_DB_ID;

export const getExerciseImage = (exerciseId: string) => {
  const dbId = resolveDbId(exerciseId, EXERCISE_TO_DB_ID);
  return dbGif(dbId);
};

export const getExerciseMotionSources = (exerciseId: string) => {
  const dbId = resolveDbId(exerciseId, EXERCISE_TO_DB_ID);
  return dbMotion(dbId);
};

export const getGuideImage = (guideId: string) => {
  const dbId = resolveDbId(guideId, GUIDE_TO_DB_ID);
  return dbGif(dbId);
};

export const getGuideMotionSources = (guideId: string) => {
  const dbId = resolveDbId(guideId, GUIDE_TO_DB_ID);
  return dbMotion(dbId);
};

export const getSedentaryGuideImage = (guideId: string) => {
  const dbId = resolveDbId(guideId, GUIDE_TO_DB_ID);
  return dbGif(dbId);
};

export const getSedentaryGuideMotionSources = (guideId: string) => {
  const dbId = resolveDbId(guideId, GUIDE_TO_DB_ID);
  return dbMotion(dbId);
};

export const buildExerciseVoiceText = (exercise: Exercise, lang: 'zh' | 'en') => {
  if (lang === 'en') {
    return `${exercise.titleEn}. ${exercise.descEn}. ${exercise.tipEn}`;
  }
  return `${exercise.title}。${exercise.desc}。提示：${exercise.tip}`;
};

export const buildGuideVoiceText = (guide: TrainingGuide, lang: 'zh' | 'en') => {
  const steps = guide.steps.join('，');
  if (lang === 'en') {
    return `${guide.title}. Goal: ${guide.goal}. Steps: ${steps}. Cue: ${guide.cue}`;
  }
  return `${guide.title}。目标：${guide.goal}。步骤：${steps}。要点：${guide.cue}`;
};

export const EXERCISE_MEDIA_MAPPING = EXERCISE_TO_DB_ID;
export const GUIDE_MEDIA_MAPPING = GUIDE_TO_DB_ID;
