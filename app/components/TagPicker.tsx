import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View, useColorScheme } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';
import { colorForTagName, palettes, radius, spacing } from '../../constants/design-tokens';
import type { Tag } from '../../types/todo';

interface TagPickerProps {
  selected: Tag[];
  suggestions: Tag[];
  onChange: (tags: Tag[]) => void;
}

let localTagId = -1; // negative ids mark not-yet-persisted tags created in this form

export default function TagPicker({ selected, suggestions, onChange }: TagPickerProps) {
  const scheme = useColorScheme();
  const palette = palettes[scheme === 'dark' ? 'dark' : 'light'];
  const styles = useMemo(() => makeStyles(palette), [palette]);
  const [draft, setDraft] = useState('');

  const selectedNames = useMemo(() => new Set(selected.map((t) => t.name.toLowerCase())), [selected]);

  const matches = useMemo(() => {
    const q = draft.trim().toLowerCase();
    if (!q) return [];
    return suggestions
      .filter((t) => t.name.toLowerCase().includes(q) && !selectedNames.has(t.name.toLowerCase()))
      .slice(0, 5);
  }, [draft, suggestions, selectedNames]);

  const addTag = (name: string, color?: string) => {
    const trimmed = name.trim();
    if (!trimmed || selectedNames.has(trimmed.toLowerCase())) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const existing = suggestions.find((t) => t.name.toLowerCase() === trimmed.toLowerCase());
    const tag: Tag = existing ?? { id: localTagId--, name: trimmed, color: color ?? colorForTagName(trimmed) };
    onChange([...selected, tag]);
    setDraft('');
  };

  const removeTag = (tag: Tag) => {
    Haptics.selectionAsync();
    onChange(selected.filter((t) => t.id !== tag.id));
  };

  return (
    <View>
      <View style={styles.chipRow}>
        {selected.map((tag) => (
          <Animated.View key={tag.id} entering={FadeIn.duration(150)} exiting={FadeOut.duration(120)} layout={LinearTransition.springify()}>
            <View style={[styles.chip, { backgroundColor: `${tag.color}22`, borderColor: tag.color }]}>
              <View style={[styles.dot, { backgroundColor: tag.color }]} />
              <Text style={[styles.chipText, { color: tag.color }]}>{tag.name}</Text>
              <TouchableOpacity onPress={() => removeTag(tag)} hitSlop={8}>
                <Ionicons name="close" size={14} color={tag.color} />
              </TouchableOpacity>
            </View>
          </Animated.View>
        ))}
        <View style={styles.inputWrap}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Add tag…"
            placeholderTextColor={palette.textFaint}
            style={styles.input}
            onSubmitEditing={() => addTag(draft)}
            returnKeyType="done"
          />
        </View>
      </View>

      {matches.length > 0 && (
        <Animated.View entering={FadeIn.duration(120)} exiting={FadeOut.duration(100)} style={styles.suggestRow}>
          {matches.map((tag) => (
            <TouchableOpacity key={tag.id} style={[styles.suggestChip, { borderColor: tag.color }]} onPress={() => addTag(tag.name, tag.color)}>
              <View style={[styles.dot, { backgroundColor: tag.color }]} />
              <Text style={[styles.chipText, { color: tag.color }]}>{tag.name}</Text>
            </TouchableOpacity>
          ))}
        </Animated.View>
      )}
    </View>
  );
}

const makeStyles = (palette: typeof palettes.light) => StyleSheet.create({
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, alignItems: 'center' },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 6, paddingHorizontal: 10, borderRadius: radius.pill, borderWidth: 1,
  },
  dot: { width: 7, height: 7, borderRadius: 4 },
  chipText: { fontSize: 13, fontWeight: '700' },
  inputWrap: {
    minWidth: 100, flexGrow: 1, borderRadius: radius.pill,
    borderWidth: 1.5, borderColor: palette.fieldBorder, backgroundColor: palette.fieldBackground,
  },
  input: { color: palette.text, fontSize: 14, paddingVertical: 6, paddingHorizontal: 12 },
  suggestRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.sm },
  suggestChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 5, paddingHorizontal: 9, borderRadius: radius.pill, borderWidth: 1, borderStyle: 'dashed',
  },
});
