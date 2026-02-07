import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

type ActivityItem = {
  date?: string;
  standCount?: number;
};

type PainChartProps = {
  data: ActivityItem[];
  emptyText: string;
  activeColor?: string;
  inactiveColor?: string;
  valueColor?: string;
  dateColor?: string;
  emptyColor?: string;
};

export function PainChart({
  data,
  emptyText,
  activeColor = '#00d4ff',
  inactiveColor = '#345',
  valueColor = '#fff',
  dateColor = '#567',
  emptyColor = '#6b7d8f',
}: PainChartProps) {
  if (!data || data.length === 0) {
    return <Text style={[styles.emptyText, { color: emptyColor }]}>{emptyText}</Text>;
  }

  const chartData = data.slice(-7);
  const maxVal = Math.max(...chartData.map((item) => item.standCount || 0), 5);

  return (
    <View style={styles.chartContainer}>
      {chartData.map((item, index) => {
        const standCount = item.standCount || 0;

        return (
          <View key={`${item.date || 'day'}-${index}`} style={styles.barGroup}>
            <View
              style={[
                styles.bar,
                {
                  height: (standCount / maxVal) * 150,
                  backgroundColor: standCount >= 8 ? activeColor : inactiveColor,
                },
              ]}
            />
            <Text style={[styles.barValue, { color: valueColor }]}>{standCount}</Text>
            <Text style={[styles.barDate, { color: dateColor }]}>{item.date ? item.date.slice(5) : '-'}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 200,
    paddingBottom: 10,
  },
  barGroup: { alignItems: 'center', gap: 5 },
  bar: { width: 14, borderRadius: 7, minHeight: 4 },
  barValue: { fontSize: 10 },
  barDate: { fontSize: 10 },
  emptyText: { textAlign: 'center', marginTop: 30, marginBottom: 30 },
});
