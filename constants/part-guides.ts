import { BodyPartSlug } from '../hooks/useStorage';

export type TrainingGuide = {
  id: string;
  title: string;
  duration: string;
  goal: string;
  steps: string[];
  cue: string;
};

export const SEDENTARY_RECOVERY_GUIDES: TrainingGuide[] = [
  {
    id: 'sed-1',
    title: '起立伸展 + 深呼吸',
    duration: '45 秒',
    goal: '快速解除久坐僵硬与疲劳',
    steps: ['站立后双臂上举', '吸气时抬胸，呼气时放松', '重复 5 次呼吸循环'],
    cue: '保持肩膀下沉，不要耸肩。',
  },
  {
    id: 'sed-2',
    title: '踝泵循环',
    duration: '30 秒',
    goal: '促进下肢循环，减少腿部酸胀',
    steps: ['扶桌站立', '脚尖上提再下压', '连续 20 次'],
    cue: '动作匀速，脚后跟稳定贴地。',
  },
  {
    id: 'sed-3',
    title: '肩颈重置',
    duration: '40 秒',
    goal: '缓解肩颈前倾和紧张',
    steps: ['下巴轻收', '肩胛骨向后向下夹紧 3 秒', '放松后重复 8 次'],
    cue: '颈部保持中立位，不要后仰。',
  },
];

export const PART_TRAINING_GUIDES: Record<BodyPartSlug, TrainingGuide[]> = {
  neck: [
    {
      id: 'neck-1',
      title: '下巴回收',
      duration: '40 秒',
      goal: '修正头前伸姿态',
      steps: ['目视前方', '下巴水平后收', '保持 3 秒后放松，重复 8 次'],
      cue: '动作是水平后移，不是低头。',
    },
    {
      id: 'neck-2',
      title: '侧屈拉伸',
      duration: '每侧 20 秒',
      goal: '放松斜方肌上束',
      steps: ['右手扶头顶轻压向右', '左侧颈部感受牵拉', '换侧重复'],
      cue: '拉伸到微紧即可，不要疼痛。',
    },
    {
      id: 'neck-3',
      title: '等长抗阻',
      duration: '30 秒',
      goal: '激活深层颈屈肌',
      steps: ['手掌顶住额头', '头向前轻推 5 秒', '放松后重复 5 次'],
      cue: '力度 30%-40% 即可。',
    },
  ],
  shoulder: [
    {
      id: 'shoulder-1',
      title: '肩胛后缩',
      duration: '45 秒',
      goal: '改善圆肩含胸',
      steps: ['双臂自然下垂', '肩胛向后向下夹紧 3 秒', '重复 10 次'],
      cue: '避免耸肩代偿。',
    },
    {
      id: 'shoulder-2',
      title: '胸前开合',
      duration: '40 秒',
      goal: '提升肩前侧柔韧性',
      steps: ['双手背后十指相扣', '缓慢抬手打开胸廓', '保持 15 秒，做 2 轮'],
      cue: '腰背保持中立，不要塌腰。',
    },
    {
      id: 'shoulder-3',
      title: '肩环绕',
      duration: '30 秒',
      goal: '增加肩关节活动度',
      steps: ['双肩向后画圈', '缓慢做 10 次', '反向再做 10 次'],
      cue: '节奏慢，感受肩关节轨迹。',
    },
  ],
  'lower-back': [
    {
      id: 'lb-1',
      title: '站姿后伸',
      duration: '35 秒',
      goal: '缓解久坐腰部压迫感',
      steps: ['双手扶髋', '轻微后伸 2 秒', '返回中立，重复 10 次'],
      cue: '后伸幅度小而可控。',
    },
    {
      id: 'lb-2',
      title: '猫牛节律',
      duration: '50 秒',
      goal: '提升脊柱节律活动',
      steps: ['站立扶桌', '呼气拱背', '吸气展胸，重复 8 次'],
      cue: '动作由胸椎带动，不要猛甩。',
    },
    {
      id: 'lb-3',
      title: '髋铰链唤醒',
      duration: '45 秒',
      goal: '减少腰代偿，提升髋参与',
      steps: ['双手扶髋', '屈髋向后坐', '回到站立，重复 12 次'],
      cue: '背部保持平直，重心在脚中后。',
    },
  ],
  core: [
    {
      id: 'core-1',
      title: '站姿腹压呼吸',
      duration: '45 秒',
      goal: '建立核心稳定',
      steps: ['双手扶肋弓', '吸气扩张腹侧', '呼气轻收腹，重复 6 次'],
      cue: '收腹是“轻收紧”，不是憋气。',
    },
    {
      id: 'core-2',
      title: '抗旋转推手',
      duration: '每侧 20 秒',
      goal: '提升抗旋能力',
      steps: ['双手合十于胸前', '身体保持正向缓慢前推', '保持再收回，换侧'],
      cue: '骨盆稳定，不扭腰。',
    },
    {
      id: 'core-3',
      title: '侧向控制',
      duration: '每侧 25 秒',
      goal: '增强腹斜肌控制',
      steps: ['一手叉腰，一手上举', '向侧方轻屈后回正', '每侧重复 8 次'],
      cue: '动作流畅，避免弹震。',
    },
  ],
  gluteal: [
    {
      id: 'glute-1',
      title: '站姿臀夹紧',
      duration: '40 秒',
      goal: '激活久坐抑制的臀肌',
      steps: ['双脚与髋同宽', '臀部夹紧 3 秒', '放松后重复 10 次'],
      cue: '躯干保持直立，不后仰。',
    },
    {
      id: 'glute-2',
      title: '后摆腿',
      duration: '每侧 20 秒',
      goal: '提升臀大肌参与',
      steps: ['扶桌站立', '单腿向后抬至舒适范围', '每侧 10 次'],
      cue: '摆腿来自髋关节，不甩腰。',
    },
    {
      id: 'glute-3',
      title: '侧向外展',
      duration: '每侧 25 秒',
      goal: '激活臀中肌稳定骨盆',
      steps: ['扶桌单脚站稳', '另一腿向侧抬起再落下', '每侧 12 次'],
      cue: '骨盆尽量保持水平。',
    },
  ],
  leg: [
    {
      id: 'leg-1',
      title: '提踵循环',
      duration: '40 秒',
      goal: '改善小腿泵血能力',
      steps: ['双脚平行站立', '脚跟抬起再缓慢下放', '重复 20 次'],
      cue: '全程控制速度，避免震脚。',
    },
    {
      id: 'leg-2',
      title: '半蹲唤醒',
      duration: '45 秒',
      goal: '激活股四头肌与臀腿链',
      steps: ['双脚稍宽于肩', '下蹲至半程', '起身，重复 12 次'],
      cue: '膝盖方向与脚尖一致。',
    },
    {
      id: 'leg-3',
      title: '腘绳肌动态拉伸',
      duration: '每侧 20 秒',
      goal: '缓解腿后侧紧张',
      steps: ['单脚前伸脚跟点地', '髋部后坐，身体前倾', '每侧 2 轮'],
      cue: '脊柱中立，感觉腿后侧拉伸。',
    },
  ],
};

