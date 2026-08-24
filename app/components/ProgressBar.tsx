import { useEffect, useMemo } from 'react';
import { StyleSheet, View, useColorScheme } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { palettes, radius } from '../../constants/design-tokens';

interface ProgressBarProps {
  createdAt: string;
  dueDate: string;
  completed: boolean;
}

// Progress = time elapsed between creation and due date. Color escalates as the
// deadline approaches so the card communicates urgency at a glance.
export default function ProgressBar({ createdAt, dueDate, completed }: ProgressBarProps) {
  const scheme = useColorScheme();
  const palette = palettes[scheme === 'dark' ? 'dark' : 'light'];

  const ratio = useMemo(() => {
    const start = new Date(createdAt).getTime();
    const end = new Date(`${dueDate}T23:59:59`).getTime();
    const now = Date.now();
    if (!(end > start)) return 1;
    return Math.min(1, Math.max(0, (now - start) / (end - start)));
  }, [createdAt, dueDate]);

  const width = useSharedValue(0);
  useEffect(() => {
    width.value = withTiming(ratio, { duration: 700 });
  }, [ratio, width]);

  const barColor = completed
    ? palette.success
    : ratio >= 1
      ? palette.danger
      : ratio >= 0.7
        ? palette.warning
        : palette.accent;

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${width.value * 100}%`,
    backgroundColor: barColor,
  }));

  return (
    <View style={[styles.track, { backgroundColor: `${barColor}22` }]}>
      <Animated.View style={[styles.fill, animatedStyle]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { height: 5, borderRadius: radius.pill, overflow: 'hidden', width: '100%' },
  fill: { height: '100%', borderRadius: radius.pill },
});
