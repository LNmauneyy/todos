import * as Haptics from 'expo-haptics';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, useColorScheme } from 'react-native';
import { palettes, radius, spacing } from '../../constants/design-tokens';
import type { Tag } from '../../types/todo';

interface TagFilterBarProps {
  tags: Tag[];
  activeTagIds: Set<number>;
  onToggle: (tagId: number) => void;
  onClear: () => void;
}

export default function TagFilterBar({ tags, activeTagIds, onToggle, onClear }: TagFilterBarProps) {
  const scheme = useColorScheme();
  const palette = palettes[scheme === 'dark' ? 'dark' : 'light'];
  const styles = useMemo(() => makeStyles(palette), [palette]);

  if (tags.length === 0) return null;

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bar} contentContainerStyle={styles.content}>
      <TouchableOpacity
        style={[styles.allChip, activeTagIds.size === 0 && styles.allChipActive]}
        onPress={() => { Haptics.selectionAsync(); onClear(); }}
      >
        <Text style={[styles.allChipText, activeTagIds.size === 0 && styles.allChipTextActive]}>All</Text>
      </TouchableOpacity>
      {tags.map((tag) => {
        const active = activeTagIds.has(tag.id);
        return (
          <TouchableOpacity
            key={tag.id}
            style={[
              styles.chip,
              { borderColor: tag.color },
              active && { backgroundColor: tag.color },
            ]}
            onPress={() => { Haptics.selectionAsync(); onToggle(tag.id); }}
          >
            <Text style={[styles.chipText, { color: active ? '#FFF' : tag.color }]}>{tag.name}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const makeStyles = (palette: typeof palettes.light) => StyleSheet.create({
  bar: { flexGrow: 0 },
  content: { gap: spacing.sm, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, alignItems: 'center' },
  allChip: {
    paddingVertical: 6, paddingHorizontal: 14, borderRadius: radius.pill,
    backgroundColor: palette.surfaceSolid, borderWidth: 1, borderColor: palette.border,
  },
  allChipActive: { backgroundColor: palette.text },
  allChipText: { color: palette.textMuted, fontWeight: '700', fontSize: 13 },
  allChipTextActive: { color: palette.background },
  chip: { paddingVertical: 6, paddingHorizontal: 14, borderRadius: radius.pill, borderWidth: 1.5 },
  chipText: { fontWeight: '700', fontSize: 13 },
});
