import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { CheckCircle2, AlertCircle } from 'lucide-react-native';
import { colors } from '../../theme/colors';
import { ActiveToolChip } from '../../store/ai-store';

interface ToolActivityChipProps {
  chip: ActiveToolChip;
}

export const ToolActivityChip: React.FC<ToolActivityChipProps> = ({ chip }) => {
  return (
    <View
      style={styles.chip}
      accessible
      accessibilityLabel={`Tool activity: ${chip.label}, status ${chip.status}`}
    >
      {chip.status === 'running' ? (
        <ActivityIndicator size="small" color={colors.tealPrimary} />
      ) : chip.status === 'done' ? (
        <CheckCircle2 size={13} color={colors.success} />
      ) : (
        <AlertCircle size={13} color={colors.danger} />
      )}
      <Text style={styles.label} numberOfLines={1}>
        {chip.label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    maxWidth: 210,
  },
});
