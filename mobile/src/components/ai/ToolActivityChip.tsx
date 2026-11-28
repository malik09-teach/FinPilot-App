import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { CheckCircle2, AlertCircle } from 'lucide-react-native';
import { colors } from '../../theme/colors';
import { ActiveToolChip } from '../../store/ai-store';

interface ToolActivityChipProps {
  chip: ActiveToolChip;
}

export const ToolActivityChip: React.FC<ToolActivityChipProps> = ({ chip }) => {
  const spinAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    if (chip.status === 'running') {
      Animated.loop(
        Animated.timing(spinAnim, { toValue: 1, duration: 900, useNativeDriver: true })
      ).start();
    }
  }, [chip.status]);

  const isRunning = chip.status === 'running';
  const isDone = chip.status === 'done';

  const chipBg = isRunning
    ? 'rgba(0,212,148,0.08)'
    : isDone
    ? 'rgba(16,185,129,0.08)'
    : 'rgba(239,68,68,0.07)';

  const chipBorder = isRunning
    ? 'rgba(0,212,148,0.3)'
    : isDone
    ? 'rgba(16,185,129,0.3)'
    : 'rgba(239,68,68,0.25)';

  return (
    <Animated.View
      style={[styles.chip, { backgroundColor: chipBg, borderColor: chipBorder, opacity: fadeAnim }]}
      accessible
      accessibilityLabel={`${chip.label}: ${chip.status}`}
    >
      {isRunning ? (
        <View style={styles.spinnerWrap}>
          <View style={styles.spinnerRing} />
          <View style={styles.spinnerDot} />
        </View>
      ) : isDone ? (
        <CheckCircle2 size={13} color={colors.success} />
      ) : (
        <AlertCircle size={13} color={colors.danger} />
      )}

      <Text style={[styles.label, { color: isRunning ? colors.tealPrimary : isDone ? colors.success : colors.danger }]} numberOfLines={1}>
        {chip.label}
      </Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderWidth: 1.5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  spinnerWrap: {
    width: 13,
    height: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinnerRing: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.tealPrimary,
    borderTopColor: 'transparent',
  },
  spinnerDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.tealPrimary,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    maxWidth: 200,
  },
});
