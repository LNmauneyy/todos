import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useMemo, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, View, useColorScheme } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import AddTodo from './components/addTodo';
import Card from './components/card';
import TagFilterBar from './components/TagFilterBar';
import { palettes, spacing, typography } from '../constants/design-tokens';
import { fetchAllTags, fetchTodos } from '../lib/db';
import type { Tag, Todo } from '../types/todo';
import { useFocusEffect } from 'expo-router';

export default function Index() {
  const db = useSQLiteContext();
  const scheme = useColorScheme();
  const palette = palettes[scheme === 'dark' ? 'dark' : 'light'];
  const styles = useMemo(() => makeStyles(palette), [palette]);

  const [todos, setTodos] = useState<Todo[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [activeTagIds, setActiveTagIds] = useState<Set<number>>(new Set());

  const load = useCallback(async () => {
    try {
      const [todoRows, tagRows] = await Promise.all([fetchTodos(db), fetchAllTags(db)]);
      setTodos(todoRows);
      setTags(tagRows);
    } catch (err: any) {
      Alert.alert('Cannot read todos.', err.message);
    }
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const toggleTagFilter = (tagId: number) => {
    setActiveTagIds((prev) => {
      const next = new Set(prev);
      if (next.has(tagId)) next.delete(tagId);
      else next.add(tagId);
      return next;
    });
  };

  const visibleTodos = useMemo(() => {
    if (activeTagIds.size === 0) return todos;
    return todos.filter((t) => t.tags.some((tag) => activeTagIds.has(tag.id)));
  }, [todos, activeTagIds]);

  const remaining = todos.filter((t) => !t.completed).length;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Text style={styles.title}>Todos</Text>
        <Text style={styles.subtitle}>
          {remaining === 0 ? 'All caught up' : `${remaining} task${remaining === 1 ? '' : 's'} remaining`}
        </Text>
      </View>

      <TagFilterBar
        tags={tags}
        activeTagIds={activeTagIds}
        onToggle={toggleTagFilter}
        onClear={() => setActiveTagIds(new Set())}
      />

      <FlatList
        data={visibleTodos}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => <Card todo={item} refresh={load} />}
        ListEmptyComponent={() => (
          <Animated.View entering={FadeIn.duration(300)} style={styles.empty}>
            <Text style={styles.emptyEmoji}>✨</Text>
            <Text style={styles.emptyText}>No todos found.</Text>
            <Text style={styles.emptySubtext}>Tap + to add your first task.</Text>
          </Animated.View>
        )}
      />

      <AddTodo refresh={load} existingTags={tags} />
    </SafeAreaView>
  );
}

const makeStyles = (palette: typeof palettes.light) => StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.background },
  header: { paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: spacing.sm },
  title: { ...typography.title, color: palette.text },
  subtitle: { ...typography.body, color: palette.textMuted, marginTop: 2 },
  list: { paddingHorizontal: spacing.lg, paddingBottom: 120, paddingTop: spacing.sm, flexGrow: 1 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: spacing.xxl * 2, gap: spacing.xs },
  emptyEmoji: { fontSize: 40 },
  emptyText: { ...typography.heading, color: palette.text },
  emptySubtext: { ...typography.body, color: palette.textMuted },
});
