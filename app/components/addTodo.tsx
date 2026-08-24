import { zodResolver } from '@hookform/resolvers/zod';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useSQLiteContext } from 'expo-sqlite';
import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, Modal, Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View, useColorScheme } from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { z } from 'zod';
import { palettes, radius, shadow, spacing, typography } from '../../constants/design-tokens';
import { formatFriendlyDate } from '../../lib/date';
import { createTodo } from '../../lib/db';
import type { Tag } from '../../types/todo';
import DatePicker from './DatePicker';
import TagPicker from './TagPicker';

const todoSchema = z.object({
  title: z.string().min(1, 'Give your todo a title').max(120, 'Keep it under 120 characters'),
  dueDate: z.string().nullable(),
  tags: z.array(z.object({ id: z.number(), name: z.string(), color: z.string() })),
});

type TodoFormValues = z.infer<typeof todoSchema>;

interface AddTodoProps {
  refresh: () => void;
  existingTags: Tag[];
}

export default function AddTodo({ refresh, existingTags }: AddTodoProps) {
  const db = useSQLiteContext();
  const scheme = useColorScheme();
  const palette = palettes[scheme === 'dark' ? 'dark' : 'light'];
  const styles = useMemo(() => makeStyles(palette), [palette]);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<TodoFormValues>({
    resolver: zodResolver(todoSchema),
    defaultValues: { title: '', dueDate: null, tags: [] },
  });

  const dueDate = watch('dueDate');
  const tags = watch('tags');

  const openSheet = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSheetOpen(true);
  };

  const closeSheet = () => {
    setSheetOpen(false);
    reset();
  };

  const onSubmit = async (values: TodoFormValues) => {
    try {
      await createTodo(db, { title: values.title.trim(), dueDate: values.dueDate, tags: values.tags });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      refresh();
      closeSheet();
    } catch (err: any) {
      Alert.alert(err.message);
    }
  };

  return (
    <>
      <TouchableOpacity style={[styles.fab, shadow.soft]} onPress={openSheet} activeOpacity={0.85}>
        <Ionicons name="add" size={28} color="#FFF" />
      </TouchableOpacity>

      <Modal visible={sheetOpen} transparent animationType="none" onRequestClose={closeSheet}>
        <Animated.View entering={FadeIn.duration(180)} exiting={FadeOut.duration(150)} style={StyleSheet.absoluteFill}>
          <Pressable style={styles.backdrop} onPress={closeSheet} />
        </Animated.View>
        <View style={styles.sheetWrap} pointerEvents="box-none">
          <Animated.View
            entering={SlideInDown.springify().damping(18).stiffness(180)}
            exiting={SlideOutDown.duration(160)}
            style={[styles.sheet, shadow.soft]}
          >
            <BlurView intensity={50} tint={palette.blurTint} style={StyleSheet.absoluteFill} />
            <View style={styles.sheetContent}>
              <View style={styles.handle} />
              <Text style={styles.sheetTitle}>New Todo</Text>

              <Controller
                control={control}
                name="title"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    style={styles.input}
                    placeholder="What needs to be done?"
                    placeholderTextColor={palette.textFaint}
                    value={value}
                    onChangeText={onChange}
                    autoFocus
                  />
                )}
              />
              {errors.title && <Text style={styles.errorText}>{errors.title.message}</Text>}

              <TouchableOpacity style={styles.dateRow} onPress={() => setDatePickerOpen(true)}>
                <Ionicons name="calendar-outline" size={18} color={palette.accent} />
                <Text style={styles.dateRowText}>
                  {dueDate ? formatFriendlyDate(dueDate) : 'Set a due date'}
                </Text>
              </TouchableOpacity>

              <View style={styles.tagSection}>
                <TagPicker
                  selected={tags}
                  suggestions={existingTags}
                  onChange={(next) => setValue('tags', next)}
                />
              </View>

              <TouchableOpacity
                style={[styles.submitBtn, isSubmitting && { opacity: 0.6 }]}
                onPress={handleSubmit(onSubmit)}
                disabled={isSubmitting}
              >
                <Text style={styles.submitBtnText}>Add Todo</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>

      <DatePicker
        visible={datePickerOpen}
        value={dueDate}
        onChange={(iso) => setValue('dueDate', iso)}
        onClose={() => setDatePickerOpen(false)}
      />
    </>
  );
}

const makeStyles = (palette: typeof palettes.light) => StyleSheet.create({
  fab: {
    position: 'absolute', right: spacing.xl, bottom: spacing.xxl,
    width: 58, height: 58, borderRadius: 29,
    backgroundColor: palette.accent, alignItems: 'center', justifyContent: 'center',
    zIndex: 10,
  },
  backdrop: { flex: 1, backgroundColor: 'rgba(8,10,20,0.45)' },
  sheetWrap: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  sheet: {
    borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl,
    overflow: 'hidden',
    backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.border, borderBottomWidth: 0,
  },
  sheetContent: {
    padding: spacing.xl, gap: spacing.md, zIndex: 1,
  },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: palette.border, alignSelf: 'center', marginBottom: spacing.xs },
  sheetTitle: { ...typography.title, fontSize: 22, color: palette.text },
  input: {
    borderWidth: 1.5, borderColor: palette.fieldBorder, borderRadius: radius.md,
    padding: spacing.md, color: palette.text, fontSize: 16, backgroundColor: palette.fieldBackground,
  },
  errorText: { color: palette.danger, fontSize: 12, fontWeight: '600', marginTop: -spacing.sm },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dateRowText: { color: palette.accent, fontWeight: '700', fontSize: 14 },
  tagSection: { marginTop: spacing.xs },
  submitBtn: {
    backgroundColor: palette.accent, borderRadius: radius.md,
    paddingVertical: spacing.md, alignItems: 'center', marginTop: spacing.sm,
  },
  submitBtnText: { color: '#FFF', fontWeight: '800', fontSize: 16 },
});
