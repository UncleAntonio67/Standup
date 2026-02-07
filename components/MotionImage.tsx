import React, { useEffect, useState } from 'react';
import { ImageStyle, StyleProp } from 'react-native';
import { Image, ImageSource } from 'expo-image';

type MotionImageProps = {
  sources: ImageSource[];
  style: StyleProp<ImageStyle>;
  intervalMs?: number;
};

export function MotionImage({ sources, style, intervalMs = 900 }: MotionImageProps) {
  const safe = sources && sources.length ? sources : [];
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    setIdx(0);
  }, [safe.length]);

  useEffect(() => {
    if (safe.length <= 1) return;
    const timer = setInterval(() => {
      setIdx((prev) => (prev + 1) % safe.length);
    }, intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs, safe.length]);

  if (!safe.length) return null;

  return <Image source={safe[idx]} style={style} contentFit="cover" />;
}
