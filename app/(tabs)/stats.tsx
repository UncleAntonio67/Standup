import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStorage } from '../../hooks/useStorage';

export default function StatsScreen() {
    const { activityHistory } = useStorage();

    const renderChart = () => {
        // [修复重点] 绝对安全检查：如果 undefined 或 长度为0，显示空状态
        if (!activityHistory || activityHistory.length === 0) {
            return <Text style={styles.emptyText}>暂无历史数据，请在主页完成一次任务</Text>;
        }

        const data = activityHistory.slice(-7);
        const maxVal = Math.max(...data.map(d => d.standCount), 5);

        return (
            <View style={styles.chartContainer}>
                {data.map((item, index) => (
                    <View key={index} style={styles.barGroup}>
                        <View style={[styles.bar, {
                            height: (item.standCount / maxVal) * 150,
                            backgroundColor: item.standCount >= 8 ? '#00d4ff' : '#345'
                        }]} />
                        <Text style={styles.barValue}>{item.standCount}</Text>
                        {/* 增加 date 存在的检查 */}
                        <Text style={styles.barDate}>{item.date ? item.date.slice(5) : '-'}</Text>
                    </View>
                ))}
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.title}>历史统计</Text>
            <ScrollView contentContainerStyle={{ padding: 20 }}>
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>近7日活动趋势</Text>
                    {renderChart()}
                </View>
                <Text style={styles.tip}>* 数据来源于主页任务完成情况</Text>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#050a10' },
    title: { color: '#fff', fontSize: 20, fontWeight: 'bold', padding: 20 },
    card: { backgroundColor: '#0f1926', padding: 20, borderRadius: 12, borderWidth: 1, borderColor: '#1e3a52' },
    cardTitle: { color: '#00d4ff', fontSize: 14, fontWeight: 'bold', marginBottom: 20 },
    chartContainer: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end', height: 200, paddingBottom: 10 },
    barGroup: { alignItems: 'center', gap: 5 },
    bar: { width: 14, borderRadius: 7, minHeight: 4 },
    barValue: { color: '#fff', fontSize: 10 },
    barDate: { color: '#567', fontSize: 10 },
    emptyText: { color: '#6b7d8f', textAlign: 'center', marginTop: 30, marginBottom: 30 },
    tip: { color: '#6b7d8f', textAlign: 'center', marginTop: 20, fontSize: 10 }
});