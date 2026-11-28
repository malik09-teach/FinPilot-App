import React from 'react';
import { ScrollView, TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';

const PROMPTS = [
  { emoji: '📊', label: 'My spending this month' },
  { emoji: '💰', label: 'Am I over budget?' },
  { emoji: '💸', label: 'Send Rs. 2,000 to Ali' },
  { emoji: '🛡️', label: 'Check for fraud' },
  { emoji: '📈', label: 'BTC & Gold prices' },
  { emoji: '🎯', label: 'Save 100K in 4 months' },
];

interface SuggestedPromptsProps {
  onSelect: (prompt: string) => void;
  disabled?: boolean;
}

export const SuggestedPrompts: React.FC<SuggestedPromptsProps> = ({ onSelect, disabled }) => {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      style={styles.scroll}
    >
      {PROMPTS.map((p) => (
        <TouchableOpacity
          key={p.label}
          style={[styles.pill, disabled && styles.pillDisabled]}
          disabled={disabled}
          onPress={() => onSelect(p.label)}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={`Suggested: ${p.label}`}
        >
          <Text style={styles.pillEmoji}>{p.emoji}</Text>
          <Text style={[styles.pillText, disabled && styles.pillTextDisabled]}>{p.label}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scroll: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: 'rgba(226,232,240,0.5)',
  },
  row: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
    alignItems: 'center',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: 'rgba(0,212,148,0.2)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  pillDisabled: {
    opacity: 0.4,
    borderColor: 'rgba(226,232,240,0.5)',
  },
  pillEmoji: {
    fontSize: 14,
  },
  pillText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: colors.textDark,
  },
  pillTextDisabled: {
    color: colors.textMuted,
  },
});
