import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useSQLiteContext } from 'expo-sqlite';
import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View, useColorScheme } from 'react-native';
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { palettes, radius, shadow, spacing, typography } from '../../constants/design-tokens';
import { daysUntil, formatFriendlyDate } from '../../lib/date';
import { deleteTodo, toggleTodoCompleted } from '../../lib/db';
import type { Todo } from '../../types/todo';
import ProgressBar from './ProgressBar';

interface CardProps {
  todo: Todo;
  refresh: () => void;
}

export default function Card({ todo, refresh }: CardProps) {
  const db = useSQLiteContext();
  const scheme = useColorScheme();
  const palette = palettes[scheme === 'dark' ? 'dark' : 'light'];
  const styles = useMemo(() => makeStyles(palette), [palette]);
  const scale = useSharedValue(1);

  const isCompleted = !!todo.completed;
  const urgencyLabel = useMemo(() => {
    if (!todo.dueDate) return null;
    const remaining = daysUntil(todo.dueDate);
    if (isCompleted) return null;
    if (remaining < 0) return 'Overdue';
    return formatFriendlyDate(todo.dueDate);
  }, [todo.dueDate, isCompleted]);

  const isOverdue = !isCompleted && !!todo.dueDate && daysUntil(todo.dueDate) < 0;

  const setCompleted = async () => {
    scale.value = withSpring(0.97, { damping: 12 }, () => {
      scale.value = withSpring(1, { damping: 12 });
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await toggleTodoCompleted(db, todo.id, (todo.completed + 1) % 2);
      refresh();
    } catch (err: any) {
      Alert.alert(err.message);
    }
  };

  const removeTodo = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert('Are you sure?', `Do you really want to delete "${todo.title}"?`, [
      { text: 'Cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteTodo(db, todo.id);
            refresh();
          } catch (err: any) {
            Alert.alert(err.message);
          }
        },
      },
    ]);
  };

  const cardAnimatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View entering={FadeIn.duration(220)}>
      <Swipeable
        friction={2}
        rightThreshold={48}
        overshootFriction={8}
        renderRightActions={() => (
          <TouchableOpacity style={styles.deleteAction} onPress={removeTodo}>
            <Ionicons name="trash" size={22} color="#FFF" />
          </TouchableOpacity>
        )}
      >
        <Animated.View style={[styles.card, shadow.card, cardAnimatedStyle]}>
          <BlurView intensity={30} tint={palette.blurTint} style={StyleSheet.absoluteFill} />
          <View style={styles.contentRow}>
            <TouchableOpacity style={styles.checkCircle} onPress={setCompleted} hitSlop={8}>
              {isCompleted ? (
                <View style={[styles.checkFilled, { backgroundColor: palette.success }]}>
                  <Ionicons name="checkmark" size={16} color="#FFF" />
                </View>
              ) : (
                <View style={[styles.checkEmpty, { borderColor: palette.accent }]} />
              )}
            </TouchableOpacity>

            <View style={styles.body}>
              <Text
                style={[
                  styles.title,
                  isCompleted && { color: palette.textFaint, textDecorationLine: 'line-through' },
                ]}
                numberOfLines={2}
              >
                {todo.title}
              </Text>

              {(todo.tags.length > 0 || urgencyLabel) && (
                <View style={styles.metaRow}>
                  {urgencyLabel && (
                    <View style={[styles.dateBadge, { backgroundColor: isOverdue ? palette.dangerSoft : palette.accentSoft }]}>
                      <Ionicons name="time-outline" size={12} color={isOverdue ? palette.danger : palette.accent} />
                      <Text style={[styles.dateBadgeText, { color: isOverdue ? palette.danger : palette.accent }]}>{urgencyLabel}</Text>
                    </View>
                  )}
                  {todo.tags.map((tag) => (
                    <View key={tag.id} style={[styles.tagChip, { backgroundColor: `${tag.color}22` }]}>
                      <Text style={[styles.tagChipText, { color: tag.color }]}>{tag.name}</Text>
                    </View>
                  ))}
                </View>
              )}

              {todo.dueDate && !isCompleted && (
                <View style={styles.progressWrap}>
                  <ProgressBar createdAt={todo.createdAt} dueDate={todo.dueDate} completed={isCompleted} />
                </View>
              )}
            </View>
          </View>
        </Animated.View>
      </Swipeable>
    </Animated.View>
  );
}

const makeStyles = (palette: typeof palettes.light) => StyleSheet.create({
  card: {
    padding: spacing.lg,
    marginVertical: spacing.xs,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    zIndex: 1,
  },
  checkCircle: { marginTop: 2 },
  checkEmpty: { width: 24, height: 24, borderRadius: 12, borderWidth: 2 },
  checkFilled: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, gap: spacing.sm },
  title: { ...typography.body, fontSize: 16, color: palette.text },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, alignItems: 'center' },
  dateBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 3, paddingHorizontal: 8, borderRadius: radius.pill },
  dateBadgeText: { fontSize: 11, fontWeight: '700' },
  tagChip: { paddingVertical: 3, paddingHorizontal: 8, borderRadius: radius.pill },
  tagChipText: { fontSize: 11, fontWeight: '700' },
  progressWrap: { marginTop: 2 },
  deleteAction: {
    justifyContent: 'center', alignItems: 'center',
    width: 64, marginVertical: spacing.xs,
    backgroundColor: palette.danger, borderRadius: radius.lg,
  },
});
