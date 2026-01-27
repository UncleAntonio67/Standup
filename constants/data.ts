// constants/data.ts

// 定义 BodyPartSlug 类型，与 useStorage 保持一致
export type BodyPartSlug = 'neck' | 'shoulder' | 'lower-back' | 'core' | 'gluteal' | 'leg';

export interface Exercise {
    id: string;
    title: string;
    desc: string;
    tip: string;
    titleEn: string;
    descEn: string;
    tipEn: string;
    posture: 'sitting' | 'standing';
    isSosSafe: boolean;
    // [修复] 将类型改为 string[] 以避免 TS 对字面量的严格检查报错，
    // 或者你也可以严格定义为 BodyPartSlug[]，但这里用 string[] 更不容易出错
    bodyPartSlug: string[];
    targetSlug: BodyPartSlug;
}

export const EXERCISE_DATA: Exercise[] = [
    // ==================== 1. 颈部 (Neck) - 6+ 动作 ====================
    {
        id: 'neck_tuck',
        title: '颈椎回缩',
        desc: '水平向后收下巴，像做“双下巴”，保持5秒。',
        tip: '复位：对抗屏幕脸，拉伸后颈筋膜。',
        titleEn: 'Chin Tucks',
        descEn: 'Retract chin horizontally like making a double chin. Hold 5s.',
        tipEn: 'Reset: Counteracts forward head posture.',
        posture: 'sitting',
        isSosSafe: true,
        bodyPartSlug: ['neck'],
        targetSlug: 'neck'
    },
    {
        id: 'neck_tilt',
        title: '侧向拉伸',
        desc: '手扶头顶，轻柔向一侧倾斜，保持15秒。',
        tip: '舒缓：放松斜方肌上束。',
        titleEn: 'Neck Tilt',
        descEn: 'Gently tilt head to side using hand weight. Hold 15s.',
        tipEn: 'Relief: Relieves upper trapezius tension.',
        posture: 'sitting',
        isSosSafe: true,
        bodyPartSlug: ['neck', 'trapezius'],
        targetSlug: 'neck'
    },
    {
        id: 'neck_rotate',
        title: '极慢转头',
        desc: '像慢动作一样左右转头，寻找僵硬点停留。',
        tip: '润滑：增加寰枢关节灵活性。',
        titleEn: 'Slow Rotations',
        descEn: 'Rotate head left/right in slow motion. Pause at stiff spots.',
        tipEn: 'Lubrication: Increases joint mobility.',
        posture: 'sitting',
        isSosSafe: true,
        bodyPartSlug: ['neck'],
        targetSlug: 'neck'
    },
    {
        id: 'neck_iso_front',
        title: '前额抗阻',
        desc: '手抵前额，头用力向前顶手，手不动。',
        tip: '强化：深层颈屈肌激活。',
        titleEn: 'Front Isometric',
        descEn: 'Press forehead against hand. Push head forward, resist with hand.',
        tipEn: 'Strength: Activates deep neck flexors.',
        posture: 'sitting',
        isSosSafe: true,
        bodyPartSlug: ['neck'],
        targetSlug: 'neck'
    },
    {
        id: 'neck_iso_back',
        title: '后脑抗阻',
        desc: '双手抱头后，头向后用力顶手。',
        tip: '矫正：强化颈后伸肌群。',
        titleEn: 'Back Isometric',
        descEn: 'Clasp hands behind head. Push head backward into hands.',
        tipEn: 'Corrective: Strengthens rear neck muscles.',
        posture: 'sitting',
        isSosSafe: true,
        bodyPartSlug: ['neck', 'trapezius'],
        targetSlug: 'neck'
    },
    {
        id: 'neck_yf',
        title: '仰望星空',
        desc: '双手交叉胸前，缓慢抬头看天花板，闭嘴。',
        tip: '拉伸：拉伸颈阔肌，防止颈纹。',
        titleEn: 'Sky Gazer',
        descEn: 'Hands on chest, slowly look up, keep mouth closed.',
        tipEn: 'Stretch: Stretches platysma muscle.',
        posture: 'sitting',
        isSosSafe: true,
        bodyPartSlug: ['neck'],
        targetSlug: 'neck'
    },

    // ==================== 2. 肩膀 (Shoulder) - 6+ 动作 ====================
    {
        id: 'sh_shrugs',
        title: '沉肩训练',
        desc: '用力耸肩3秒，然后用力下沉肩胛骨5秒。',
        tip: '感知：学会“肩膀远离耳朵”。',
        titleEn: 'Drop Shrugs',
        descEn: 'Shrug hard 3s, then depress shoulders down hard 5s.',
        tipEn: 'Awareness: Keep shoulders away from ears.',
        posture: 'sitting',
        isSosSafe: true,
        bodyPartSlug: ['trapezius'],
        targetSlug: 'shoulder'
    },
    {
        id: 'sh_circles',
        title: '肩部画圆',
        desc: '指尖搭肩，手肘画最大幅度的圆。',
        tip: '灵活：打开肩关节囊。',
        titleEn: 'Elbow Circles',
        descEn: 'Fingertips on shoulders, draw big circles with elbows.',
        tipEn: 'Mobility: Opens shoulder capsule.',
        posture: 'standing',
        isSosSafe: true,
        bodyPartSlug: ['deltoids'],
        targetSlug: 'shoulder'
    },
    {
        id: 'sh_w',
        title: 'W字夹背',
        desc: '双臂举起呈W型，用力向后夹紧肩胛骨。',
        tip: '激活：针对圆肩驼背。',
        titleEn: 'W Squeeze',
        descEn: 'Arms in W shape, squeeze shoulder blades back hard.',
        tipEn: 'Activation: Fixes rounded shoulders.',
        posture: 'standing',
        isSosSafe: true,
        bodyPartSlug: ['trapezius', 'upper-back'],
        targetSlug: 'shoulder'
    },
    {
        id: 'sh_wall',
        title: '靠墙天使',
        desc: '背贴墙，手臂贴墙上下滑动。',
        tip: '检测：如果手贴不住墙，说明胸肌太紧。',
        titleEn: 'Wall Angels',
        descEn: 'Back to wall, slide arms up/down keeping contact.',
        tipEn: 'Check: Tight chest if arms pop off wall.',
        posture: 'standing',
        isSosSafe: true,
        bodyPartSlug: ['deltoids', 'trapezius'],
        targetSlug: 'shoulder'
    },
    {
        id: 'sh_door',
        title: '门框拉伸',
        desc: '手臂抵住门框，身体前倾拉伸胸部。',
        tip: '松解：释放胸小肌压力。',
        titleEn: 'Doorway Stretch',
        descEn: 'Arms on doorframe, lean forward to stretch chest.',
        tipEn: 'Release: Loosens tight pectorals.',
        posture: 'standing',
        isSosSafe: true,
        bodyPartSlug: ['pectorals'], // 胸肌归类到肩部关联
        targetSlug: 'shoulder'
    },
    {
        id: 'sh_eagle',
        title: '鹰式手臂',
        desc: '双臂相互缠绕，大臂抬平，感受后背拉伸。',
        tip: '深层：拉开肩胛骨缝隙。',
        titleEn: 'Eagle Arms',
        descEn: 'Wrap arms together, lift elbows. Feel back stretch.',
        tipEn: 'Deep: Opens space between scapulae.',
        posture: 'sitting',
        isSosSafe: true,
        bodyPartSlug: ['deltoids', 'upper-back'],
        targetSlug: 'shoulder'
    },

    // ==================== 3. 腰背 (Back) - 6+ 动作 ====================
    {
        id: 'bk_mckenzie',
        title: '麦肯基后伸',
        desc: '双手叉腰，缓慢向后仰，骨盆向前顶。',
        tip: '急救：腰突康复黄金动作。',
        titleEn: 'McKenzie Ext',
        descEn: 'Hands on hips, lean back slowly, push pelvis forward.',
        tipEn: 'SOS: Gold standard for disc issues.',
        posture: 'standing',
        isSosSafe: true,
        bodyPartSlug: ['lower-back'],
        targetSlug: 'lower-back'
    },
    {
        id: 'bk_cat',
        title: '坐姿猫牛',
        desc: '呼气拱背低头，吸气挺胸抬头。',
        tip: '律动：脊柱逐节运动。',
        titleEn: 'Seated Cat-Cow',
        descEn: 'Exhale round back, inhale arch back.',
        tipEn: 'Rhythm: Move spine segment by segment.',
        posture: 'sitting',
        isSosSafe: true,
        bodyPartSlug: ['lower-back', 'upper-back'],
        targetSlug: 'lower-back'
    },
    {
        id: 'bk_twist',
        title: '胸椎转体',
        desc: '坐姿固定骨盆，仅转动上半身向后看。',
        tip: '解压：释放胸腰结合部压力。',
        titleEn: 'Thoracic Twist',
        descEn: 'Keep hips still, rotate upper body to look back.',
        tipEn: 'Decompress: Releases thoracolumbar pressure.',
        posture: 'sitting',
        isSosSafe: false, // 急性期扭转需谨慎
        bodyPartSlug: ['obliques', 'upper-back'],
        targetSlug: 'lower-back'
    },
    {
        id: 'bk_lat',
        title: '侧腰拉伸',
        desc: '单手举过头顶向侧面弯腰。',
        tip: '空间：拉开腰椎间隙。',
        titleEn: 'Side Bend',
        descEn: 'Reach one arm over head, lean to side.',
        tipEn: 'Space: Opens lumbar gaps.',
        posture: 'standing',
        isSosSafe: true,
        bodyPartSlug: ['obliques', 'lower-back'],
        targetSlug: 'lower-back'
    },
    {
        id: 'bk_hinge',
        title: '髋铰链',
        desc: '保持背部挺直，仅折叠髋部前倾。',
        tip: '模式：学会用屁股受力而不是腰。',
        titleEn: 'Hip Hinge',
        descEn: 'Keep back flat, fold only at hips.',
        tipEn: 'Pattern: Load glutes not spine.',
        posture: 'standing',
        isSosSafe: false,
        bodyPartSlug: ['lower-back', 'hamstring'],
        targetSlug: 'lower-back'
    },
    {
        id: 'bk_child',
        title: '办公桌式',
        desc: '手扶桌面，背部下压，呈直角拉伸。',
        tip: '牵引：利用重力拉开脊柱。',
        titleEn: 'Desk Traction',
        descEn: 'Hands on desk, drop chest down to flatten back.',
        tipEn: 'Traction: Gravity assisted decompression.',
        posture: 'standing',
        isSosSafe: true,
        bodyPartSlug: ['upper-back', 'lower-back'],
        targetSlug: 'lower-back'
    },

    // ==================== 4. 核心 (Core) - 10+ 动作 ====================
    {
        id: 'cr_vacuum',
        title: '真空腹',
        desc: '呼气排空，吸腹贴脊柱，保持15秒。',
        tip: '深层：强化天然护腰（腹横肌）。',
        titleEn: 'Stomach Vacuum',
        descEn: 'Exhale fully, suck belly to spine, hold 15s.',
        tipEn: 'Deep: Strengthens nature\'s corset.',
        posture: 'sitting',
        isSosSafe: true,
        bodyPartSlug: ['rectus-abdominis'],
        targetSlug: 'core'
    },
    {
        id: 'cr_brace',
        title: '腹式呼吸',
        desc: '吸气肚子鼓起，呼气肚子收紧变硬。',
        tip: '基础：建立腹内压。',
        titleEn: 'Abdominal Brace',
        descEn: 'Inhale belly out, exhale squeeze core hard.',
        tipEn: 'Base: Builds intra-abdominal pressure.',
        posture: 'sitting',
        isSosSafe: true,
        bodyPartSlug: ['rectus-abdominis'],
        targetSlug: 'core'
    },
    {
        id: 'cr_leg_lift',
        title: '坐姿抬腿',
        desc: '坐直，单腿伸直抬起，保持核心收紧。',
        tip: '下腹：强化髂腰肌和下腹。',
        titleEn: 'Seated Leg Lift',
        descEn: 'Sit tall, lift one straight leg. Keep core tight.',
        tipEn: 'Lower: Hits hip flexors and lower abs.',
        posture: 'sitting',
        isSosSafe: true,
        bodyPartSlug: ['rectus-abdominis', 'quadriceps'],
        targetSlug: 'core'
    },
    {
        id: 'cr_press',
        title: '手膝对抗',
        desc: '双手用力向下按膝盖，大腿向上顶手，身体不动。',
        tip: '等长：安全高效的核心激活。',
        titleEn: 'Hand-Knee Press',
        descEn: 'Push hands onto knees, drive knees up. No movement.',
        tipEn: 'Isometric: Safe core activation.',
        posture: 'sitting',
        isSosSafe: true,
        bodyPartSlug: ['rectus-abdominis'],
        targetSlug: 'core'
    },
    {
        id: 'cr_rotate',
        title: '俄罗斯转体(空手)',
        desc: '坐姿，双脚离地微转体（如腰痛请脚着地）。',
        tip: '侧腹：强化腹斜肌。',
        titleEn: 'Seated Twist',
        descEn: 'Lean back slightly, rotate torso side to side.',
        tipEn: 'Obliques: Targets side abs.',
        posture: 'sitting',
        isSosSafe: false,
        bodyPartSlug: ['obliques'],
        targetSlug: 'core'
    },
    {
        id: 'cr_plank_desk',
        title: '桌面平板支撑',
        desc: '手肘撑在桌面上，身体呈直线保持30秒。',
        tip: '抗伸展：不要塌腰。',
        titleEn: 'Desk Plank',
        descEn: 'Elbows on desk, body straight, hold 30s.',
        tipEn: 'Anti-Ext: Do not sag hips.',
        posture: 'standing',
        isSosSafe: false,
        bodyPartSlug: ['rectus-abdominis'],
        targetSlug: 'core'
    },
    {
        id: 'cr_side_bend',
        title: '负重侧屈',
        desc: '单手提重物（如水壶），向对侧侧屈。',
        tip: '侧链：强化腰方肌。',
        titleEn: 'Loaded Side Bend',
        descEn: 'Hold weight one side, lean to opposite side.',
        tipEn: 'Lateral: Strengthens QL muscle.',
        posture: 'standing',
        isSosSafe: false,
        bodyPartSlug: ['obliques'],
        targetSlug: 'core'
    },
    {
        id: 'cr_deadbug_stand',
        title: '站姿死虫',
        desc: '抬左手抬右膝，缓慢下放，交替进行。',
        tip: '协调：大脑与核心的链接。',
        titleEn: 'Standing Deadbug',
        descEn: 'Lift left arm and right knee, switch slowly.',
        tipEn: 'Coordination: Brain-core connection.',
        posture: 'standing',
        isSosSafe: true,
        bodyPartSlug: ['rectus-abdominis'],
        targetSlug: 'core'
    },
    {
        id: 'cr_kegel',
        title: '凯格尔',
        desc: '收缩盆底肌（憋尿感），提肛。',
        tip: '底座：核心的地基。',
        titleEn: 'Kegels',
        descEn: 'Squeeze pelvic floor (stop pee feeling).',
        tipEn: 'Base: The floor of the core.',
        posture: 'sitting',
        isSosSafe: true,
        bodyPartSlug: ['gluteal'], // 近似
        targetSlug: 'core'
    },
    {
        id: 'cr_woodchop',
        title: '伐木动作',
        desc: '双手合十，从右上向左下用力劈砍。',
        tip: '爆发：旋转爆发力。',
        titleEn: 'Woodchoppers',
        descEn: 'Hands together, chop from high right to low left.',
        tipEn: 'Power: Rotational power.',
        posture: 'standing',
        isSosSafe: false,
        bodyPartSlug: ['obliques'],
        targetSlug: 'core'
    },

    // ==================== 5. 臀部 (Glutes) - 6+ 动作 ====================
    {
        id: 'gl_squeeze',
        title: '坐姿夹臀',
        desc: '用力夹紧屁股5秒，然后放松。',
        tip: '唤醒：防止死臀综合症。',
        titleEn: 'Chair Squeeze',
        descEn: 'Squeeze glutes hard 5s, relax.',
        tipEn: 'Wakeup: Prevents dead butt syndrome.',
        posture: 'sitting',
        isSosSafe: true,
        bodyPartSlug: ['gluteal'],
        targetSlug: 'gluteal'
    },
    {
        id: 'gl_kick',
        title: '直腿后踢',
        desc: '扶桌，单腿向后踢，腰不要动。',
        tip: '孤立：只用臀大肌发力。',
        titleEn: 'Straight Kickback',
        descEn: 'Hold desk, kick leg back. No back arch.',
        tipEn: 'Isolate: Glute max focus.',
        posture: 'standing',
        isSosSafe: false,
        bodyPartSlug: ['gluteal'],
        targetSlug: 'gluteal'
    },
    {
        id: 'gl_abduct',
        title: '站姿侧抬腿',
        desc: '扶桌，腿向侧面抬起30度。',
        tip: '中肌：强化臀中肌，稳定骨盆。',
        titleEn: 'Side Leg Raise',
        descEn: 'Hold desk, lift leg to side 30 deg.',
        tipEn: 'Medius: Stabilizes pelvis.',
        posture: 'standing',
        isSosSafe: false,
        bodyPartSlug: ['gluteal'],
        targetSlug: 'gluteal'
    },
    {
        id: 'gl_squat',
        title: '徒手深蹲',
        desc: '双脚宽距，屁股向后坐，膝盖不过脚尖。',
        tip: '功能：全身力量之源。',
        titleEn: 'Air Squat',
        descEn: 'Feet wide, sit hips back.',
        tipEn: 'Functional: Source of power.',
        posture: 'standing',
        isSosSafe: false,
        bodyPartSlug: ['gluteal', 'quadriceps'],
        targetSlug: 'gluteal'
    },
    {
        id: 'gl_lunge',
        title: '后撤步蹲',
        desc: '单腿向后迈一步下蹲。',
        tip: '单边：平衡左右肌力。',
        titleEn: 'Reverse Lunge',
        descEn: 'Step one leg back and drop hips.',
        tipEn: 'Unilateral: Fixes imbalances.',
        posture: 'standing',
        isSosSafe: false,
        bodyPartSlug: ['gluteal', 'quadriceps'],
        targetSlug: 'gluteal'
    },
    {
        id: 'gl_hip_thrust',
        title: '站姿顶髋',
        desc: '微屈膝，臀部用力向前顶，身体后仰。',
        tip: '锁定：终点夹紧臀部。',
        titleEn: 'Standing Hip Thrust',
        descEn: 'Soft knees, drive hips forward hard.',
        tipEn: 'Lockout: Squeeze at top.',
        posture: 'standing',
        isSosSafe: true,
        bodyPartSlug: ['gluteal'],
        targetSlug: 'gluteal'
    },

    // ==================== 6. 腿部 (Legs: Thigh/Calf) - 6+ 动作 ====================
    {
        id: 'lg_calf',
        title: '提踵(踮脚)',
        desc: '扶桌，脚跟尽可能抬高，缓慢下放。',
        tip: '泵：促进下肢血液回流心脏。',
        titleEn: 'Calf Raises',
        descEn: 'Lift heels high, lower slowly.',
        tipEn: 'Pump: Boosts blood return.',
        posture: 'standing',
        isSosSafe: true,
        bodyPartSlug: ['calves'],
        targetSlug: 'leg'
    },
    {
        id: 'lg_quad',
        title: '股四头肌拉伸',
        desc: '单手扶桌，另一手抓脚踝拉向臀部。',
        tip: '放松：缓解大腿前侧紧张。',
        titleEn: 'Quad Stretch',
        descEn: 'Hold desk, pull ankle to butt.',
        tipEn: 'Relax: Loosens tight quads.',
        posture: 'standing',
        isSosSafe: false,
        bodyPartSlug: ['quadriceps'],
        targetSlug: 'leg'
    },
    {
        id: 'lg_ham',
        title: '腘绳肌拉伸',
        desc: '脚跟搭在矮凳上，身体前倾压腿。',
        tip: '柔韧：防止骨盆后倾。',
        titleEn: 'Hamstring Stretch',
        descEn: 'Heel on stool, lean forward.',
        tipEn: 'Flexibility: Prevents posterior tilt.',
        posture: 'standing',
        isSosSafe: true,
        bodyPartSlug: ['hamstring'],
        targetSlug: 'leg'
    },
    {
        id: 'lg_sit_ext',
        title: '坐姿踢腿',
        desc: '坐姿，用力伸直膝盖，脚尖回勾。',
        tip: '膝盖：强化膝关节稳定性。',
        titleEn: 'Seated Knee Ext',
        descEn: 'Sit, kick leg straight, flex foot.',
        tipEn: 'Knee: Joint stability.',
        posture: 'sitting',
        isSosSafe: true,
        bodyPartSlug: ['quadriceps'],
        targetSlug: 'leg'
    },
    {
        id: 'lg_march',
        title: '高抬腿原地走',
        desc: '原地踏步，膝盖尽量抬高过腰。',
        tip: '循环：激活髋屈肌。',
        titleEn: 'High Knees March',
        descEn: 'March in place, knees high.',
        tipEn: 'Circulation: Activates hip flexors.',
        posture: 'standing',
        isSosSafe: true,
        bodyPartSlug: ['quadriceps', 'hamstring'],
        targetSlug: 'leg'
    },
    {
        id: 'lg_wall_sit',
        title: '靠墙静蹲',
        desc: '背靠墙屈膝下蹲，保持静止。',
        tip: '耐力：大腿前侧燃烧感。',
        titleEn: 'Wall Sit',
        descEn: 'Sit against wall, hold static.',
        tipEn: 'Endurance: Quads burn.',
        posture: 'standing',
        isSosSafe: false,
        bodyPartSlug: ['quadriceps'],
        targetSlug: 'leg'
    }
];