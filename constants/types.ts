export type PostureType = 'sitting' | 'standing' | 'lying';

export interface Exercise {
    id: string;
    title: string;
    desc: string;
    tip: string;
    posture: PostureType;
    tags: string[];
}

export interface PainLog {
    date: string;       // YYYY-MM-DD
    level: number;      // 0-10
}

// [新增] 用户设置
export interface UserSettings {
    limitMin: number;   // 久坐阈值 (分钟)
}

// [新增] 每日活动统计
export interface DailyActivity {
    date: string;       // YYYY-MM-DD
    standCount: number; // 站立次数
    sitMinutes: number; // 久坐总时长 (分钟) - 预留字段
}