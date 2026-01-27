import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EXERCISE_DATA } from '../../constants/data';
import { useStorage } from '../../hooks/useStorage';

export default function LibraryScreen() {
    const { isSosMode, recordExercise } = useStorage();
    const [filter, setFilter] = useState<'all' | 'sitting' | 'standing'>('all');

    // 核心筛选逻辑
    const filteredData = EXERCISE_DATA.filter(item => {
        // 1. 姿势筛选
        if (filter !== 'all' && item.posture !== filter) return false;
        // 2. SOS 安全筛选 (如果开了SOS，只显示 isSosSafe=true 的)
        if (isSosMode && !item.isSosSafe) return false;
        return true;
    });

    const handleDoExercise = (item: typeof EXERCISE_DATA[0]) => {
        // 记录肌肉训练数据
        recordExercise(item.bodyPartSlug);
        Alert.alert("打卡成功", `部位 ${item.bodyPartSlug.join(', ')} 热力值已增加！`);
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>动作矫正库</Text>
                {isSosMode && <Text style={styles.sosBadge}>🚨 SOS模式已开启</Text>}
            </View>

            {/* 过滤器 */}
            <View style={styles.filterRow}>
                <TouchableOpacity
                    onPress={() => setFilter('all')}
                    style={[styles.chip, filter === 'all' && styles.chipActive]}
                >
                    <Text style={[styles.chipText, filter === 'all' && { color: '#000' }]}>全部</Text>
                </TouchableOpacity>

                {/* 重点：隐形锻炼分类 */}
                <TouchableOpacity
                    onPress={() => setFilter('sitting')}
                    style={[styles.chip, filter === 'sitting' && styles.chipActive]}
                >
                    <Text style={[styles.chipText, filter === 'sitting' && { color: '#000' }]}>🪑 隐形/坐姿 (防尴尬)</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => setFilter('standing')}
                    style={[styles.chip, filter === 'standing' && styles.chipActive]}
                >
                    <Text style={[styles.chipText, filter === 'standing' && { color: '#000' }]}>🧍 工位/站姿</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={filteredData}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                    <TouchableOpacity onPress={() => handleDoExercise(item)}>
                        <View style={[styles.card, !item.isSosSafe && isSosMode && {opacity: 0.3}]}>
                            <View style={styles.row}>
                                <Text style={styles.cardTitle}>{item.title}</Text>
                                <View style={[styles.badge, item.posture === 'sitting' ? {backgroundColor:'#0f8'} : {backgroundColor:'#00d4ff'}]}>
                                    <Text style={styles.badgeText}>{item.posture === 'sitting' ? '隐形' : '站姿'}</Text>
                                </View>
                            </View>
                            <Text style={styles.desc}>{item.desc}</Text>
                            <View style={styles.footer}>
                                <Text style={styles.tip}>💡 {item.tip}</Text>
                                <Text style={styles.checkBtn}>点击打卡 +1</Text>
                            </View>
                        </View>
                    </TouchableOpacity>
                )}
                contentContainerStyle={{ padding: 15, paddingBottom: 50 }}
                ListEmptyComponent={
                    <Text style={styles.emptyText}>当前模式下没有推荐动作，请休息。</Text>
                }
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#020508' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
    headerTitle: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
    sosBadge: { color: '#ff4d4d', fontWeight: 'bold', borderWidth: 1, borderColor: '#ff4d4d', padding: 4, borderRadius: 4, fontSize: 12 },

    filterRow: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 15, gap: 10 },
    chip: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1, borderColor: '#345' },
    chipActive: { backgroundColor: '#00d4ff', borderColor: '#00d4ff' },
    chipText: { color: '#89a', fontSize: 12, fontWeight: 'bold' },

    card: { backgroundColor: '#162636', padding: 15, borderRadius: 12, marginBottom: 15, borderLeftWidth: 3, borderLeftColor: '#345' },
    row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    cardTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    badgeText: { color: '#000', fontSize: 10, fontWeight: 'bold' },
    desc: { color: '#ccc', fontSize: 13, marginBottom: 8, lineHeight: 18 },
    footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 5 },
    tip: { color: '#89a', fontSize: 11, fontStyle: 'italic', flex: 1 },
    checkBtn: { color: '#00d4ff', fontSize: 10, fontWeight: 'bold', borderWidth: 1, borderColor: '#00d4ff', padding: 4, borderRadius: 4 },
    emptyText: { color: '#567', textAlign: 'center', marginTop: 50 }
});