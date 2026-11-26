import React from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';

const DEFAULT_PROMPTS = [
  'Summarize my spending this month',
  'Am I over budget?',
  'Send Rs. 2,000 to Ali Khan',
  'Check for suspicious transactions',
];

interface SuggestedPromptsProps {
  onSelect: (prompt: string) => void;
  disabled?: boolean;
}

export const SuggestedPrompts: React.FC<SuggestedPromptsProps> = ({
  onSelect,
  disabled,
}) => {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {DEFAULT_PROMPTS.map((prompt) => (
        <TouchableOpacity
          key={prompt}
          style={styles.pill}
          disabled={disabled}
          onPress={() => onSelect(prompt)}
          accessibilityRole="button"
          accessibilityLabel={`Suggested prompt: ${prompt}`}
        >
          <Text style={styles.pillText}>{prompt}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 8,
  },
  pill: {
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textDark,
  },
});
