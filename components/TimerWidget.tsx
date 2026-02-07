import React from 'react';
import { Text, View } from 'react-native';

type TimerWidgetProps = {
  styles: any;
  title: string;
  minutes: string;
  seconds: string;
  status: string;
  isAlarm: boolean;
  dangerColor: string;
  titleColor?: string;
  timeColor?: string;
  dimColor?: string;
  cardStyle?: any;
};

export function TimerWidget({
  styles,
  title,
  minutes,
  seconds,
  status,
  isAlarm,
  dangerColor,
  titleColor,
  timeColor,
  dimColor,
  cardStyle,
}: TimerWidgetProps) {
  return (
    <View style={[styles.timerCard, cardStyle]}>
      <Text style={[styles.cardLabel, titleColor ? { color: titleColor } : null]}>{title}</Text>
      <View style={styles.timerContainer}>
        <Text style={[styles.timerValue, timeColor ? { color: timeColor } : null, isAlarm && { color: dangerColor }]}>{minutes}</Text>
        <Text style={[styles.timerColon, dimColor ? { color: dimColor } : null, isAlarm && { color: dangerColor }]}>:</Text>
        <Text style={[styles.timerValue, timeColor ? { color: timeColor } : null, isAlarm && { color: dangerColor }]}>{seconds}</Text>
      </View>
      <Text style={[styles.timerStatus, dimColor ? { color: dimColor } : null, isAlarm && { color: dangerColor }]}>{status}</Text>
    </View>
  );
}
