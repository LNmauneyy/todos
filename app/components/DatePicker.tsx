import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View, useColorScheme } from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { palettes, radius, shadow, spacing, typography } from '../../constants/design-tokens';
import { addDays, daysInMonth, firstWeekday, fromISODate, MONTH_LABELS, today, toISODate, WEEKDAY_LABELS } from '../../lib/date';

interface DatePickerProps {
  visible: boolean;
  value: string | null;
  onChange: (date: string | null) => void;
  onClose: () => void;
}

export default function DatePicker({ visible, value, onChange, onClose }: DatePickerProps) {
  const scheme = useColorScheme();
  const palette = palettes[scheme === 'dark' ? 'dark' : 'light'];
  const styles = useMemo(() => makeStyles(palette), [palette]);

  const initial = value ? fromISODate(value) : new Date();
  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth());

  const todayIso = today();
  const presets: { label: string; iso: string }[] = [
    { label: 'Today', iso: todayIso },
    { label: 'Tomorrow', iso: addDays(todayIso, 1) },
    { label: 'Next Week', iso: addDays(todayIso, 7) },
  ];

  const grid = useMemo(() => {
    const total = daysInMonth(viewYear, viewMonth);
    const offset = firstWeekday(viewYear, viewMonth);
    const cells: (number | null)[] = Array.from({ length: offset }, () => null);
    for (let day = 1; day <= total; day++) cells.push(day);
    return cells;
  }, [viewYear, viewMonth]);

  const changeMonth = (delta: number) => {
    Haptics.selectionAsync();
    let m = viewMonth + delta;
    let y = viewYear;
    if (m < 0) { m = 11; y -= 1; }
    if (m > 11) { m = 0; y += 1; }
    setViewMonth(m);
    setViewYear(y);
  };

  const selectDay = (day: number) => {
    const iso = toISODate(new Date(viewYear, viewMonth, day));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onChange(iso);
    onClose();
  };

  const selectPreset = (iso: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onChange(iso);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View entering={FadeIn.duration(180)} exiting={FadeOut.duration(150)} style={StyleSheet.absoluteFill}>
        <Pressable style={styles.backdrop} onPress={onClose} />
      </Animated.View>
      <View style={styles.centerWrap} pointerEvents="box-none">
        <Animated.View
          entering={SlideInDown.springify().damping(18).stiffness(180)}
          exiting={SlideOutDown.duration(160)}
          style={[styles.sheet, shadow.soft]}
        >
          <BlurView intensity={40} tint={palette.blurTint} style={StyleSheet.absoluteFill} />
          <View style={styles.sheetContent}>
            <View style={styles.presetRow}>
              {presets.map((p) => (
                <TouchableOpacity key={p.label} style={styles.presetChip} onPress={() => selectPreset(p.iso)}>
                  <Text style={styles.presetChipText}>{p.label}</Text>
                </TouchableOpacity>
              ))}
              {value && (
                <TouchableOpacity style={styles.clearChip} onPress={() => { Haptics.selectionAsync(); onChange(null); onClose(); }}>
                  <Ionicons name="close-circle" size={16} color={palette.danger} />
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.monthRow}>
              <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.monthNavBtn}>
                <Ionicons name="chevron-back" size={20} color={palette.text} />
              </TouchableOpacity>
              <Text style={styles.monthLabel}>{MONTH_LABELS[viewMonth]} {viewYear}</Text>
              <TouchableOpacity onPress={() => changeMonth(1)} style={styles.monthNavBtn}>
                <Ionicons name="chevron-forward" size={20} color={palette.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.weekdayRow}>
              {WEEKDAY_LABELS.map((w, i) => (
                <Text key={`${w}-${i}`} style={styles.weekdayLabel}>{w}</Text>
              ))}
            </View>

            <View style={styles.grid}>
              {grid.map((day, idx) => {
                if (day === null) return <View key={`b-${idx}`} style={styles.cell} />;
                const iso = toISODate(new Date(viewYear, viewMonth, day));
                const isSelected = iso === value;
                const isToday = iso === todayIso;
                return (
                  <TouchableOpacity key={iso} style={styles.cell} onPress={() => selectDay(day)}>
                    <View style={[
                      styles.dayCircle,
                      isSelected && { backgroundColor: palette.accent },
                      !isSelected && isToday && { borderWidth: 1.5, borderColor: palette.accent },
                    ]}>
                      <Text style={[
                        styles.dayText,
                        isSelected && { color: '#FFF', fontWeight: '800' },
                      ]}>{day}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const makeStyles = (palette: typeof palettes.light) => StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(8,10,20,0.45)' },
  centerWrap: { position: 'absolute', left: 0, right: 0, bottom: 0, alignItems: 'center' },
  sheet: {
    width: '92%',
    marginBottom: spacing.xl,
    borderRadius: radius.xl,
    overflow: 'hidden',
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
  },
  sheetContent: {
    padding: spacing.lg,
    zIndex: 1,
  },
  presetRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  presetChip: {
    paddingVertical: spacing.sm, paddingHorizontal: spacing.md,
    backgroundColor: palette.accentSoft, borderRadius: radius.pill,
  },
  presetChipText: { color: palette.accent, fontWeight: '700', fontSize: 13 },
  clearChip: { padding: spacing.sm, justifyContent: 'center' },
  monthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  monthNavBtn: { padding: spacing.xs },
  monthLabel: { ...typography.heading, color: palette.text },
  weekdayRow: { flexDirection: 'row' },
  weekdayLabel: { flex: 1, textAlign: 'center', color: palette.textFaint, fontSize: 12, fontWeight: '700' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  dayCircle: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  dayText: { color: palette.text, fontSize: 14, fontWeight: '600' },
});
